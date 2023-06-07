const crypto = require("crypto");
const Database = require("./Database");

class Model {

    static array_name;

    static genUniqueID(){
        
        let id = Date.now()+"-"+crypto.randomUUID();
        let hash = crypto.createHash("sha256");
        hash.update(id);
        return hash.digest("base64");
    }

    static async sync(){

        let db = Database.getDB();
        if(!db[this.array_name]){
            throw new Error(this.array_name+" not exists in db!");
        };

        return await db.save();
    }

    static create(object){

        let db = Database.getDB();
        if(!db[this.array_name]){
            throw new Error(this.array_name+" not exists in db!");
        };

        object.pk = this.genUniqueID();

        object.added_timestamp = Date.now();

        db[this.array_name].push(object);
    }

    static find(where){

        let db = Database.getDB();
        if(!db[this.array_name]){
            throw new Error(this.array_name+" not exists in db!");
        };

        let li = db[this.array_name];

        let data = [];

        li.forEach((v,i)=>{

            let w_keys = Object.keys(where);
            let matches = true;

            w_keys.forEach(k=>{
                if(v[k] != where[k]){
                    matches = false;
                }
            });

            if(matches){
                data.push(v);
            }
        });

        return data;
    }

    static findOne(where){

        let db = Database.getDB();
        if(!db[this.array_name]){
            throw new Error(this.array_name+" not exists in db!");
        };

        let li = db[this.array_name];

        for(let i=0; i<li.length; i++){

            let w_keys = Object.keys(where);
            let matches = true;
            
            w_keys.forEach(k=>{
                if(li[i][k] != where[k]){
                    matches = false;
                }
            });

            if(matches){
                return li[i];
            }
        }

        return null;
    }

    static findAll(){

        let db = Database.getDB();
        if(!db[this.array_name]){
            throw new Error(this.array_name+" not exists in db!");
        };

        return db[this.array_name];
    }

    static update(where, object){

        let db = Database.getDB();
        if(!db[this.array_name]){
            throw new Error(this.array_name+" not exists in db!");
        };

        let li = db[this.array_name];

        li.forEach((v,i)=>{

            let w_keys = Object.keys(where);
            let matches = true;

            w_keys.forEach(k=>{
                if(v[k] != where[k]){
                    matches = false;
                }
            });

            if(matches){
                Object.keys(object).forEach(k=>{
                    v[k] = object[k];
                });
            }
        });
    }

    static delete(where){

        let db = Database.getDB();
        if(!db[this.array_name]){
            throw new Error(this.array_name+" not exists in db!");
        };

        if(!db[this.array_name]){
            throw new Error(this.array_name+" not exists in db!");
        };

        let li = db[this.array_name];

        let newList = [];

        li.forEach((v,i)=>{

            let w_keys = Object.keys(where);
            let matches = true;

            w_keys.forEach(k=>{
                if(v[k] != where[k]){
                    matches = false;
                }
            });

            if(!matches){
                newList.push(v);
            }
        });

        db[this.array_name] = newList;
    }
}

module.exports = Model;