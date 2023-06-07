const FileDirAccess = require("../lib/FileDirAccess");
const DatabaseCore = require("../lib/DatabaseCore");
const Page = require("../lib/Page");
const { showError, showLog } = require("../utils/log");
const Network = require("../lib/Network");
const statics = require("../utils/statics");
const { getPlatform, getAppVersion, getDeviceUUID } = require("../utils/os");
const { ipcMain, shell } = require("electron");
const Database = require("../lib/Database");
const Course = require("../models/Course");
const DownloadManager = require("../lib/DownloadManager");
const FileManager = require("../lib/FileManager");
const User = require("../models/User");

class Splash extends Page{

    async onDidMount(){

        ipcMain.handle("splash:retry_connection", this.retryConnection);
        ipcMain.handle("splash:continue_without_update", this.continueWithoutUpdate);
        ipcMain.handle("splash:open_update_url", this.openUpdateUrl);

        let fileDirAccess = new FileDirAccess();
        let fileDirAccess_check_res = await fileDirAccess.check();

        if(fileDirAccess_check_res.error){
            showError("splash-1", configApp_check_res.error);
            return;
        }

        let dbcore = new DatabaseCore();
        let dbcore_check_res = await dbcore.check();

        if(dbcore_check_res.error){
            showError("splash-2", dbcore_check_res.error);
            return;
        }

        let db_check_res = await Database.init(dbcore);

        if(db_check_res.error){
            showError("splash-3", db_check_res.error);
            return;
        }

        DownloadManager.init(this.mainWindow);

        FileManager.init(Database.getDB());

        await this.checkUser();

        setTimeout(()=>{
            this.checkVersion();
        }, 200);
        
    }

    onDestroy(){

        ipcMain.removeHandler("splash:retry_connection", this.retryConnection);
        ipcMain.removeHandler("splash:continue_without_update", this.continueWithoutUpdate);
        ipcMain.removeHandler("splash:open_update_url", this.openUpdateUrl);
    }

    checkUser = async()=>{

        let user = User.findOne({id:1});
        if(!user){
            this.createNewUser();
            user = User.findOne({id:1});
        }

        let duid = getDeviceUUID();

        showLog("getDeviceUUID:"+duid+" and user.device_uid:"+user.device_uid);

        //security check
        if(duid != user.device_uid){

            showLog("getDeviceUUID:"+duid+" != user.device_uid:"+user.device_uid);

            //delete the whole data
            let db = Database.getDB();
            db.downloads = [];
            db.courses = [];
            user.device_uid = duid;
            db.user = [user];
            await db.save();
        }
    }

    checkVersion = ()=>{

        let params = {
            platform: getPlatform(),
            app_version: getAppVersion(),
        };

        Network.post(statics.urls.CHECK_VERSION, params, {}, (err, res)=>{

            if(!err){

                if(res.result_code==statics.SC.SUCCESS){

                    this.goToNextPage();

                }else if(res.result_code==statics.SC.SHOULD_UPDATE){

                    let user = User.findOne({id:1});
                    if(user.skip_update_modal){

                        if(res.data.version_code != user.skip_update_modal){

                            this.mainWindow.webContents.send("splash:show_update_modal", res.data);

                        }else{
                            
                            this.goToNextPage();
                        }

                    }else{
                        
                        this.mainWindow.webContents.send("splash:show_update_modal", res.data);
                    }
                    

                }else if(res.result_code){

                    showError("splash-4", "result_code:"+res.result_code);

                }else{

                    this.mainWindow.webContents.send("splash:show_update_modal", res.data);
                    
                    showError("splash-5", err);
                    return;
                }

            }else if(err == "timeout"){

                this.mainWindow.webContents.send("splash:failed_connection");                

            }else{

                showError("splash-6", err);
                return;
            }
        });
    }

    retryConnection = ()=>{

        setTimeout(()=>{
            this.checkVersion();
        }, 1000);
    }

    openUpdateUrl = (event, url)=>{

        shell.openExternal(url);
    }

    goToNextPage = ()=>{

        let courses = Course.findAll();

        if(courses.length){

            this.router.openPage("myCourses");

        }else{

            this.router.openPage("addCourse");
        }
    }

    continueWithoutUpdate = (event, data)=>{

        if(data.skip_update_modal){
            User.update({id:1}, {skip_update_modal: data.skip_update_modal});
        }

        this.goToNextPage();
    }

    createNewUser = ()=>{

        User.create({
            id:1,
            sort_mode: "sm_newest",
            download_notifications: 0,
            device_uid: getDeviceUUID(),
            skip_update_modal : false,
        });
    }
}

module.exports = Splash;