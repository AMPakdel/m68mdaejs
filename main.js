const { app, BrowserWindow, Menu, ipcMain} = require('electron')
const path = require('path')
const env = require('./env');
const Database = require('./lib/Database');
const FileServer = require('./lib/FileServer');
const Router = require('./lib/Router');
const Download = require('./models/Download');
const { showError, showLog } = require('./utils/log');
let mainWindow;
let router;

if (require('electron-squirrel-startup')){
    app.quit();
}

app.whenReady().then(() => {

    createWindow();

    app.on('activate', () => {

        if (BrowserWindow.getAllWindows().length === 0){

            createWindow();
        }
    });
});

app.on('window-all-closed', (event) => {

    showLog("app on window-all-closed");

    event.preventDefault();

    Database.getDB().save().then(({error})=>{

        if(error){
            
            showError("main-1", error);
        }

        ipcMain.removeHandler('main:web_content_did_mount', onWebContentDidMount);

        if (process.platform !== 'darwin'){

            app.quit();
        }
    });
});

app.on("before-quit", (event)=>{

});

app.on("will-quit", (event)=>{

});

const createWindow = async() => {

    ipcMain.handle("main:web_content_did_mount", onWebContentDidMount);

    ipcMain.handle("web_content_will_unmount", onWebContentWillUnmount);

    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 600,
        show:false,
        resizable:false,
        fullscreenable:true,
        webPreferences: {
            preload: path.join(__dirname, 'utils/preload.js'),
            nodeIntegration:false,
            backgroundThrottling: false,
            contextIsolation: true,
        }
    });

    // Set empty window menu
    mainWindow.setMenu(Menu.buildFromTemplate([]));

    // Load the fronts index page
    if(env.loadFromLocalServe){

        mainWindow.loadURL("http://localhost:"+env.dev_static_server_port);

    }else{

        await FileServer.start();

        mainWindow.loadURL("http://localhost:"+env.static_server_port+"/index.html");
    }

    if(env.environment == "dev"){
        // Open the DevTools.
        mainWindow.webContents.openDevTools({mode:"detach"});
    }
    

    // Setup contex menu
    const selectionMenu = Menu.buildFromTemplate([
        {role: 'copy'},
    ]);

    const inputMenu = Menu.buildFromTemplate([
        {role: 'cut'},
        {role: 'copy'},
        {role: 'paste'},
        {type: 'separator'},
        {role: 'selectall'},
    ]);

    mainWindow.webContents.on('context-menu', (e, props) => {

        const { selectionText, isEditable } = props;

        if (isEditable) {

            inputMenu.popup(mainWindow);

        } else if (selectionText && selectionText.trim() !== '') {

            selectionMenu.popup(mainWindow);
        }
    });
}

const onWebContentDidMount = ()=>{

    // Create Router
    router = new Router(mainWindow);

    // Open Splash page
    router.openPage("splash");

    // Bring mainWindow back
    mainWindow.show();
}

const onWebContentWillUnmount = ()=>{

    router.destroy();

    ipcMain.removeHandler("main:web_content_did_mount", onWebContentDidMount);

    ipcMain.removeHandler("web_content_will_unmount", onWebContentWillUnmount);
}