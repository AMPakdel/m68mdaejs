const { ipcMain, shell } = require("electron");
const env = require("../env");
const Network = require("../lib/Network");
const Page = require("../lib/Page");
const { getPlatform, getPlatformVersion, getAppVersion } = require("../utils/os");
const statics = require("../utils/statics");
const { urls } = require("../utils/statics");

class Settings extends Page{

    async onDidMount(){

        ipcMain.handle("settings:open_help_link", this.openHelpLink);
        ipcMain.handle("settings:send_report_message", this.sendReportMessage);
    }

    onWillUnmount(){

        ipcMain.removeHandler("settings:open_help_link", this.openHelpLink);
        ipcMain.removeHandler("settings:send_report_message", this.sendReportMessage);
    }

    openHelpLink=()=>{

        let url = env.help_page_link;

        shell.openExternal(url);
    }

    sendReportMessage=(event, data)=>{

        let params = {
            platform: getPlatform(),
            platform_version: getPlatformVersion(),
            app_version: getAppVersion(),
            phone_number: data.email,
            title: data.title,
            content: data.message,
        };

        Network.post(urls.SEND_COMMENTS, params, {}, (err, data)=>{

            if(!err){

                if(data.result_code == statics.SC.SUCCESS){

                    this.mainWindow.webContents.send("settings:did_send_report_message");
                    
                }else{

                    showError("settings-1", "result_code:"+data.result_code);
                }

            }else{

                showError("settings-2", err);
                return;
            }
        });
    }
}

module.exports = Settings;