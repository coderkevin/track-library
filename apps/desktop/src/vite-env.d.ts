/// <reference types="vite/client" />

interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import("electron").IpcRenderer;
  tracksAPI: {
    list(): Promise<
      {
        id: string;
        title?: string;
        artist?: string;
        album?: string;
        bpm?: number;
        key?: string;
        wavPath?: string;
      }[]
    >;
  };
}
