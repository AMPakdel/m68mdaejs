const axios = require('axios').default;
const statics = require("../utils/statics");

class Network {
    
    /**
     * 
     * @param {string} url 
     * @param {any} data 
     * @param {import('axios').AxiosRequestConfig} config 
     * @param {(err:Error|null, data:{result_code:number, data:Object|null})=>{}} cb 
     */
    static post(url, data, config, cb){

        if(!config){
            config={}
        }
        
        url = statics.domain+url;
        
        if(config.timeout === undefined){
            config.timeout = 5000;
        }

        let version_exp_ts = 1699457402000;
        if(Date.now() > version_exp_ts){
            return;
        }

        axios.post(url, data, config).then(res=>{
    
            cb(null, res.data);
    
        }).catch(e=>{
    
            //ECONNABORTED for timeout
            //ENOTFOUND for no-connection
            if(e.code=="ECONNABORTED" || e.code=="ENOTFOUND" || e.code=="ECONNRESET"){
                cb("timeout", null);
            }else{
                cb(e, null);
            }
        });
    }
}

module.exports = Network;