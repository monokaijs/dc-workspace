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

    // Allow unsigned updates for development/testing
    // This is necessary when builds aren't properly code-signed
    autoUpdater.allowDowngrade = true
    autoUpdater.allowPrerelease = true

    // Disable signature verification for unsigned builds in development
    // WARNING: Only use this for development/testing, not production
    if (is.dev || process.env.NODE_ENV === 'development') {
      process.env.ELECTRON_UPDATER_ALLOW_UNVERIFIED = 'true'
      console.log('🔧 Signature verification disabled for development builds')
    }

    // Set update server for development
    if (is.dev) {
      autoUpdater.updateConfigPath = 'dev-app-update.yml'
      // Force update checks in development for testing (manual only)
      autoUpdater.forceDevUpdateConfig = true
      console.log('🔧 Development mode: Auto-updates disabled, manual updates available for testing')
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
      console.error('❌ Auto-updater error:', err)
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        code: (err as any).code,
        errno: (err as any).errno,
        syscall: (err as any).syscall,
        path: (err as any).path
      })

      // Check if this is a signature verification error
      if (err.message.includes('not signed') || err.message.includes('not digitally signed')) {
        console.error('❌ Signature verification failed - this is expected for unsigned development builds')
        console.error('❌ To fix this: Either sign your builds or use ELECTRON_UPDATER_ALLOW_UNVERIFIED=true')
        this.sendToRenderer('update-error', 'Update failed: Application signature verification failed. This is expected for unsigned development builds.')
      } else {
        this.sendToRenderer('update-error', `Update error: ${err.message}`)
      }
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
      console.log('🔄 Update check already in progress, skipping...')
      return false
    }

    if (!manual && !this.autoCheckEnabled) {
      console.log('🔄 Auto-check disabled, skipping...')
      return false
    }

    // Skip auto updates in development mode
    if (!manual && is.dev) {
      console.log('🔄 Auto-update disabled in development mode, skipping...')
      return false
    }

    try {
      console.log('🔄 Starting update check...', { manual, autoCheckEnabled: this.autoCheckEnabled })
      console.log('🔄 Update server config:', {
        provider: 'github',
        owner: 'monokaijs',
        repo: 'dc-workspace',
        currentVersion: this.getCurrentVersion()
      })

      this.updateCheckInProgress = true
      const result = await autoUpdater.checkForUpdates()
      console.log('✅ Update check completed:', result)
      return result !== null
    } catch (error) {
      console.error('❌ Error checking for updates:', error)
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      })
      if (manual) {
        this.sendToRenderer('update-error', `Failed to check for updates: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      return false
    } finally {
      this.updateCheckInProgress = false
    }
  }

  async downloadUpdate(): Promise<boolean> {
    try {
      console.log('🔄 Starting update download...')
      console.log('🔄 Auto-updater config:', {
        autoDownload: autoUpdater.autoDownload,
        autoInstallOnAppQuit: autoUpdater.autoInstallOnAppQuit,
        currentVersion: this.getCurrentVersion(),
        updateConfigPath: (autoUpdater as any).updateConfigPath
      })

      const result = await autoUpdater.downloadUpdate()
      console.log('✅ Update download completed:', result)
      return true
    } catch (error) {
      console.error('❌ Error downloading update:', error)
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      })
      this.sendToRenderer('update-error', `Failed to download update: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return false
    }
  }

  async installUpdate(): Promise<void> {
    try {
      console.log('🔄 Starting update installation...')
      autoUpdater.quitAndInstall(false, true)
      console.log('✅ Update installation initiated')
    } catch (error) {
      console.error('❌ Error installing update:', error)
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      })
      this.sendToRenderer('update-error', `Failed to install update: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async checkForUpdatesOnStartup(): Promise<void> {
    if (!this.autoCheckEnabled) {
      console.log('🔄 Auto-check disabled, skipping startup update check...')
      return
    }

    // Skip startup update checks in development mode
    if (is.dev) {
      console.log('🔄 Auto-update disabled in development mode, skipping startup update check...')
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

  // Force update check for testing (bypasses dev mode restrictions)
  async forceUpdateCheck(): Promise<boolean> {
    try {
      console.log('🔄 Forcing update check (bypassing dev mode restrictions)...')

      // Temporarily override dev mode check
      const originalForceDevUpdateConfig = (autoUpdater as any).forceDevUpdateConfig
      ;(autoUpdater as any).forceDevUpdateConfig = true

      this.updateCheckInProgress = true
      const result = await autoUpdater.checkForUpdates()
      console.log('✅ Forced update check completed:', result)

      // Restore original setting
      ;(autoUpdater as any).forceDevUpdateConfig = originalForceDevUpdateConfig

      return result !== null
    } catch (error) {
      console.error('❌ Error in forced update check:', error)
      this.sendToRenderer('update-error', `Forced update check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return false
    } finally {
      this.updateCheckInProgress = false
    }
  }
}

export const updateService = new UpdateService()
