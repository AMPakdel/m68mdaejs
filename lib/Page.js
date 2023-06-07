const { BrowserWindow, ipcMain } = require("electron");
const env = require("../env");
const Router = require("./Router");

class Page {

    #path;
    //#loaded;
    /**
     * 
     * @param {BrowserWindow} mainWindow 
     * @param {Router} router 
     */
     constructor(mainWindow, router, path){
        this.mainWindow = mainWindow;
        this.router = router;
        this.#path = path;
        this.data = {};
        //this.#loaded = false;
    }

    load(data){
        this.data = data;
        this.mainWindow.webContents.send("route:change_page", this.#path, data);
    }

    // pageDidMount(page){

    //     if(page === this.#path){

    //         this.#loaded = true;

    //         this.onDidMount();
    //     }
    // }

    // pageWillUnmount(page){

    //     if(page === this.#path){

    //         this.onWillUnmount();
    //     }
    // }

    onDidMount(){

    }

    onWillUnmount(){
        
    }
}

module.exports = Page;