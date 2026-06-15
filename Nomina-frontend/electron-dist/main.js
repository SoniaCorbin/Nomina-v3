"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
// En dev Vite tourne sur ce port; en prod on charge le build statique.
const DEV_URL = "http://localhost:5173";
const IS_DEV = !electron_1.app.isPackaged;
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 850,
        minWidth: 900,
        minHeight: 600,
        title: "Nomina",
        icon: node_path_1.default.join(__dirname, "..", "assets", "logo5.png"),
        webPreferences: {
            preload: node_path_1.default.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });
    // Ouvre les liens externes dans le navigateur système.
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith("http"))
            electron_1.shell.openExternal(url);
        return { action: "deny" };
    });
    if (IS_DEV) {
        mainWindow.loadURL(DEV_URL);
        mainWindow.webContents.openDevTools({ mode: "detach" });
    }
    else {
        // En production, charge le build Vite (dist/index.html).
        mainWindow.loadFile(node_path_1.default.join(__dirname, "..", "dist", "index.html"));
    }
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}
// macOS : re-crée la fenêtre si on clique sur l'icône du dock.
electron_1.app.on("activate", () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0)
        createWindow();
});
// Ferme l'app quand toutes les fenêtres sont fermées (sauf macOS).
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        electron_1.app.quit();
});
electron_1.app.whenReady().then(createWindow);
