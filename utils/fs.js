const { app } = require("electron");
const { isWindows, isMac } = require("./os");
const path = require("path");

function getDefaultCourseDir(){

    return path.join(app.getPath("videos"), "/Minfo");
}

function getConfigDir(){

    return path.join(app.getPath("appData"), "/com.mnapp/");
}

function getDBFilePath(){

    return path.join(app.getPath("appData"), "/com.mnapp/dmdata");
}

function getVideoTempDir(){

    return path.join(app.getPath("appData"), "com.mnapp/vtdata/");
}

module.exports = {
    getDefaultCourseDir,
    getConfigDir,
    getDBFilePath,
    getVideoTempDir,
}