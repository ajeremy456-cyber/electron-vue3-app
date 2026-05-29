import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import log from 'electron-log/main'
import { TikTokLiveConnection } from 'tiktok-live-connector'
import {
  initDatabase,
  insertMessage,
  getMessages,
  clearMessages,
  getKeywordRules,
  addKeywordRule,
  updateKeywordRule,
  deleteKeywordRule,
  getEnabledRules,
  insertOrder,
  getOrders,
  deleteOrder,
  clearOrders,
  exportMessagesToJson,
  exportOrdersToJson,
  // Blacklist
  isBlacklisted,
  getBlacklist,
  addToBlacklist,
  removeFromBlacklist,
  clearBlacklist,
  exportBlacklist,
  getDb
} from './database.js'

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
      preload: join(__dirname, '../preload/index.mjs'),
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

// 檢查關鍵字並建立訂單
function checkKeywordAndCreateOrder(nickname, text, time) {
  try {
    const rules = getEnabledRules()
    log.info(`[KeywordCheck] @${nickname}: "${text}" | ${rules.length} rules loaded`)
    if (rules.length === 0) return

    const normalizedText = text.trim()
    for (const rule of rules) {
      if (normalizedText.includes(rule.keyword.trim())) {
        log.info(`[OrderTrigger] keyword="${rule.keyword}" matched by @${nickname}`)
        insertOrder({ rule_id: rule.id, keyword: rule.keyword, nickname, text, triggered_at: time })
        mainWindow?.webContents.send('tiktok:order', {
          keyword: rule.keyword,
          nickname,
          text,
          time,
          autoReply: rule.auto_reply
        })
        log.info(`Order created: keyword="${rule.keyword}" by @${nickname}`)
        break
      }
    }
  } catch (err) {
    log.error('[KeywordCheck] Error:', err.message)
  }
}

// TikTok IPC Handlers
function setupTikTokHandlers() {
  ipcMain.handle('tiktok:connect', async (_, uniqueId) => {
    try {
      log.info(`TikTok: connecting to @${uniqueId}`)

      if (tiktokConnection) {
        try { tiktokConnection.disconnect() } catch (_) {}
        tiktokConnection = null
      }

      tiktokConnection = new TikTokLiveConnection(uniqueId, {})

      tiktokConnection.on('chat', (data) => {
        try {
          const nickname = data.user?.nickname || data.uniqueId || '匿名'
          const text = (data.content || data.comment || '').trim()
          const time = new Date().toLocaleTimeString()

          if (!text) {
            log.info(`[Chat] @${nickname} - empty message, skipping`)
            return
          }

          if (isBlacklisted(nickname)) {
            log.info(`[Block] @${nickname} is blacklisted`)
            return
          }

          const payload = { nickname, text, time }
          insertMessage({ ...payload, type: 'chat', raw_json: data })
          checkKeywordAndCreateOrder(nickname, text, time)
          mainWindow?.webContents.send('tiktok:chat', payload)
          log.info(`[Chat] @${nickname}: ${text}`)
        } catch (err) {
          log.error('[Chat] Handler error:', err.message)
        }
      })

      tiktokConnection.on('gift', (data) => {
        try {
          const nickname = data.user?.nickname || data.uniqueId || '匿名'
          const time = new Date().toLocaleTimeString()
          if (isBlacklisted(nickname)) return
          const giftName = data.giftName || data.gift?.giftName || '禮物'
          const repeatCount = data.repeatCount || data.gift?.repeatCount || 1
          const payload = { nickname, text: `送禮物: ${giftName} x${repeatCount}`, time }
          insertMessage({ ...payload, type: 'gift', raw_json: data })
          mainWindow?.webContents.send('tiktok:gift', payload)
        } catch (err) {
          log.error('[Gift] Handler error:', err.message)
        }
      })

      tiktokConnection.on('member', (data) => {
        try {
          const nickname = data.user?.nickname || data.uniqueId || '匿名'
          const time = new Date().toLocaleTimeString()
          if (isBlacklisted(nickname)) return
          const payload = { nickname, text: '進入了直播間', time }
          insertMessage({ ...payload, type: 'member', raw_json: data })
          mainWindow?.webContents.send('tiktok:member', payload)
        } catch (err) {
          log.error('[Member] Handler error:', err.message)
        }
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

  ipcMain.handle('tiktok:disconnect', async () => {
    try {
      if (tiktokConnection) {
        tiktokConnection.disconnect()
        tiktokConnection = null
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('tiktok:status', () => {
    return { connected: !!tiktokConnection }
  })
}

// Database IPC Handlers
function setupDatabaseHandlers() {
  // Messages
  ipcMain.handle('db:getMessages', (_, limit, offset) => getMessages(limit, offset))
  ipcMain.handle('db:clearMessages', () => { clearMessages(); return true })
  ipcMain.handle('db:exportMessages', () => exportMessagesToJson())

  // Keyword Rules
  ipcMain.handle('db:getKeywordRules', () => getKeywordRules())
  ipcMain.handle('db:addKeywordRule', (_, keyword, autoReply, action) => {
    const result = addKeywordRule(keyword, autoReply, action)
    log.info(`[DB] addKeywordRule("${keyword}", "${autoReply}", "${action}") => ${result}`)
    return result
  })
  ipcMain.handle('db:updateKeywordRule', (_, id, updates) =>
    updateKeywordRule(id, updates))
  ipcMain.handle('db:deleteKeywordRule', (_, id) => deleteKeywordRule(id))

  // Orders
  ipcMain.handle('db:getOrders', (_, limit) => getOrders(limit))
  ipcMain.handle('db:deleteOrder', (_, id) => deleteOrder(id))
  ipcMain.handle('db:clearOrders', () => { clearOrders(); return true })
  ipcMain.handle('db:exportOrders', () => exportOrdersToJson())

  // Blacklist
  ipcMain.handle('db:getBlacklist', () => getBlacklist())
  ipcMain.handle('db:addToBlacklist', (_, nickname, reason) =>
    addToBlacklist(nickname, reason))
  ipcMain.handle('db:removeFromBlacklist', (_, id) =>
    removeFromBlacklist(id))
  ipcMain.handle('db:clearBlacklist', () => { clearBlacklist(); return true })
  ipcMain.handle('db:exportBlacklist', () => exportBlacklist())
}

app.whenReady().then(() => {
  log.info('App ready')

  electronApp.setAppUserModelId('com.electron.app')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  try {
    initDatabase()
    log.info('Database initialized OK')
  } catch (err) {
    log.error('Database init failed:', err.message)
  }

  setupTikTokHandlers()
  setupDatabaseHandlers()
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