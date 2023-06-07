const env = {

    environment: "deploy", // dev, test, deploy

    app_version: 1,
    db_version: 1,
    app_version_name: "1.0",

    loadFromLocalServe: false,

    course_outdate_time: 3600000, // 60 min in milli
    error_report_time: 3600000, // 60 min in milli

    dev_static_server_port: 3000,
    static_server_port: 1446,
    player_server_port: 1447,

    help_page_link: "http://apptest.minfo.ir/help"
}

module.exports = env;