const { BrowserWindow } = require("electron");
const EasyDl = require("easydl");
const Course = require("../models/Course");
const { showError, showLog } = require("../utils/log");
const path = require("path");
const Download = require("../models/Download");
const fs = require("fs");
const { createDirIfNotExists } = require("./FileDirAccess");
const { uploadKey2Ext } = require("../utils/helpers");
const User = require("../models/User");
const FileManager = require("./FileManager");


class DownloadManager {

    /**
     * @type {DownloadManager}
     */
    static #dlm;

    /**
     * @type {BrowserWindow}
     */
    mainWindow;

    /**
     * @type {{EasyDl}}
     */
    dlObjects = {};

    /**
     * @type {any}
     */
    dlListeners = {};

    constructor(mainWindow){

        this.mainWindow = mainWindow;
    }

    /**
     * @param {BrowserWindow} mainWindow 
     */
    static init(mainWindow){

        DownloadManager.#dlm = new DownloadManager(mainWindow);

        //TODO:: load all db downloads
    }

    /**
     * 
     * @returns {DownloadManager}
     */
    static getDownloadManager(){

        if(!DownloadManager.#dlm){
            throw new Error("DownloadManager is not initialized!");
        }

        return DownloadManager.#dlm;
    }

    startDownload(course_pk, content){

        return new Promise(async(resolve, reject)=>{

            let upload_key = content.upload_key;

            let course = Course.findOne({pk:course_pk});

            //check diskspace
            let diskcheck_res = await FileManager.getFileManager().checkEnoughSpace(content.size, course.store_dir);
            if(diskcheck_res.error){
                showError("DownloadManager-1", diskcheck_res.error);
            }else{
                if(!diskcheck_res.result){
                    this.mainWindow.webContents.send("download:did_cancel", {upload_key});
                    resolve({error:"not_enough_space"});
                    return;
                }
            }

            if(course){

                let dl_temp_path = path.join(course.store_dir, "/temp");
                let file_temp_path = path.join(dl_temp_path, `/${upload_key}.${uploadKey2Ext(upload_key)}`);

                let exist_temp_res = await createDirIfNotExists(dl_temp_path);
                
                if(exist_temp_res.error){

                    showError("DownloadManager-2", exist_temp_res.error);
                    return;
                }

                this.dlObjects[upload_key] = new EasyDl(
                    content.url,
                    file_temp_path,
                    {connections:8, maxRetry:5, existBehavior:"overwrite"}
                );

                this.dlListeners[upload_key] = {
                    "progress": [],
                    "end": [],
                    "error": [],
                };

                this.dlObjects[upload_key].on("progress", (progress)=>{
                    
                    if(this.dlListeners[upload_key]&&Array.isArray(this.dlListeners[upload_key]["progress"])){

                        this.dlListeners[upload_key]["progress"].forEach(func=>{
                            func(progress);
                        });
                    }
                });

                this.dlObjects[upload_key].on("error", (err)=>{

                    if(this.dlListeners[upload_key]&&Array.isArray(this.dlListeners[upload_key]["error"])){

                        this.dlListeners[upload_key]["error"].forEach(func=>{
                            func(err);
                        });
                    }
                });
        
                this.dlObjects[upload_key].on("end", ()=>{

                    if(this.dlListeners[upload_key]&&Array.isArray(this.dlListeners[upload_key]["end"])){

                        this.dlListeners[upload_key]["end"].forEach(func=>{
                            func();
                        });
                    }
                });
        
                this.dlObjects[upload_key].on("metadata", (metadata)=>{

                    Download.update({upload_key}, {size: metadata.size, status: "downloading"});

                    this.mainWindow.webContents.send("download:did_start", {upload_key});
                });

                let download = Download.findOne({upload_key});

                    if(!download){

                        Download.create({
                            course_pk,
                            store_dir: course.store_dir,
                            course_title: course.title,
                            title: content.title,
                            status: "loading",
                            ext: content.ext,
                            size: content.size,
                            type: content.type,
                            upload_key,
                            url: content.url,
                            percent: 0,
                            downloaded_size: 0,
                        });

                        //change download notification count
                        let user = User.findOne({id:1});
                        user.download_notifications +=1;
                        User.update({id:1}, {download_notifications:user.download_notifications});
                        
                        this.mainWindow.webContents.send("menu:on_notification_change", user.download_notifications);
                    }

                this.setupStartingListeners(this.dlListeners[upload_key], upload_key);

                this.dlObjects[upload_key].start();

                resolve({error:null});

                return;

            }else{

                resolve({error:"wtf- course was not found for starting the download"});
                return;
            }
        });
    }

