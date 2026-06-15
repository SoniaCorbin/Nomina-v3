import { contextBridge } from "electron";

// Expose un flag pour que le frontend sache qu'il tourne dans Electron.
// Utilisation côté React : if (window.nominaDesktop) { ... }
contextBridge.exposeInMainWorld("nominaDesktop", {
  platform: process.platform, // "win32" | "darwin" | "linux"
  isDesktop: true,
});