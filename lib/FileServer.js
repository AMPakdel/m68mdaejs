const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const http = require('http');
const env = require('../env');
const { showLog } = require('../utils/log');

const mime = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};

class FileServer{

    /**
     * @type {http.Server}
     */
    static srv = null;

    constructor(){

    }

    static init(){

        FileServer.srv = http.createServer(function (req, res) {

            let reqpath = req.url.toString().split('?')[0];
            let dir = path.join(app.getAppPath(), "/public/");

            if (req.method !== 'GET') {
                res.statusCode = 501;
                res.setHeader('Content-Type', 'text/plain');
                return res.end('Method not implemented');
            }

            let file = path.join(dir, reqpath.replace(/\/$/, '/index.html'));
            
            let type = mime[path.extname(file).slice(1)] || 'text/plain';

            let s = fs.createReadStream(file);

            s.on('open', function () {
                res.setHeader('Content-Type', type);
                s.pipe(res);
            });

            s.on('error', function () {
                res.setHeader('Content-Type', 'text/plain');
                res.statusCode = 404;
                res.end('Not found');
            });
            
        });
        
    }

    static start(){

        return new Promise(async (resolve)=>{

            if(!this.srv){
                FileServer.init();
            }
    
            FileServer.srv.listen(env.static_server_port, ()=>{
    
                showLog("static server running on port"+env.static_server_port);

                resolve({error:null});
            });
        });
    }
}

module.exports = FileServer;