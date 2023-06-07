const Model = require("../lib/Model");

class Course extends Model {

    static array_name = "courses";

    id = new Number();
    has_access = new Boolean();
    title = new String();
    is_encrypted = new Number(); // 0 or 1
    is_online = new Number(); // 0 or 1
    headings = [
        { 
            id: new Number(), 
            title: new String(), 
            contents: new Array 
        }
    ];
    contents = [
        {
            id: 1,
            title: '█î╪د╪»┌»█î╪▒█î ┘╪║╪د╪ز - ╪ذ╪«╪┤ ╪د┘ê┘',
            type: 'ct_video',
            is_free: 1,
            url: 'http://dl1.minfo.ir/download_student_course_item_2.php?username=apptest&upload_key=1a-a00-bb069e94441ebf69f5811668b031ddd2&course_id=1&content_id=1&lk=1113Mg195JTw1L',
            size: 6069037,
            encoding: null,
            enc_key: null,
            iv: null,
            time: null,
            upload_key: '1a-a00-bb069e94441ebf69f5811668b031ddd2',
            ext: 'mp4',
            download_status: 'need_download',
            download_percent: 0
        }
    ];
    content_hierarchy = [
        { h_id: 4, content_ids: [] }
    ];
    educators = [
        {
        id: 2,
        first_name: '┘ç╪د╪»█î',
        last_name: '┘à╪▒╪┤╪»█î',
        bio: null,
        image: null
        }
    ];
    logo = 'http://dl1.minfo.ir/public_files/apptest/1a-d110-28dc1f6acafcb419c6acee6dca22d0c1.jpg';
    last_update = '2022-06-18';
    user_info = { 
        username: 'apptest', 
        domain: null, 
        title: null 
    };
    store_dir = 'C:\\Users\\apakdel\\Videos\\min';
    last_viewed_timestamp = 0;
    pk = 'frNI+uHNypEYiL12RrqEMwl437+JU5vJCIBgTDftP1A=';
    added_timestamp = 1666594348977;
    app_selected_upload_key = '1a-a00-d7493d30e06a4a2ade35c45b2fd8d07f';
}

module.exports = Course;