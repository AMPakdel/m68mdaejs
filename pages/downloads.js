const { ipcMain } = require("electron");
const { getDownloadManager } = require("../lib/DownloadManager");
const Page = require("../lib/Page");
const Course = require("../models/Course");
const Download = require("../models/Download");
const User = require("../models/User");

class Downloads extends Page{

    async onDidMount(){

        ipcMain.handle("download:start", this.startDownload);
        ipcMain.handle("download:pause", this.pauseDownload);
        ipcMain.handle("download:cancel", this.cancelDownload);
        ipcMain.handle("download:show_content", this.showContent);

        this.dlm = getDownloadManager();

        let downloads = Download.findAll();

        this.mainWindow.webContents.send("downloads:set_list", downloads);

        //change download notification count
        let user = User.findOne({id:1});
        user.download_notifications = 0;
        User.update({id:1}, {download_notifications:user.download_notifications});
        
        this.mainWindow.webContents.send("menu:on_notification_change", user.download_notifications);
    }

    onWillUnmount(){

        Download.delete({status:"finished"});
        
        ipcMain.removeHandler("download:start", this.startDownload);
        ipcMain.removeHandler("download:pause", this.pauseDownload);
        ipcMain.removeHandler("download:cancel", this.cancelDownload);
        ipcMain.removeHandler("download:show_content", this.showContent);
    }

    startDownload = async(event, {course_pk, content})=>{

        let start_dl_res = await this.dlm.startDownload(course_pk, content);

        if(start_dl_res.error){

            showError("downloads-1", start_dl_res.error);
            return;
        }
    }

    pauseDownload = (event, upload_key)=>{

        this.dlm.pauseDownload(upload_key);
    }

    cancelDownload = (event, upload_key)=>{

        this.dlm.cancelDownload(upload_key);
    }

    showContent = (event, {course_pk, upload_key})=>{

        let course = Course.findOne({pk:course_pk});

        if(course){

            course.app_selected_upload_key = upload_key;

            this.router.openPage("player", course);
        }
    }
}

module.exports = Downloads;