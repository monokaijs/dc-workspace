import {app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage, Notification} from 'electron'
import * as path from 'path'
import {join} from 'path'
import {electronApp, is, optimizer} from '@electron-toolkit/utils'
import {setup as setupPushReceiver} from 'electron-push-receiver'
import {updateService} from '../services/updateService'
import * as fs from 'fs'
import * as os from 'os'

// Data persistence utilities
const DATA_DIR = path.join(os.homedir(), '.dcws')
const BROWSER_STATE_FILE = path.join(DATA_DIR, 'browser-state.json')
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json')
const HISTORY_FILE = path.join(DATA_DIR, 'history.json')
const TABS_FILE = path.join(DATA_DIR, 'tabs.json')

// Global variables
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null


// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {recursive: true})
  }
}

// Generic file operations
async function readDataFile(filePath: string): Promise<any> {
  try {
    if (!fs.existsSync(filePath)) {
      return null
    }
    const data = await fs.promises.readFile(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error)
    return null
  }
}

async function writeDataFile(filePath: string, data: any): Promise<boolean> {
  try {
    ensureDataDir()
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error)
    return false
  }
}

function createTray() {
  const iconPath = path.join(__dirname, '../../resources/icon.png')
  let trayIcon: Electron.NativeImage

  try {
    trayIcon = nativeImage.createFromPath(iconPath)
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty()
    }
  } catch (error) {
    trayIcon = nativeImage.createEmpty()
  }

  tray = new Tray(trayIcon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Workspace',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setToolTip('Workspace Browser - Click to show/hide')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    // ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  setupPushReceiver(mainWindow.webContents)
  console.log('Push receiver setup completed for main window')

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('close', (event) => {
    if (!(app as any).isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return {action: 'deny'}
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'], {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
    })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Data persistence IPC handlers
  ipcMain.handle('data:read-browser-state', async () => {
    return await readDataFile(BROWSER_STATE_FILE)
  })

  ipcMain.handle('data:write-browser-state', async (_, data) => {
    return await writeDataFile(BROWSER_STATE_FILE, data)
  })

  ipcMain.handle('data:read-settings', async () => {
    return await readDataFile(SETTINGS_FILE)
  })

  ipcMain.handle('data:write-settings', async (_, data) => {
    return await writeDataFile(SETTINGS_FILE, data)
  })

  ipcMain.handle('data:read-history', async () => {
    return await readDataFile(HISTORY_FILE)
  })

  ipcMain.handle('data:write-history', async (_, data) => {
    return await writeDataFile(HISTORY_FILE, data)
  })

  ipcMain.handle('data:read-tabs', async () => {
    return await readDataFile(TABS_FILE)
  })

  ipcMain.handle('data:write-tabs', async (_, data) => {
    return await writeDataFile(TABS_FILE, data)
  })

  ipcMain.handle('data:clear-all', async () => {
    try {
      const files = [BROWSER_STATE_FILE, SETTINGS_FILE, HISTORY_FILE, TABS_FILE]
      for (const file of files) {
        if (fs.existsSync(file)) {
          await fs.promises.unlink(file)
        }
      }
      return true
    } catch (error) {
      console.error('Error clearing data:', error)
      return false
    }
  })

  ipcMain.handle('data:get-data-dir', () => {
    return DATA_DIR
  })

  // Auto-start functionality
  ipcMain.handle('auto-start:get-status', () => {
    try {
      const settings = app.getLoginItemSettings()
      return settings.openAtLogin
    } catch (error) {
      console.error('Error getting auto-start status:', error)
      return false
    }
  })

  ipcMain.handle('auto-start:set-status', (_, enabled: boolean) => {
    try {
      const loginItemSettings: any = {
        openAtLogin: enabled
      }

      // On macOS, we need to specify the path for development builds
      if (process.platform === 'darwin' && !app.isPackaged) {
        loginItemSettings.path = process.execPath
        loginItemSettings.args = [process.argv[1]]
      }
      // On Windows, specify the path for both dev and production
      else if (process.platform === 'win32') {
        loginItemSettings.path = process.execPath
        if (!app.isPackaged) {
          loginItemSettings.args = [process.argv[1]]
        }
      }

      app.setLoginItemSettings(loginItemSettings)

      // Verify the setting was applied
      const verification = app.getLoginItemSettings()
      return verification.openAtLogin === enabled
    } catch (error) {
      console.error('Error setting auto-start:', error)
      return false
    }
  })

  // Window controls
  ipcMain.handle('window-minimize', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    if (focusedWindow) {
      focusedWindow.minimize()
    }
  })

  ipcMain.handle('window-maximize', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    if (focusedWindow) {
      if (focusedWindow.isMaximized()) {
        focusedWindow.unmaximize()
      } else {
        focusedWindow.maximize()
      }
    }
  })

  ipcMain.handle('window-close', () => {
    if (mainWindow) {
      mainWindow.hide()

      // Show notification when minimized to tray
      if (Notification.isSupported()) {
        new Notification({
          title: 'Workspace',
          body: 'Application was minimized to tray. Click the tray icon to restore.',
          silent: true
        }).show()
      }
    }
  })

  ipcMain.handle('window-quit', () => {
    app.quit()
  })

  // Update functionality
  ipcMain.handle('update:check', async (_, manual = false) => {
    return await updateService.checkForUpdates(manual)
  })

  ipcMain.handle('update:download', async () => {
    return await updateService.downloadUpdate()
  })

  ipcMain.handle('update:install', async () => {
    await updateService.installUpdate()
  })

  ipcMain.handle('update:get-version', () => {
    return updateService.getCurrentVersion()
  })

  ipcMain.handle('update:set-auto-check', (_, enabled: boolean) => {
    updateService.setAutoCheckEnabled(enabled)
    return true
  })

  const browserWindow = createWindow();
  browserWindow.setMenu(null);

  // Create system tray
  createTray()

  // Initialize update service
  updateService.setMainWindow(browserWindow)

  // Check for updates on startup
  updateService.checkForUpdatesOnStartup()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  app.on('before-quit', () => {
    (app as any).isQuitting = true
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
