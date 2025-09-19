import { autoUpdater } from 'electron-updater'
import { app, dialog, BrowserWindow } from 'electron'
import { is } from '@electron-toolkit/utils'

export interface UpdateInfo {
  version: string
  releaseDate: string
  releaseNotes?: string
  downloadUrl?: string
}

export class UpdateService {
  private mainWindow: BrowserWindow | null = null
  private updateCheckInProgress = false
  private autoCheckEnabled = true

  constructor() {
    this.setupAutoUpdater()
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window
  }

  setAutoCheckEnabled(enabled: boolean) {
    this.autoCheckEnabled = enabled
  }

  private setupAutoUpdater() {
    // Configure auto-updater
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    // Set update server for development
    if (is.dev) {
      autoUpdater.updateConfigPath = 'dev-app-update.yml'
    }

    // Event handlers
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for update...')
      this.sendToRenderer('update-checking')
    })

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info)
      this.sendToRenderer('update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes
      })
    })

    autoUpdater.on('update-not-available', (info) => {
      console.log('Update not available:', info)
      this.sendToRenderer('update-not-available')
    })

    autoUpdater.on('error', (err) => {
      console.error('Update error:', err)
      this.sendToRenderer('update-error', err.message)
    })

    autoUpdater.on('download-progress', (progressObj) => {
      console.log('Download progress:', progressObj)
      this.sendToRenderer('update-download-progress', {
        percent: progressObj.percent,
        bytesPerSecond: progressObj.bytesPerSecond,
        total: progressObj.total,
        transferred: progressObj.transferred
      })
    })

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info)
      this.sendToRenderer('update-downloaded', {
        version: info.version,
        releaseDate: info.releaseDate
      })
    })
  }

  private sendToRenderer(channel: string, data?: any) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(`update:${channel}`, data)
    }
  }

  async checkForUpdates(manual = false): Promise<boolean> {
    if (this.updateCheckInProgress) {
      return false
    }

    if (!manual && !this.autoCheckEnabled) {
      return false
    }

    try {
      this.updateCheckInProgress = true
      const result = await autoUpdater.checkForUpdates()
      return result !== null
    } catch (error) {
      console.error('Error checking for updates:', error)
      if (manual) {
        this.sendToRenderer('update-error', 'Failed to check for updates')
      }
      return false
    } finally {
      this.updateCheckInProgress = false
    }
  }

  async downloadUpdate(): Promise<boolean> {
    try {
      await autoUpdater.downloadUpdate()
      return true
    } catch (error) {
      console.error('Error downloading update:', error)
      this.sendToRenderer('update-error', 'Failed to download update')
      return false
    }
  }

  async installUpdate(): Promise<void> {
    try {
      autoUpdater.quitAndInstall(false, true)
    } catch (error) {
      console.error('Error installing update:', error)
      this.sendToRenderer('update-error', 'Failed to install update')
    }
  }

  async checkForUpdatesOnStartup(): Promise<void> {
    if (!this.autoCheckEnabled) {
      return
    }

    // Wait a bit after startup to avoid interfering with app initialization
    setTimeout(() => {
      this.checkForUpdates(false)
    }, 5000)
  }

  async showUpdateDialog(updateInfo: UpdateInfo): Promise<boolean> {
    if (!this.mainWindow) {
      return false
    }

    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (${updateInfo.version}) is available!`,
      detail: updateInfo.releaseNotes || 'Would you like to download and install it?',
      buttons: ['Download & Install', 'Later', 'Skip This Version'],
      defaultId: 0,
      cancelId: 1
    })

    return result.response === 0
  }

  getCurrentVersion(): string {
    return app.getVersion()
  }
}

export const updateService = new UpdateService()
