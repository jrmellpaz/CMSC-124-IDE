const { BrowserWindow, app, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

// Electron reloader
require("electron-reloader")(module);

let mainWindow;

// Main window
const createWindow = () => {
    mainWindow = new BrowserWindow({
        minWidth: 400,
        minHeight: 320,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(app.getAppPath(), "renderer.js"),
            nodeIntegration: true,
        },
        icon: "assets/icon.png",
    });

    // mainWindow.setIcon("assets/icon.png");
    mainWindow.webContents.openDevTools();
    mainWindow.loadFile("index.html");

    // Splash screen title window
    var splash = new BrowserWindow({
        width: 833,
        height: 406,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        icon: "assets/icon.png",
    });
    
    splash.loadFile("splash.html");
    splash.center();

    setTimeout(() => {
        splash.close();
        mainWindow.center();
        mainWindow.show();
    }, 5000);
};

app.whenReady().then(createWindow);

ipcMain.on("create-document-triggered", () => {
    dialog.showSaveDialog(mainWindow, {
        filters: [{
            name: "text files", extensions: ["txt"]
        }, {
            name: "robas files", extensions: ["rbs"]
        }]
    }).then(({ filePath }) => {
        fs.writeFile(filePath, "", (error) => {
            if(error) {
                console.log("error", error);
            }
            else {
                mainWindow.webContents.send("document-created", filePath)
            }
        })
    })
})