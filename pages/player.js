const { ipcMain, shell } = require("electron");
const CoursePlayer = require("../lib/CoursePlayer");
const { getDownloadManager } = require("../lib/DownloadManager");
const DownloadManager = require("../lib/DownloadManager");
const { createDirIfNotExists } = require("../lib/FileDirAccess");
const Page = require("../lib/Page");
const Course = require("../models/Course");
const { showError } = require("../utils/log");
const { uploadKey2Ext } = require("../utils/helpers");
const path = require("path");
const env = require("../env");
const statics = require("../utils/statics");
const Network = require("../lib/Network");
const { getDeviceUUID } = require("../utils/os");

class Player extends Page{

    /**
     * @type {DownloadManager}
     */
    dlm;

    /**
     * @type {CoursePlayer}
     */
    coursePlayer;

    async onDidMount(){

        ipcMain.handle("player:load_player", this.loadPlayer);
        ipcMain.handle("player:content_select", this.contentSelect);
        ipcMain.handle("player:release_player", this.releasePlayer);
        ipcMain.handle("download:start", this.startDownload);
        ipcMain.handle("download:pause", this.pauseDownload);
        ipcMain.handle("player:open_document", this.openDocument);
        ipcMain.handle("player:open_creator_site", this.openCreatorSite);
        ipcMain.handle("player:open_course_page", this.openCoursePage);

        this.dlm = getDownloadManager();

        this.course = this.data;

        //check last_sync_timestamp
        if(this.course.last_sync_timestamp < Date.now() - env.course_outdate_time){

            let update_res = await this.updateCourse();

            if(update_res.error){

                showError("player-1", update_res.error);
            }
        }

        //check if course store dir is still exists
        let check_temp_dir_res =  await createDirIfNotExists(this.course.store_dir);

        if(check_temp_dir_res.error){

            showError("player-2", check_temp_dir_res.error);
            return;
        }

        this.coursePlayer = new CoursePlayer(this.course, this);

        await this.coursePlayer.loadPlayList();
        
        //update last_viewed_timestamp of this course
        Course.update({pk:this.course.pk}, {last_viewed_timestamp: Date.now()});
    }

    onWillUnmount(){

        ipcMain.removeHandler("player:load_player", this.loadPlayer);
        ipcMain.removeHandler("player:content_select", this.contentSelect);
        ipcMain.removeHandler("player:release_player", this.releasePlayer);
        ipcMain.removeHandler("download:start", this.startDownload);
        ipcMain.removeHandler("download:pause", this.pauseDownload);
        ipcMain.removeHandler("player:open_document", this.openDocument);
        ipcMain.removeHandler("player:open_creator_site", this.openCreatorSite);
        ipcMain.removeHandler("player:open_course_page", this.openCoursePage);

        this.coursePlayer.release();
    }

    startDownload = async(event, {course_pk, content})=>{

        let start_dl_res = await this.dlm.startDownload(course_pk, content);

        if(start_dl_res.error){

            if(start_dl_res.error === "not_enough_space"){

                this.mainWindow.webContents.send("main:not_enough_space");

                return;

            }else{

                showError("player-3", start_dl_res.error);

                return;
            }
        }
    }

    loadPlayer = async(event, upload_key)=>{

        let play_res = await this.coursePlayer.play(upload_key);

        if(play_res.error){

            if(play_res.error === "not_enough_space"){

                this.mainWindow.webContents.send("main:not_enough_space");

                return;

            }else{

                showError("player-4", play_res.error);

                return;
            }
        }

        this.mainWindow.webContents.send("player:load_player_done", "http://localhost:"+env.player_server_port+"/"+upload_key);
    }

    contentSelect = (event, {course_pk, upload_key})=>{

        let course = Course.findOne({pk:course_pk});

        if(course){

            course.app_selected_upload_key = upload_key;
        }
    }

    releasePlayer = (event, upload_key)=>{

        if(this.coursePlayer){

            let play_res = this.coursePlayer.release();

            if(play_res.error){

                showError("player-5", "startPlaying: play_res.error->"+play_res.error);
                return;
            }
        }

        this.mainWindow.webContents.send("player:release_player_done", upload_key);
    }

    pauseDownload = (event, upload_key)=>{

        this.dlm.pauseDownload(upload_key);
    }

    openDocument = (event, {course_pk, upload_key})=>{

        let course = Course.findOne({pk:course_pk});
        let store_dir = course.store_dir;
        shell.openPath(path.join(store_dir, upload_key+"."+uploadKey2Ext(upload_key)));
    }

    openCreatorSite = (event, course)=>{

        let url = "http://"+course.user_info.username+".minfo.ir";
        shell.openExternal(url);
    }

    openCoursePage = async (event, course)=>{
        
        let url = "http://"+course.user_info.username+".minfo.ir/course/"+course.id+
        course.title.split(" ").join("-");
        shell.openExternal(url);
    }

    updateCourse = ()=>{

        let params = {
            lk: this.course.lk,
            uid: getDeviceUUID(),
            username :  this.course.user_info.username,
        }

        return new Promise(async(resolve, reject)=>{

            Network.post(statics.urls.LOAD_COURSE, params, {}, async(err, data)=>{

                if(err){

                    resolve({error:err});
                    return;
                    
                }else{
                    
                    let db_c = data.data;
                    db_c.lk = this.course.lk;
                    db_c.user_info = this.course.user_info;
                    db_c.store_dir = this.course.store_dir;
                    db_c.last_viewed_timestamp = this.course.last_viewed_timestamp;
                    db_c.last_sync_timestamp = Date.now();

                    Course.update({pk: this.course.pk}, db_c);

                    Course.sync().then((res)=>{

                        if(res.error){

                            resolve({error:"Model syncing error: "+error});
                            return;

                        }else{

                            resolve({error: null});
                            return;
                        }
                    });
                }
            });
        });
    }
}

module.exports = Player;