const { BrowserWindow, app, ipcMain, dialog, Notification} = require("electron");
const path = require("path");
const fs = require("fs");

// Electron reloader
require("electron-reloader")(module);

let mainWindow;
let openedFilePath;

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


const handleError = () => {
    new Notification({
      title: "Error",
      body: "Sorry, something went wrong :(",
    }).show();
  };


ipcMain.on("open-document-triggered", () => {
    dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "text files", extensions: ["txt"] }],
    }).then(({ filePaths }) => {
      const filePath = filePaths[0];
  
      fs.readFile(filePath, "utf8", (error, content) => {
        if (error) {
          handleError();
        } else {
          app.addRecentDocument(filePath);
          openedFilePath = filePath;
          mainWindow.webContents.send("document-opened", { filePath, content });
        }
      });
    });
  });


ipcMain.on("create-document-triggered", () => {
    dialog.showSaveDialog(mainWindow, {
        filters: [
            { name: "text files", extensions: ["txt"] },
            { name: "robas files", extensions: ["rbs"] }
        ]
    }).then(({ filePath }) => {
        fs.writeFile(filePath, "", (error) => {
            if (error) {
              handleError();
            } else {
              app.addRecentDocument(filePath);
              openedFilePath = filePath;
              mainWindow.webContents.send("document-created", filePath);
            }
        });
    });
});

ipcMain.on("save-document-triggered", () => {
  dialog.showSaveDialog(mainWindow, {
    title: "Save As", 
    defaultPath: openedFilePath || "untitled.txt", // If the file was already opened, use that path, otherwise provide a default file name
    filters: [
      { name: "Text Files", extensions: ["txt"] },
      { name: "Robas Files", extensions: ["rbs"] }
    ]
  }).then(({ filePath }) => {
    if (!filePath) {
      console.log("No file path provided. Operation canceled.");
      return;
    }

    fs.writeFile(filePath, "", (error) => {
      if (error) {
        console.error("Failed to write the file:", error);
        handleError(); 
      } else {
        app.addRecentDocument(filePath);
        openedFilePath = filePath; 
        mainWindow.webContents.send("document-saved", filePath); 
      }
    });
  }).catch((err) => {
    console.error("Error during save dialog:", err);
    handleError(); 
  });
});


ipcMain.on("file-content-updated", (_, textareaContent) => {
    fs.writeFile(openedFilePath, textareaContent, (error) => {
      if (error) {
        handleError();
      }
    });
  });
