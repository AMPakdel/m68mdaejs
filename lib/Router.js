const { ipcMain } = require("electron");
const User = require("../models/User");
const AddCourse = require("../pages/addCourse");
const Downloads = require("../pages/downloads");
const MyCourses = require("../pages/myCourses");
const Player = require("../pages/player");
const Settings = require("../pages/settings");
const Splash = require("../pages/splash");

class Router {

    mainWindow;
    currentPage;

    splash_page;
    addCourse_page;
    myCourses_page;
    settings_page;
    downloads_page;
    player_page;

    constructor(mainWindow){

        this.mainWindow = mainWindow;

        ipcMain.handle('menu:open_menu_page', this.openMenuPage);

        ipcMain.handle('menu:get_notifications', this.sendDownloadNotifications);

        ipcMain.handle("route:page_did_mount", this.pageDidMount);

        ipcMain.handle("route:page_will_unmount", this.pageWillUnmount);
    }

    destroy(){

        ipcMain.removeHandler('menu:open_menu_page', this.openMenuPage);

        ipcMain.removeHandler('menu:get_notifications', this.sendDownloadNotifications);

        ipcMain.removeHandler("route:page_did_mount", this.pageDidMount);

        ipcMain.removeHandler("route:page_will_unmount", this.pageWillUnmount);
    }

    pageDidMount = (event, page)=>{

        let t_page = this.getPage(page);
        if(t_page){
            t_page.onDidMount();
        }
    }

    pageWillUnmount = (event, page)=>{

        let t_page = this.getPage(page);
        if(t_page){
            t_page.onWillUnmount();
        }
    }

    getPage(page){
        
        switch(page){
            case "splash":return this.splash_page;
            case "myCourses":return this.myCourses_page;
            case "addCourse":return this.addCourse_page;
            case "settings":return this.settings_page;
            case "downloads":return this.downloads_page;
            case "player":return this.player_page;
        }
        return null;
    }

    openPage(page, data){

        switch(page){
            case "splash":
                this.splash_page = new Splash(this.mainWindow, this, "splash");
                this.splash_page.load(data);
                this.currentPage = this.splash_page;
                break;
            case "myCourses":
                this.myCourses_page = new MyCourses(this.mainWindow, this, "myCourses");
                this.myCourses_page.load(data);
                this.currentPage = this.myCourses_page;
                break;
            case "addCourse":
                this.addCourse_page = new AddCourse(this.mainWindow, this,"addCourse");
                this.addCourse_page.load(data);
                this.currentPage = this.addCourse_page;
                break;
            case "settings":
                this.settings_page = new Settings(this.mainWindow, this,"settings");
                this.settings_page.load(data);
                this.currentPage = this.settings_page;
                break;
            case "downloads":
                this.downloads_page = new Downloads(this.mainWindow, this,"downloads");
                this.downloads_page.load(data);
                this.currentPage = this.downloads_page;
                break;
            case "player":
                this.player_page = new Player(this.mainWindow, this,"player");
                this.player_page.load(data);
                this.currentPage = this.player_page;
                break;
        }
    }

    openMenuPage = (event, page)=>{

        this.openPage(page);
    }

    sendDownloadNotifications = ()=>{

        let user = User.findOne({id:1});

        let notifs = 0;
        if(user.download_notifications){
            notifs = user.download_notifications;
        }else{
            user.download_notifications = notifs;
        }

        this.mainWindow.webContents.send("menu:on_notification_change", notifs);
    }
}

module.exports = Router;