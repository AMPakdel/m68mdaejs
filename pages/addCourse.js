const { dialog, ipcMain, shell } = require("electron");
const Database = require("../lib/Database");
const Network = require("../lib/Network");
const Page = require("../lib/Page");
const Course = require("../models/Course");
const User = require("../models/User");
const { showError, showErrorDialog } = require("../utils/log");
const { getDefaultCourseDir } = require("../utils/fs");
const { getAppVersion, getPlatform, getDeviceUUID, getPlatformVersion } = require("../utils/os");
const statics = require("../utils/statics");
const { urls } = require("../utils/statics");

class AddCourse extends Page{

    onDidMount(){

        this.selected_path = getDefaultCourseDir();
        this.mainWindow.webContents.send("addCourse:set_store_path", this.selected_path);

        ipcMain.handle("addCourse:open_dir_select", this.onDirSelect);
        ipcMain.handle("addCourse:open_help_link", this.openHelpLink);
        ipcMain.handle("addCourse:confirm", this.onConfirm);
    }

    onWillUnmount(){

        ipcMain.removeHandler("addCourse:open_dir_select", this.onDirSelect);
        ipcMain.removeHandler("addCourse:open_help_link", this.openHelpLink);
        ipcMain.removeHandler("addCourse:confirm", this.onConfirm);
    }

    openHelpLink = ()=>{

        shell.openExternal(statics.links.ADD_COURSE_HELP);
    }

    onDirSelect = ()=>{
        let options = {
            // See place holder 1 in above image
            //title : "Custom title bar", 
        
            // See place holder 2 in above image
            //defaultPath : "D:\\electron-app",
        
            // See place holder 3 in above image
            //buttonLabel : "Custom button",
        
            properties: ['openDirectory'],//['openFile','multiSelections']
        }
           
        //Or asynchronous - using callback
        dialog.showOpenDialog(this.mainWindow, options).then((res) => {

            if(!res.canceled){
                this.selected_path = res.filePaths[0];
                this.mainWindow.webContents.send("addCourse:set_store_path", this.selected_path);
            }
        });
    }

    onConfirm = (event, inputs)=>{

        let params = {
            "device_info":{
                "uid": getDeviceUUID(),
                "platform": getPlatform(),
                "platform_version": getPlatformVersion(),
                "app_version": getAppVersion(),
            },
            "lk": inputs.lk
        };

        Network.post(urls.REGISTER, params, {}, (err, data)=>{

            //TODO:: add timeout handler
            if(!err){

                if(data.result_code == statics.SC.SUCCESS){

                    this.saveCourseData(data.data, inputs.lk);
                    
                }else if(data.result_code == statics.SC.REACHED_MAX_DEVICE_REGISTERED){

                    this.mainWindow.webContents.send("addCourse:confirm_error", 
                    "این کد خرید در دستگاه دیگر فعال شده است.");

                }else if(data.result_code == statics.SC.INVALID_LICENSE_KEY){

                    this.mainWindow.webContents.send("addCourse:confirm_error", 
                    "کد خرید نامعتبر است.");

                }else{
                    showError("addCourse-1", "result_code:"+data.result_code);
                }

            }else{

                showErrorDialog("addCourse-1", err);
                return;
            }
        });
    }

    saveCourseData = (course_data, lk)=>{

        let c = course_data;

        let db_c = c.course;
        db_c.lk = lk;
        db_c.user_info = c.user_info;
        db_c.store_dir = this.selected_path;
        db_c.last_viewed_timestamp = 0;
        db_c.last_sync_timestamp = Date.now();

        Course.create(db_c);

        Course.sync().then((res)=>{

            if(res.error){
                throw new Error("Model syncing error:; "+error);
            }else{
                this.goToMyCourses();
            }
        });

        // setting the sort mode to newest to show the new course on top
        let user = User.findOne({id:1});
        user.sort_mode = "sm_newest";
    }

    goToMyCourses = ()=>{

        this.router.openPage("myCourses");
    }
}

module.exports = AddCourse;