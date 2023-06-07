
const statics = {

    domain: "http://minfo.ir",
    urls:{
        CHECK_VERSION:"/api/app/version/check",
        REGISTER:"/api/app/course/register",
        LOAD_COURSE:"/api/app/course/load",
        SEND_COMMENTS:"/api/app/app_ticket/save",
        REPORT_ERROR:"/api/app/app_report/set",
    },
    links:{
        ADD_COURSE_HELP:"http://apptest.minfo.ir",
    },
    CT:{
        VIDEO: "ct_video",
        AUDIO: "ct_voice",
        DOCUMENT: "ct_document",
    },
    SC:{
        SUCCESS:1000,
        INVALID_VERSION_CODE: 1162,
        SHOULD_UPDATE: 1159,
        
        REACHED_MAX_DEVICE_REGISTERED: 1140,
        INVALID_LICENSE_KEY:1141,
    }
}

module.exports = statics;