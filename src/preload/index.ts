import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  setGlobal: (...args: never): void => {
    ipcRenderer.send('setGlobal', args)
  },
  getGlobal: (): Promise<void> => ipcRenderer.invoke('getGlobal'),
  getCookie: (): Promise<void> => ipcRenderer.invoke('getCookie'),
  cleanCookie: (): void => ipcRenderer.send('cleanCookie'),
  setData: (data: DbReq<FavVideosInfoListCache>): void => ipcRenderer.send('setData', data),
  getData: (data: DbReq<FavVideosInfoListCache>): Promise<void> => ipcRenderer.invoke('getData',data),
  showData: (): void => ipcRenderer.send('showData'),
  getLocalCover: (fileName: string): Promise<string> => ipcRenderer.invoke('getLocalCover', { fileName }),
  setLocalCover: (fileName: string, base64Data: string): void => ipcRenderer.send('setLocalCover',{fileName,base64Data}),
  saveAllCovers: (data: DbReq<FavVideosInfoListCache>): void => ipcRenderer.send('saveAllCovers', data),
  maxWindow: (): void => ipcRenderer.send('maxWindow'),
  minWindow: (): void => ipcRenderer.send('minWindow'),
  closeWindow: (): void => ipcRenderer.send('closeWindow'),
  restoreWindow: (): void => ipcRenderer.send('restoreWindow'),
  getWindowXY: (): Promise<void> => ipcRenderer.invoke('getWindowXY'),
  moveWindow: (x: number, y: number): void => ipcRenderer.send('moveWindow', { x, y }),
  playBV: (bv: string): void => ipcRenderer.send('playBV', bv)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
