import { app, BrowserWindow, shell, ipcMain, dialog } from "electron";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import os from "node:os";
import { TrackLibrary, TrackMetadata } from "@tracklib/core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");
const isDev = !!VITE_DEV_SERVER_URL;

async function createWindow() {
  win = new BrowserWindow({
    title: "Main window",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload,
      // Allow local resource loading in development for audio previews
      ...(isDev ? { webSecurity: false } : {}),
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    // #298
    win.loadURL(VITE_DEV_SERVER_URL);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});

// List tracks using core library
ipcMain.handle("tracks:list", async () => {
  try {
    const lib = getTrackLibrary();
    const tracks: TrackMetadata[] = await lib.getAllTracks();
    const libraryPath = getLibraryPath();
    return tracks.map((t: TrackMetadata) => {
      const wavPath = t.wavPath;
      const wavAbsolutePath = path.isAbsolute(wavPath)
        ? wavPath
        : path.join(libraryPath, path.basename(wavPath));
      const fileUrl = pathToFileURL(wavAbsolutePath).href;
      return { ...t, wavAbsolutePath, fileUrl };
    });
  } catch {
    return [];
  }
});

// Add a new track using core library (handles MP3->WAV and metadata)
ipcMain.handle("tracks:add", async () => {
  try {
    // Ask user to select an audio file
    const result = await dialog.showOpenDialog(win!, {
      title: "Add Track (MP3 or WAV)",
      properties: ["openFile"],
      filters: [{ name: "Audio", extensions: ["mp3", "MP3", "wav", "WAV"] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return false;
    }

    const selectedPath = result.filePaths[0];
    const lib = getTrackLibrary();
    await lib.importTrack(selectedPath);
    return true;
  } catch (error) {
    console.error("tracks:add error", error);
    return false;
  }
});

// Rescan and re-analyze all tracks
ipcMain.handle("tracks:rescan", async () => {
  try {
    const lib = getTrackLibrary();
    const result = await lib.rescanAllTracks();
    return result;
  } catch (error) {
    console.error("tracks:rescan error", error);
    return { total: 0, updated: 0 };
  }
});

// Helpers to get a singleton TrackLibrary instance bound to repo data/tracks
let _trackLibrary: TrackLibrary | null = null;
function getLibraryPath(): string {
  const appRoot = path.join(process.env.APP_ROOT as string);
  const projectRoot = path.resolve(appRoot, "..", "..");
  return path.join(projectRoot, "data", "tracks");
}
function getTrackLibrary(): TrackLibrary {
  if (!_trackLibrary) {
    _trackLibrary = TrackLibrary.getInstance(getLibraryPath());
  }
  return _trackLibrary;
}
