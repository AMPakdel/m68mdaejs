const Model = require("../lib/Model");
const { showLog } = require("../utils/log");

let a = Model.genUniqueID;

let list = [];

for(let i=0; i<=9000; i++){

    let s=a();
    showLog(s);
    list.push(s);
}

list.forEach((e,i)=>{

    list.forEach((e2,i2)=>{

        if(e.length != e2.length){
            showLog("holyshat!");
            showLog(e+"->index:"+i+"->length:"+e.length);
            showLog(e2+"->index:"+i2+"->length:"+e2.length);
        }

        if(e === e2 && i2 !== i){
            showLog("wtf");
            showLog(e+"->index:"+i);
            showLog(e2+"->index:"+i2);
        }
    });
});