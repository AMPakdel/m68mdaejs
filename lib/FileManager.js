const fs = require("fs");
const Course = require("../models/Course");
const path = require("path");
const { uploadKey2Ext } = require("../utils/helpers");
const { getVideoTempDir } = require("../utils/fs");
const { showLog } = require("../utils/log");
const checkDiskSpace = require('check-disk-space').default

class FileManager {

    /**
     * @type {FileManager}
     */
    static #fm;
    #db;

    constructor(db){

        this.#db = db;
    }

    static init(db){

        this.#fm = new FileManager(db);
    }

    static getFileManager(){

        return this.#fm;
    }

    fileExists(fp, mode){

        return new Promise((resolve)=>{
            fs.access(fp, mode, (err)=>{
                if(err){
                    resolve({error:err});
                }else{
                    resolve({error:null});
                }
            });
        });  
    }

    /**
     * 
     * @param {number} size 
     * @param {string} path 
     * @returns {Promise<{result:boolean|null error:Error|null}>}
     */
    checkEnoughSpace(size, path){

        return new Promise((resolve, reject)=>{

            if(!size){
                resolve({result:true, error:null});
            }

            checkDiskSpace(path).then((diskSpace) => {

                //size = 18381039923;
                //size = 15569256448;

                let free = diskSpace.free;

                let req = Math.floor(size * 1.2);

                if(free < req){

                    resolve({result:false, error:null});

                }else{

                    resolve({result:true, error:null});
                }

            }).catch(e=>{

                resolve({error:e, result:null});
            });
        });
    }

    deleteFile(fp){

        return new Promise((resolve)=>{
            fs.unlink(fp, (err)=>{
                if(err){
                    resolve({error:err});
                }else{
                    resolve({error:null});
                }
            });
        });
    }

    deleteCourseContents(course_pk){

        return new Promise(async (resolve)=>{

            let course = Course.findOne({pk:course_pk});

            if(!course){

                resolve({error:"deleteCourseContents: course with pk:"+course_pk+" not found!"});
                return;
            }

            let store_dir = course.store_dir;

            for(const con of course.contents){

                let pth = path.join(store_dir, con.upload_key+"."+uploadKey2Ext(con.upload_key));

                let fsexist_res = await this.fileExists(pth);

                if(!fsexist_res.error){

                    let fsdel_res = await this.deleteFile(pth);

                    if(fsdel_res.error){

                        showLog("deleteCourseContents::"+fsdel_res.error);
                    }
                }
            }

            resolve({error:null});
        });
    }

    deletePlayerTempFiles(){

        return new Promise((resolve)=>{

            try{

                let dir = getVideoTempDir();

                fs.readdir(dir, async(err, files) => {

                    if (err){

                        resolve({error:err});
                        return;
                    }
                  
                    for (const file of files) {

                        let res2 = await this.deleteFile(path.join(dir, file));

                        if(res2.error){

                            showLog("deletePlayerTempFiles->"+res2.error);
                        }
                    }

                    resolve({error:null});

                  });

            }catch(e){

                resolve({error:e});
            }
        });
    }
}

module.exports = FileManager;