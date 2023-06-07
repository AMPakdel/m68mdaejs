const fs = require("fs");
const crypto = require("crypto");

const algo = "aes-128-cbc";

class Decryption {

    
    static decrypt(input_path, output_path, key, iv){

        return new Promise((resolve, reject)=>{

            let cipher = crypto.createDecipheriv(algo, key, iv);
            let input = fs.createReadStream(input_path, {highWaterMark:8192});
            let output = fs.createWriteStream(output_path, {highWaterMark:8192});

            input.pipe(cipher).pipe(output);

            output.on('finish', ()=> {

                resolve({error:null});
            });

            output.on("close", ()=>{

                if(input){
                    input.unpipe();
                }
            });

            output.on("error", (err)=>{

                resolve({error:err});
            });
        });
    }
}

module.exports = Decryption;