const Model = require("../lib/Model");

class Download extends Model {

    static array_name = "downloads";

    course_pk;
    
    store_dir;

    course_title;

    title;

    status;

    ext;

    size;

    type;

    upload_key;

    url;

    percent;

    downloaded_size;
}

module.exports = Download;