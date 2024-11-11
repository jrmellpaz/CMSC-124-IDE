import { BrowserWindow, app, ipcMain, dialog, Notification } from "electron";
import { join } from "path";
import { readFile, writeFile } from "fs";

// Electron reloader
require("electron-reloader")(module);

let mainWindow;
let openedFilePath;
const userDataPath = join(app.getAppPath(), "user_data.json");
// "C:\\Users\\user\\Documents\\stratos\\user_data.json";

function readData() {
    readFile(userDataPath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        const parsedData = JSON.parse(data)
        mainWindow.webContents.send("read-data", parsedData);
    });
}

// Main window
const createWindow = () => {
    mainWindow = new BrowserWindow({
        minWidth: 400,
        minHeight: 320,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(app.getAppPath(), "renderer.js"),
            nodeIntegration: true,
        },
        icon: "assets/icon.png",
    });

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
        mainWindow.maximize();
        mainWindow.show();
    }, 5000);

    mainWindow.webContents.on("did-finish-load", readData);

    mainWindow.on("close", e => {
        e.preventDefault();
        console.log("window close prevented");
        mainWindow.webContents.send("save-user-data");
    });
};

app.whenReady().then(createWindow);

ipcMain.on("close-app", (_, settingsData) => {
    const data = JSON.stringify(settingsData);
    console.log("data", data)
    writeFile(userDataPath, data, (error) => {
        if (error) {
            console.error("Failed to write the file:", error);
            handleError(); 
        }
        else { 
            app.exit();
        }
    });
});

const handleError = (message = "Sorry, something went wrong :(") => {
    new Notification({
      	title: "Error",
      	body: message,
    }).show();
};

ipcMain.on("open-document-triggered", () => {
    dialog.showOpenDialog({
      	properties: ["openFile"],
      	filters: [{ name: "text files", extensions: ["txt"] }],
    }).then(({ filePaths }) => {
      	const filePath = filePaths[0];
  
		readFile(filePath, "utf8", (error, content) => {
			if (error) {
				handleError();
			} 
			else {
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
        writeFile(filePath, "", (error) => {
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

ipcMain.on("save-document-triggered", (_, textareaContent) => {
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

		writeFile(filePath, textareaContent, (error) => {
			if (error) {
				console.error("Failed to write the file:", error);
				handleError(); 
			} 
			else {
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
    writeFile(openedFilePath, textareaContent, (error) => {
		if (error) {
			handleError();
		}
    });
});