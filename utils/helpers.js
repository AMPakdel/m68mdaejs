
function getRandomInt(start, end) {

    return Math.floor((end-start+1) * Math.random()) + start;
}

function contentHeadingSort(course) {

    let h = course.headings || [];
    let c = course.contents || [];
    let ch = course.content_hierarchy || "[]";

    let newContent = [];

    //ch = JSON.parse(ch);
    ch.forEach(ch_obj=>{

        let h_id = ch_obj.h_id;
        let content_ids = ch_obj.content_ids;

        let newHeading = {};
        let heading_obj = findFromList(h, h_id);

        if(heading_obj){

            newHeading = heading_obj;

            newHeading.contents=[];
            
            content_ids.forEach(c_id=>{

                let content_obj = findFromList(c, c_id);

                if(content_obj){

                    newHeading.contents.push(content_obj);
                }
            });
        }

        newContent.push(newHeading);
    });

    return newContent;
}

function findFromList(list, id) {
    
    let item = null;
    list.forEach((l)=>{

        if(l.id == id){
            item = l;
        }
    });
    return item;
}

const type_map = {
    "mp4":"a",
    "png":"b",
    "mp3":"c",
    "jpg":"d",
    "svg":"e",
    "pdf":"f",
    "gif":"g",
    "ogg":"h"
}
function uploadKey2Ext(uploadKey) {

    let type_char = uploadKey.split("-")[1][0];
    let ext = null;

    Object.keys(type_map).forEach(type => {
        if(type_map[type] == type_char){
            ext = type;
        }
    });

    if(!ext){
        ext = "mp4";
    }
    return ext;
}

module.exports = {
    getRandomInt,
    contentHeadingSort,
    uploadKey2Ext,
}