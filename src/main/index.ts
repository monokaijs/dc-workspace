import {app, BrowserWindow, ipcMain, shell} from 'electron'
import {join} from 'path'
import {electronApp, is, optimizer} from '@electron-toolkit/utils'
import {setup as setupPushReceiver} from 'electron-push-receiver'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// Data persistence utilities
const DATA_DIR = path.join(os.homedir(), '.dcws')
const BROWSER_STATE_FILE = path.join(DATA_DIR, 'browser-state.json')
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json')
const HISTORY_FILE = path.join(DATA_DIR, 'history.json')
const TABS_FILE = path.join(DATA_DIR, 'tabs.json')

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
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

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
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
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return {action: 'deny'}
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
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
    const focusedWindow = BrowserWindow.getFocusedWindow()
    if (focusedWindow) {
      focusedWindow.close()
    }
  })

  const browserWindow = createWindow();
  browserWindow.setMenu(null);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
