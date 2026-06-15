"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose un flag pour que le frontend sache qu'il tourne dans Electron.
// Utilisation côté React : if (window.nominaDesktop) { ... }
electron_1.contextBridge.exposeInMainWorld("nominaDesktop", {
    platform: process.platform, // "win32" | "darwin" | "linux"
    isDesktop: true,
});
