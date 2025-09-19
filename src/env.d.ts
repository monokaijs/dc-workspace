/// <reference types="vite/client" />

declare global {
  interface Window {
    electronAPI: {
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
    }
    dataAPI: {
      readBrowserState: () => Promise<any>
      writeBrowserState: (data: any) => Promise<boolean>
      readSettings: () => Promise<any>
      writeSettings: (data: any) => Promise<boolean>
      readHistory: () => Promise<any>
      writeHistory: (data: any) => Promise<boolean>
      readTabs: () => Promise<any>
      writeTabs: (data: any) => Promise<boolean>
      clearAll: () => Promise<boolean>
      getDataDir: () => Promise<string>
    }
    autoStartAPI: {
      getStatus: () => Promise<boolean>
      setStatus: (enabled: boolean) => Promise<boolean>
    }
    updateAPI: {
      checkForUpdates: (manual?: boolean) => Promise<boolean>
      downloadUpdate: () => Promise<boolean>
      installUpdate: () => Promise<void>
      getCurrentVersion: () => Promise<string>
      setAutoCheck: (enabled: boolean) => Promise<boolean>
      onUpdateChecking: (callback: () => void) => () => void
      onUpdateAvailable: (callback: (info: any) => void) => () => void
      onUpdateNotAvailable: (callback: () => void) => () => void
      onUpdateError: (callback: (error: string) => void) => () => void
      onDownloadProgress: (callback: (progress: any) => void) => () => void
      onUpdateDownloaded: (callback: (info: any) => void) => () => void
    }
    pushNotificationAPI: {
      startService: (senderId: string) => void
      onServiceStarted: (callback: (token: string) => void) => (() => void) | void
      onServiceError: (callback: (error: any) => void) => (() => void) | void
      onNotificationReceived: (callback: (notification: any) => void) => (() => void) | void
      onTokenUpdated: (callback: (token: string) => void) => (() => void) | void
      removeAllListeners: () => void
    }
    electron: {
      process: {
        versions: {
          electron: string
          chrome: string
          node: string
          [key: string]: string
        }
      }
      [key: string]: any
    }
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string
        allowpopups?: string
        webpreferences?: string
        useragent?: string
        ref?: React.Ref<Electron.WebviewTag>
      }
    }
  }
}
