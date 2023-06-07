const { machineIdSync } = require("node-machine-id");
const env = require("../env");

function getDeviceUUID(){

    return machineIdSync();
}

function isMac(){

    if(process.platform === "darwin"){
        return true;
    }
    return false;
}

function isWindows(){

    if(process.platform === "win32"){
        return true;
    }
    return false;
}

function getPlatform(){

    if(isMac()){
        return "mac";
    }else if(isWindows()){
        return "windows";
    }
}

function getPlatformVersion(){

    //TODO:: get real version
    if(isMac()){
        return "os11";
    }else if(isWindows()){
        return "10";
    }
}

function getAppVersion(){

    return env.app_version.toString();
}

module.exports = {
    getDeviceUUID,
    isMac,
    isWindows,
    getPlatform,
    getPlatformVersion,
    getAppVersion,
}