const http = require('http');
const fs = require('fs');
const path = require('path');
const { getRandomInt } = require('../utils/helpers');
const { getVideoTempDir } = require('../utils/fs');
const env = require('../env');
const { createDirIfNotExists } = require('./FileDirAccess');
const FileManager = require('./FileManager');
const { showError, showLog } = require('../utils/log');

const CHUNK_SIZE = 4194304//8194304;

class PlayerServer {

    /**
     * @type {http.Server}
     */
    server;

    file_map = [];
    sockets = [];
    source_path = "";
    temp_dir = "";
    total = 0;
    secure_mode = false;

    constructor(source_path, secure_mode, content_type){

        this.source_path = source_path;

        this.content_type = content_type;

        this.total = fs.statSync(source_path).size;

        this.secure_mode = secure_mode;

        this.temp_dir = getVideoTempDir();

        this.sockets = {};
    }

    /**
     * 
     * @returns {Promise<{error:Error|null}>}
     */
    start(){

        return new Promise(async (resolve)=>{

            if(this.secure_mode){

                let temp_chunks_res = await this.createTempChunks();

                if(temp_chunks_res.error){

                    showError("PlayerServer-1", temp_chunks_res.error);
                    return;
                }
                
                this.server = http.createServer(this.secureRequestHandler);

            }else{

                this.server = http.createServer(this.requestHandler);
            }

            //empty the this.sockets
            this.sockets = {};

            this.server.on("connection", (socket)=>{

                socket.m_id = "m_id"+Object.keys(this.sockets).length;

                this.sockets[socket.m_id] = socket;
            });

            this.server.listen(env.player_server_port, ()=>{

                resolve({error:null});
            });
        });
    }

    close(){

        return new Promise(async (resolve)=>{

            if(this.server){

                this.server.on("close", async(err)=>{

                    if(err){

                        showLog("this.server.on close erro ---> "+err);
                    }

                    if(this.secure_mode){

                        let del_res = await FileManager.getFileManager().deletePlayerTempFiles();
            
                        if(del_res.error){

                            showError("PlayerServer-2", "close->deletePlayerTempFiles->"+del_res.error);
                        }
                    }

                    resolve({error:null});
                    
                });

                Object.keys(this.sockets).forEach(sk=>{
                    
                    if(this.sockets[sk].destroy){

                        this.sockets[sk].destroy();
                    }
                });


                this.server.close((err)=>{

                    if(err){
                        showLog("error on closing server -->"+err);
                    }
                });

            }else{

                resolve({error: null});
            }
        });
    }

    createTempChunks(){

        return new Promise(async(resolve)=>{

            let check_temp_dir_res =  await createDirIfNotExists(this.temp_dir);

            if(check_temp_dir_res.error){

                resolve({error:check_temp_dir_res.error});
                return;
            }

            let bin_rs = fs.createReadStream(this.source_path, {highWaterMark:CHUNK_SIZE});

            bin_rs.on("open", (fd)=>{

                bin_rs.fd = fd;
            });

            bin_rs.on("error", (error)=>{

                resolve({error});
            });
            

            bin_rs.on("close", ()=>{

                fs.unlink(this.source_path, (err)=>{

                    if(err){

                        resolve({error:"fs.unlink .bin failed : "+err});

                    }else{

                        resolve({error:null});
                    }
                });
            });

            // readstream starts flowing on attaching "on data" callback
            bin_rs.on("data", (chunk)=>{

                let random_id = getRandomInt(600000000, 800000000).toString(16);

                while(this.file_map.indexOf(random_id) != -1){

                    random_id = getRandomInt(600000000, 800000000).toString(16);
                }
                
                this.file_map.push(random_id);

                fs.writeFile(path.join(this.temp_dir, random_id), chunk, (err)=>{

                    if(err){
                        showError("PlayerServer-3", "write in chunk "+random_id+" error --->"+err);
                    }
                });

            });
        });
    }

    secureRequestHandler = (req, res)=>{

        if (req.headers['range']) {

            let range = req.headers.range;
            let parts = range.replace(/bytes=/, "").split("-");

            let partialstart = parts[0];
            let partialend = parts[1];

            let file_num = Math.floor(partialstart / CHUNK_SIZE) + 1;

            let start_reading = parseInt(partialstart, 10) % CHUNK_SIZE;
            
            let start =  parseInt(partialstart, 10);
            
            //let end = partialend ? parseInt(partialend, 10) : this.total - 1;

            let end = (file_num * CHUNK_SIZE) -1;

            let end_reading = CHUNK_SIZE -1;

            if(end > this.total){

                end = this.total -1;
                end_reading = (this.total % CHUNK_SIZE) -1;
            }
            
            // let chunksize = (end_reading - start_reading) + 1;
            let chunksize = (end_reading - start_reading) + 1;

            //saving readStream in response
            res.readStream = fs.createReadStream(path.join(this.temp_dir, this.file_map[file_num-1]), { start: start_reading, end: end_reading });
            
            res.writeHead(206, { 
                'Content-Range': 'bytes ' + start + '-' + end + '/' + this.total, 
                'Accept-Ranges': 'bytes', 
                'Content-Length': chunksize, 
                'Content-Type': 'video/mp4' 
            });

            res.readStream.on("open", (fd)=>{

                //saving fd in response
                res.readStream.fd = fd;
            });

            res.readStream.pipe(res);

            res.on('close', function() {
                
                if (res.readStream) {

                    res.readStream.unpipe(this);

                    if (this.readStream.fd) {

                        fs.close(this.readStream.fd);
                    }
                }
            });

        }else{

            res.end("");
        }
    }

    requestHandler = (req, res)=>{

        if (req.headers['range']) {

            let range = req.headers.range;
            let parts = range.replace(/bytes=/, "").split("-");

            let partialstart = parts[0];
            let partialend = parts[1];
            
            let start =  parseInt(partialstart, 10);
            
            let end = partialend ? parseInt(partialend, 10) : this.total - 1;

            let chunksize = (start - end) + 1;

            //saving readStream in response
            res.readStream = fs.createReadStream(this.source_path, { start, end });
            
            res.writeHead(206, { 
                'Content-Range': 'bytes ' + start + '-' + end + '/' + this.total, 
                'Accept-Ranges': 'bytes', 
                'Content-Length': chunksize, 
                'Content-Type': this.content_type,
            });

            res.readStream.on("open", (fd)=>{

                //saving fd in response
                res.readStream.fd = fd;
            })
            
            res.on('close', function() {

                if (res.readStream) {

                    res.readStream.unpipe(this);

                    if (this.readStream.fd) {

                        fs.close(this.readStream.fd);
                    }
                }
            });

            res.readStream.pipe(res);

        }else{

            res.end("");
        }
    }
}

module.exports = PlayerServer;
