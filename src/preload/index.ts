import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'



// Custom APIs for renderer
const api = {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  quit: () => ipcRenderer.invoke('window-quit'),
  setTitle: (title: string) => ipcRenderer.invoke('window-set-title', title)
}

// Data persistence APIs
const dataAPI = {
  readBrowserState: () => ipcRenderer.invoke('data:read-browser-state'),
  writeBrowserState: (data: any) => ipcRenderer.invoke('data:write-browser-state', data),
  readSettings: () => ipcRenderer.invoke('data:read-settings'),
  writeSettings: (data: any) => ipcRenderer.invoke('data:write-settings', data),
  readHistory: () => ipcRenderer.invoke('data:read-history'),
  writeHistory: (data: any) => ipcRenderer.invoke('data:write-history', data),
  readTabs: () => ipcRenderer.invoke('data:read-tabs'),
  writeTabs: (data: any) => ipcRenderer.invoke('data:write-tabs', data),
  clearAll: () => ipcRenderer.invoke('data:clear-all'),
  getDataDir: () => ipcRenderer.invoke('data:get-data-dir'),
  getWebviewPreloadPath: () => ipcRenderer.invoke('get-webview-preload-path')
}

// Auto-start APIs
const autoStartAPI = {
  getStatus: () => ipcRenderer.invoke('auto-start:get-status'),
  setStatus: (enabled: boolean) => ipcRenderer.invoke('auto-start:set-status', enabled)
}

// Update APIs
const updateAPI = {
  checkForUpdates: (manual = false) => ipcRenderer.invoke('update:check', manual),
  forceCheckForUpdates: () => ipcRenderer.invoke('update:force-check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  getCurrentVersion: () => ipcRenderer.invoke('update:get-version'),
  setAutoCheck: (enabled: boolean) => ipcRenderer.invoke('update:set-auto-check', enabled),
  onUpdateChecking: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('update:update-checking', handler)
    return () => ipcRenderer.removeListener('update:update-checking', handler)
  },
  onUpdateAvailable: (callback: (info: any) => void) => {
    const handler = (_: any, info: any) => callback(info)
    ipcRenderer.on('update:update-available', handler)
    return () => ipcRenderer.removeListener('update:update-available', handler)
  },
  onUpdateNotAvailable: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('update:update-not-available', handler)
    return () => ipcRenderer.removeListener('update:update-not-available', handler)
  },
  onUpdateError: (callback: (error: string) => void) => {
    const handler = (_: any, error: string) => callback(error)
    ipcRenderer.on('update:update-error', handler)
    return () => ipcRenderer.removeListener('update:update-error', handler)
  },
  onDownloadProgress: (callback: (progress: any) => void) => {
    const handler = (_: any, progress: any) => callback(progress)
    ipcRenderer.on('update:update-download-progress', handler)
    return () => ipcRenderer.removeListener('update:update-download-progress', handler)
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    const handler = (_: any, info: any) => callback(info)
    ipcRenderer.on('update:update-downloaded', handler)
    return () => ipcRenderer.removeListener('update:update-downloaded', handler)
  }
}





// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('electronAPI', api)
    contextBridge.exposeInMainWorld('dataAPI', dataAPI)
    contextBridge.exposeInMainWorld('autoStartAPI', autoStartAPI)
    contextBridge.exposeInMainWorld('updateAPI', updateAPI)

  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.electronAPI = api
  // @ts-ignore (define in dts)
  window.dataAPI = dataAPI
  // @ts-ignore (define in dts)
  window.autoStartAPI = autoStartAPI
  // @ts-ignore (define in dts)
  window.updateAPI = updateAPI

}