    setupStartingListeners(listeners, upload_key){

        listeners["progress"].push((progress)=>{

            this.mainWindow.webContents.send("download:progress", {upload_key, progress});

            let download = Download.findOne({upload_key});

            if(download){

                download.status = "downloading";

                if(progress.total){
                    download.percent = Math.floor(progress.total.percentage);
                    download.downloaded_size = progress.total.bytes;
                }

            }else{

                this.pauseDownload(upload_key);
            }
        });

        listeners["error"].push((error)=>{

            this.mainWindow.webContents.send("download:error", {upload_key, error});
        });

        listeners["end"].push(async ()=>{

            let move_res = await this.moveFinishedDownload(upload_key);

            if(move_res.error){

                showError("DownloadManager-3", move_res.error);
                return;
            }

            let download = Download.findOne({upload_key});

            download.status = "finished";
            download.percent = 100;
            download.downloaded_size = download.size;

            Download.update({upload_key}, download);

            this.mainWindow.webContents.send("download:finished", {upload_key});

            let db_sync_res = await Download.sync();

            if(db_sync_res.error){

                showError("DownloadManager-4", db_sync_res.error);
                return;
            }
        });
    }

    moveFinishedDownload=(upload_key)=>{
        
        return new Promise(async (resolve, reject)=>{

            let download = Download.findOne({upload_key});

            if(download){

                let file_temp_path = path.join(download.store_dir, `/temp/${upload_key}.${uploadKey2Ext(upload_key)}`);
                let file_path = path.join(download.store_dir, `/${upload_key}.${uploadKey2Ext(upload_key)}`);
                
                fs.rename(file_temp_path, file_path, (err)=>{

                    resolve({error:err});
                });
    
            }else{

                resolve({error:"moveFinishedDownload: could not find the download"});
            }
        });
    }


    pauseDownload = async(upload_key)=>{

        if(this.dlObjects[upload_key]){

            Download.update({upload_key}, {status: "loading"});

            this.dlObjects[upload_key].destroy();

            delete this.dlObjects[upload_key];

            delete this.dlListeners[upload_key];

            let db_sync_res = await Download.sync();

            if(db_sync_res.error){

                showError("DownloadManager-5",db_sync_res.error);
                return;
            }

            Download.update({upload_key}, {status: "paused"});

            this.mainWindow.webContents.send("download:did_pause", {upload_key});

        }else{

            showError("DownloadManager-6", "wtf - this.dlObjects[upload_key] is undefined!");
            return;
        }
    }

    cancelDownload = async(upload_key)=>{

        let cleanTempFiles_res = await this.cleanTempFiles(upload_key);

        if(cleanTempFiles_res.error){

            showError("DownloadManager-7", cleanTempFiles_res.error);
            return;
        }

        if(this.dlObjects[upload_key]){

            this.dlObjects[upload_key].destroy();

            delete this.dlObjects[upload_key];

            delete this.dlListeners[upload_key];
        }

        Download.delete({upload_key});

        let db_sync_res = await Download.sync();

        if(db_sync_res.error){

            showError("DownloadManager-8", db_sync_res.error);
            return;
        }

        this.mainWindow.webContents.send("download:did_cancel", {upload_key});
    }

    cleanTempFiles = (upload_key)=>{

        return new Promise(async(resolve)=>{

            let dl = Download.findOne({upload_key});

            let dir_path =  path.join(dl.store_dir, "/temp/");

            fs.readdir(dir_path, (err, files) => {

                if(err){

                    resolve({error:err});

                }else{

                    let target_files = [];
                    files.forEach(file => {
                        if(file.search(upload_key) !== -1){
                            target_files.push(file);
                        }
                    });

                    for(const f of target_files){

                        try{
                            let p = path.join(dir_path, f);
                            let fd = fs.openSync(p);
                            if(fd){
                                fs.closeSync(fd);
                                fs.unlinkSync(p);
                            }
                        }catch(e){
                            showLog(e);
                        }
                    }
                    
                    resolve({error:null});
                }

              });
        });
    }

    cleanCourseTempFiles = (course_pk)=>{

        return new Promise( async(resolve)=>{

            let downloads = Download.find({course_pk});

            for(const dl of downloads){
                
                let cleant_res = await this.cleanTempFiles(dl.upload_key);

                if(cleant_res.error){
                    showLog(cleant_res.error);
                }
            }

            resolve({error:null});
        });
    }

    deleteCourseDownloads = (course_pk)=>{

        return new Promise(async (resolve)=>{

            Download.delete({course_pk});

            let sync_res = await Download.sync();

            resolve(sync_res);
        });
    }
}

module.exports = DownloadManager;