import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import log from 'electron-log/main'
import pkg from 'tiktok-live-connector'
const { TikTokLiveConnection } = pkg

// 初始化日誌
log.initialize()
log.info('App starting...')

let mainWindow = null
let tiktokConnection = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    log.info('Main window shown')
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  log.info('Window created')
}

// TikTok IPC Handlers
function setupTikTokHandlers() {
  // 連接到直播間
  ipcMain.handle('tiktok:connect', async (event, uniqueId) => {
    try {
      log.info(`TikTok: connecting to @${uniqueId}`)

      // 如果已有連接，先中斷
      if (tiktokConnection) {
        try { tiktokConnection.disconnect() } catch (_) {}
        tiktokConnection = null
      }

      tiktokConnection = new TikTokLiveConnection(uniqueId)

      tiktokConnection.on('chat', (data) => {
        const nickname = data.user?.nickname || data.uniqueId || '匿名'
        mainWindow?.webContents.send('tiktok:chat', {
          nickname,
          text: data.comment,
          time: new Date().toLocaleTimeString()
        })
      })

      tiktokConnection.on('gift', (data) => {
        const nickname = data.user?.nickname || data.uniqueId || '匿名'
        mainWindow?.webContents.send('tiktok:gift', {
          nickname,
          text: `送禮物: ${data.giftName} x${data.repeatCount}`,
          time: new Date().toLocaleTimeString()
        })
      })

      tiktokConnection.on('member', (data) => {
        const nickname = data.user?.nickname || data.uniqueId || '匿名'
        mainWindow?.webContents.send('tiktok:member', {
          nickname,
          text: '進入了直播間',
          time: new Date().toLocaleTimeString()
        })
      })

      tiktokConnection.on('streamEnd', () => {
        mainWindow?.webContents.send('tiktok:streamEnd', {})
      })

      tiktokConnection.on('disconnect', () => {
        mainWindow?.webContents.send('tiktok:disconnect', {})
      })

      await tiktokConnection.connect()
      log.info(`TikTok: connected to @${uniqueId}`)
      return { success: true }
    } catch (error) {
      log.error(`TikTok: connect failed - ${error.message}`)
      return { success: false, error: error.message }
    }
  })

  // 中斷連線
  ipcMain.handle('tiktok:disconnect', async () => {
    try {
      if (tiktokConnection) {
        tiktokConnection.disconnect()
        tiktokConnection = null
        log.info('TikTok: disconnected')
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 取得連線狀態
  ipcMain.handle('tiktok:status', () => {
    return { connected: !!tiktokConnection }
  })
}

app.whenReady().then(() => {
  log.info('App ready')

  electronApp.setAppUserModelId('com.electron.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  setupTikTokHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  log.info('All windows closed')
  if (tiktokConnection) {
    try { tiktokConnection.disconnect() } catch (_) {}
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})