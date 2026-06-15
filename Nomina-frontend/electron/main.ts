import { app, BrowserWindow, shell } from "electron";
import path from "node:path";

// En dev Vite tourne sur ce port; en prod on charge le build statique.
const DEV_URL = "http://localhost:5173";
const IS_DEV = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    title: "Nomina",
    icon: path.join(__dirname, "..", "assets", "logo5.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Ouvre les liens externes dans le navigateur système.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) shell.openExternal(url);
    return { action: "deny" };
  });

  if (IS_DEV) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    // En production, charge le build Vite (dist/index.html).
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// macOS : re-crée la fenêtre si on clique sur l'icône du dock.
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Ferme l'app quand toutes les fenêtres sont fermées (sauf macOS).
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.whenReady().then(createWindow);