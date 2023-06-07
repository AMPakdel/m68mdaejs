const { dialog } = require("electron");
const env = require("../env");
const Network = require("../lib/Network");
const Error = require("../models/Error");
const { getDeviceUUID, getPlatform, getPlatformVersion, getAppVersion } = require("./os");
const statics = require("./statics");

function showErrorDialog(id, message, data){

    let title = "Error on "+id;
    let content = "";
    if(data && typeof data == "object"){
        let sd = JSON.stringify(data);
        content += sd+"\n";
    }
    if(message){
        content += message;
    }
    
    dialog.showErrorBox(title, content);
}

/**
 * 
 * @param {String} id 
 * @param {String} message 
 * @param {Object|null} data  
 */
async function showError(id, message, data){

    if(!message || !message.toString){
        message = id;
    }

    if(env.environment === "dev"){

        console.log(message);
        
    }else if (env.environment === "test"){

        showErrorDialog(id, message, data);

    }else { //deploy mode

        let error = Error.findOne({id});

        if(!error){

            error = {id, count:0, last_sent_timestamp:0};
            Error.create(error);
        }

        if(error.last_sent_timestamp < Date.now() - env.error_report_time){

            let recieved_data = JSON.stringify({
                "uid": getDeviceUUID(),
                "platform": getPlatform(),
                "platform_version": getPlatformVersion(),
                "app_version": getAppVersion(),
            });

            let sent_data = "";
            if(data && typeof data == "object"){
                data.error_id = id;
            }else{
                data = {error_id:id};
            }
            sent_data = JSON.stringify(data);

            let params = {recieved_data, sent_data, message}

            console.log(params);
            
            Network.post(statics.urls.REPORT_ERROR, params, {}, (err, data)=>{

                if(err){

                    showLog("err->"+err);

                }else{

                    if(data.result_code == statics.SC.SUCCESS){

                        Error.update({id}, {count:0, last_sent_timestamp:Date.now()});
    
                    }else{
    
                        Error.update({id}, {count:(error.count+1)});
                    }
                }
            });

        }else{

            Error.update({id}, {count:(error.count+1)});
        }

        await Error.sync();

        showErrorDialog(id, message, data);
    }
}

function showLog(message){

    if(env.environment === "dev"){

        console.log(message);
        
    }else if (env.environment === "test"){

        console.log(message);

    }else { //deploy mode

        console.log(message);
    }
}

module.exports = {
    showError,
    showLog,
    showErrorDialog,
}