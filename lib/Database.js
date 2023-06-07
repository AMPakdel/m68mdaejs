const env = require("../env");
const DatabaseCore = require("./DatabaseCore");

class Database {

    /**
     * @type {Database}
     */
    static #db;

    /**
     * 
     * @param {DatabaseCore} dbcore 
     */
    constructor(dbcore){

        this.dbcore = dbcore;
        this.version = env.db_version; // TODO:: add migration and version check
        this.user = [];
        this.courses = [];
        this.downloads = [];
        this.errors = [];
    }

    /**
     * 
     * @param {DatabaseCore} dbcore 
     */
    static async init(dbcore){

        Database.#db = new Database(dbcore);

        let {error, data} = await dbcore.read();

        if(error){
            return {error};
        }

        Database.#db.user = data.user;
        Database.#db.courses = data.courses;
        Database.#db.downloads = data.downloads;

        return {error:null};
    }

    /**
     * 
     * @returns {Database}
     */
    static getDB(){
        
        return this.#db;
    }

    /**
     * 
     * @returns {Promise<{error:Error|null}>}
     */
    load(){
        return new Promise((resolve, reject)=>{

            this.dbcore.read().then(res=>{

                if(res.error){

                    resolve({error:res.error});

                }else{

                    let db_data = res.data;
                    this.version = db_data.version;
                    this.user = db_data.user;
                    this.courses = db_data.courses;
                    this.downloads = db_data.downloads;
                    resolve({error:null});
                }
            });
        });
    }

    /**
     * 
     * @returns {Promise<{error:Error|null}>}
     */
    save(){
        return new Promise((resolve, reject)=>{

            let db_data = {
                version:this.version,
                user:this.user,
                courses:this.courses,
                downloads:this.downloads,
                errors:this.errors,
            }

            this.dbcore.write(db_data).then(res=>{

                resolve(res);
            });
        });
    }
}

module.exports = Database;