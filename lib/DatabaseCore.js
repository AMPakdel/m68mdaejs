const { getDBFilePath } = require("../utils/fs");
const fs = require("fs");
const crypto = require('crypto');

const algorithm = 'aes-128-cbc';
const key = Buffer.from("vhCMqytk43UeegLi", "utf8");
const iv = Buffer.from("JCilDfrPiPhVd10r", "utf8");

class DatabaseCore{

    constructor(){

        this.dbpath = getDBFilePath();
    }

    /**
     * 
     * @returns {Promise<{error:Error|null}>}
     */
    check(){

        return new Promise((resolve, reject)=>{

            fs.access(this.dbpath, fs.constants.R_OK| fs.constants.W_OK, (err)=>{

                if(err){
                    
                    this.write(default_db_data).then(res=>{

                        resolve({error:res.error});
                    });
    
                }else{
    
                    this.read().then(res=>{
                        
                        if(res.error){

                            this.write(default_db_data).then(res=>{

                                resolve({error:res.error});
                            });

                        }else{

                            resolve({error:null});
                        }

                    }).catch(e=>{

                        resolve({error:"catched error on reading dbfile in DatabaseCore:check()::"+e});
                    });
                }
            });
        });
    }

    /**
     * 
     * @returns {Promise<{error:Error|null}>}
     */
    write(db_data){

        return new Promise((resolve, reject)=>{

            let en_data = "";

            try{

                en_data = this.encrypt(JSON.stringify(db_data));

            }catch(e){
                
                resolve({error:e});
                return;
            }

            fs.writeFile(this.dbpath, en_data, {encoding:"utf8"}, (err)=>{

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
     * @returns {Promise<{error:Error|null, data:object|null}>}
     */
    read(){

        return new Promise((resolve, reject)=>{

            fs.readFile(this.dbpath, {encoding:"utf8"},(err, data)=>{

                if(err){
    
                    resolve({error:err, data:null});
    
                }else{
    
                    let json = {};
    
                    try{
                        data = this.decrypt(data);
                        json = JSON.parse(data.toString());
                        resolve({error:null, data:json});
                    }catch(e){
                        resolve({error:err, data:null});
                    }
                }
            });
        });
    }

    encrypt(text) {
        let cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted.toString('base64');
    }

    decrypt(text) {
        let encryptedText = Buffer.from(text, 'base64');
        let decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }

}

const default_db_data = {
    version: 1,
    user:[],
    courses:[],
    downloads:[],
};

module.exports = DatabaseCore;