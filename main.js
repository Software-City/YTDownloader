const electron = require('electron')
const {autoUpdater} = require('electron-updater');
const sethandle = require("./settingshandler.js");
const menuhandle = require("./renderer/menu.js");
const app = electron.app;
var filesystem = require("fs")
const BrowserWindow = electron.BrowserWindow

sethandle.init_settings()

const iswin32 = process.platform === "win32"

let win

function createWindow () {
  if(app.requestSingleInstanceLock()){
    win = new BrowserWindow({
      width: 1280,
      height: 720,
      resizable: false,
      darkTheme: true,
      webPreferences: {
        nodeIntegration: true
      }
    });
    win.setMenuBarVisibility(sethandle.getVal("devMode"))
    menuhandle.buildMenu();
    if(iswin32){
      win.setIcon(__dirname + '/static/logos/logo.ico');
    }else{
      win.setIcon(__dirname + '/static/logos/logo.png')
    }
    win.loadFile("templates/index.html");
    try {
      autoUpdater.checkForUpdates();
    } catch (error) {
      alert(error)
    }
  }else{
    app.quit()
  }
//////////////////////////////////////////////////////////////////////////////////////////////////////
  if(filesystem.existsSync("./tools") && !filesystem.existsSync(sethandle.cachedir + "/tools")){
    filesystem.mkdirSync(sethandle.cachedir + "/tools")
    if(iswin32){
      filesystem.copyFileSync("./tools/ffmpeg.exe", sethandle.cachedir + "/tools/ffmpeg.exe")
    }else{
      filesystem.copyFileSync("./tools/ffmpeg", sethandle.cachedir + "/tools/ffmpeg")
    }
  }
//////////////////////////////////////////////////////////////////////////////////////////////////////
}

app.whenReady().then(createWindow)

app.on('window-all-closed', (ev) => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

//-------------------------------------------------------------------
// Auto updates
//-------------------------------------------------------------------
const sendStatusToWindow = (text) => {
  if (win) {
    win.webContents.send('updatemessage', text);
  }
};

autoUpdater.on('update-available', info => {
  win.loadFile('templates/update.html');
});
autoUpdater.on('error', err => {
  sendStatusToWindow(["error", `Error in auto-updater: ${err.toString()}`]);
});
autoUpdater.on('download-progress', progressObj => {
  sendStatusToWindow(
    ["downloading", {"speed": progressObj.bytesPerSecond, "progress": progressObj.percent, "transferred": progressObj.transferred, "total": progressObj.total}]
  );
});

autoUpdater.on('update-downloaded', info => {
  autoUpdater.quitAndInstall();
});

app.requestSingleInstanceLock()