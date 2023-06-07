const { showError, showLog, showErrorDialog } = require("../utils/log");
const { getVideoTempDir } = require("../utils/fs");
const Decryption = require("./Decryption");
const PlayerServer = require("./PlayerServer");
const fs = require("fs");
const Player = require("../pages/player");
const env = require("../env");
const { contentHeadingSort, uploadKey2Ext } = require("../utils/helpers");
const path = require("path");
const Download = require("../models/Download");
const { createDirIfNotExists } = require("./FileDirAccess");
const FileManager = require("./FileManager");

class CoursePlayer{

    /**
     * 
     * @param {*} course 
     * @param {Player} playerPage 
     */
    constructor(course, playerPage){

        this.course = course;
        this.playerPage = playerPage;

        this.courseHeadings = contentHeadingSort(this.course);
    }

    async loadPlayList(){

        await this.setContentStatus();
        this.playerPage.mainWindow.webContents.send("player:play_list_data", this.courseHeadings);
    }

    async setContentStatus(){

        for(const heading of this.courseHeadings){

            for(const content of heading.contents){

                let status_res = await this.getContentStatus(content);

                if(status_res.error){

                    showError("CoursePlayer-1", "error on getContentStatus -> "+ content.upload_key+ 
                    ", error:"+status_res.error);

                    content.download_status = "need_download";

                }else{

                    content.download_status = status_res.data.status;
                    content.download_percent = status_res.data.download_percent;
                }
            }
        }
    }

    async getContentStatus(content){

        try{
            content.ext = uploadKey2Ext(content.upload_key);

            let file_path = path.join(this.course.store_dir, content.upload_key+"."+content.ext);
            let exist = fs.existsSync(file_path);

            if(exist){

                return {data:{status:"finished", download_percent:100}, error:null};

            }else{

                let dl = Download.findOne({upload_key:content.upload_key});

                if(dl && dl.status != "finished"){

                    return {data:{status:dl.status, download_percent:dl.percent}, error:null};

                }else{

                    return {data:{status:"need_download", download_percent:0}, error:null};
                }
            }

        }catch(e){

            return {data:null, error:e};
        }
    }

    play(content_upk){

        return new Promise(async (resolve)=>{

            try{

                let release_res = await this.release();

                if(release_res.error){
                    resolve({error:release_res.error});                
                    return;
                }

                let content = null;

                this.course.contents.forEach(c => {
                    if(c.upload_key === content_upk){
                        content = c;
                    }
                });

                if(!content){
                    resolve({error:"play: content witl upload_key: "+content_upk+" did not found in this course"});
                    return;
                }

                //check diskspace
                let diskcheck_res = await FileManager.getFileManager().checkEnoughSpace((content.size * 2), getVideoTempDir());

                if(diskcheck_res.error){
                    showError("CoursePlayer-2", diskcheck_res.error);
                }else{
                    if(!diskcheck_res.result){
                        resolve({error:"not_enough_space"});
                        return;
                    }
                }

                let source_path = path.join(this.course.store_dir, content.upload_key+"."+uploadKey2Ext(content.upload_key));

                let source_exist_res = await FileManager.getFileManager().fileExists(source_path);

                if(source_exist_res.error){
                    showError("CoursePlayer-3", source_exist_res.error);
                    return;
                }

                let secure_mode = false;

                if(content.encoding){

                    secure_mode = true;

                    let check_temp_dir = await createDirIfNotExists(getVideoTempDir());

                    if(check_temp_dir.error){
                        resolve({error:"createVideoTempDir error: "+check_temp_dir.error});
                        return;
                    }
                    
                    let temp_file_path = path.join(getVideoTempDir(), ".bin");

                    let decryption_res = await Decryption.decrypt(
                        source_path,
                        temp_file_path,
                        content.enc_key,
                        content.iv
                    );

                    if(decryption_res.error){
                        resolve({error:"decryption error: "+decryption_res.error});
                        return;
                    }

                    source_path = temp_file_path;
                }

                let content_type = "video/mp4";

                if(content.ext == "mp3"){
                    
                    content_type = "audio/mpeg";
                }

                this.player_server = new PlayerServer(source_path, secure_mode, content_type);

                let start_playerServer_res = await this.player_server.start();

                if(start_playerServer_res.error){
                    resolve({error:"start_playerServer error: "+start_playerServer_res.error});
                    return;
                }

                resolve({error:null});

            }catch(e){

                showLog(e);
            }
        });
    }

    release(){

        return new Promise(async(resolve)=>{

            if(this.player_server){

                let close_res = await this.player_server.close();
    
                if(close_res.error){

                    resolve({error:"close player server error: "+close_res.error});
                    return;

                }else{

                    delete this.player_server;

                    resolve({error:null});
                }

            }else{

                resolve({error:null});
            }
        });
    }
}

module.exports = CoursePlayer;