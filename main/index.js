import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import log from "electron-log/main";
import { TikTokLiveConnection } from "tiktok-live-connector";
import Database from "better-sqlite3";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
let db = null;
function initDatabase() {
  const userData = app.getPath("userData");
  const dbPath = join(userData, "tiktok_data.db");
  log.info(`Database path: ${dbPath}`);
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      time       TEXT    NOT NULL,
      type       TEXT    NOT NULL,
      nickname   TEXT    NOT NULL,
      text       TEXT    NOT NULL,
      raw_json   TEXT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS keyword_rules (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword    TEXT    NOT NULL UNIQUE,
      auto_reply TEXT    NOT NULL DEFAULT '',
      action     TEXT    NOT NULL DEFAULT 'order',
      enabled    INTEGER NOT NULL DEFAULT 1,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_id      INTEGER,
      keyword      TEXT    NOT NULL,
      nickname     TEXT    NOT NULL,
      text         TEXT    NOT NULL,
      triggered_at TEXT    NOT NULL,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (rule_id) REFERENCES keyword_rules(id)
    );

    CREATE TABLE IF NOT EXISTS blacklisted_users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname   TEXT    NOT NULL UNIQUE,
      reason     TEXT    NOT NULL DEFAULT '',
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_messages_time    ON messages(time);
    CREATE INDEX IF NOT EXISTS idx_orders_triggered ON orders(triggered_at);
    CREATE INDEX IF NOT EXISTS idx_blacklist_nick   ON blacklisted_users(nickname);
  `);
  log.info("Database initialized");
  return db;
}
function isBlacklisted(nickname) {
  const stmt = db.prepare("SELECT id FROM blacklisted_users WHERE nickname = ?");
  return !!stmt.get(nickname);
}
function getBlacklist() {
  return db.prepare("SELECT * FROM blacklisted_users ORDER BY id DESC").all();
}
function addToBlacklist(nickname, reason = "") {
  const stmt = db.prepare("INSERT OR IGNORE INTO blacklisted_users (nickname, reason) VALUES (?, ?)");
  const result = stmt.run(nickname, reason);
  return result.changes > 0;
}
function removeFromBlacklist(id) {
  const stmt = db.prepare("DELETE FROM blacklisted_users WHERE id = ?");
  return stmt.run(id).changes > 0;
}
function clearBlacklist() {
  db.exec("DELETE FROM blacklisted_users");
}
function exportBlacklist() {
  return JSON.stringify(getBlacklist(), null, 2);
}
function insertMessage(msg) {
  const stmt = db.prepare(`
    INSERT INTO messages (time, type, nickname, text, raw_json)
    VALUES (@time, @type, @nickname, @text, @raw_json)
  `);
  return stmt.run({
    time: msg.time || (/* @__PURE__ */ new Date()).toISOString(),
    type: msg.type,
    nickname: msg.nickname,
    text: msg.text,
    raw_json: msg.raw_json ? JSON.stringify(msg.raw_json) : null
  });
}
function getMessages(limit = 500, offset = 0) {
  const stmt = db.prepare("SELECT * FROM messages ORDER BY id DESC LIMIT ? OFFSET ?");
  return stmt.all(limit, offset).reverse();
}
function clearMessages() {
  db.exec("DELETE FROM messages");
}
function getKeywordRules() {
  return db.prepare("SELECT * FROM keyword_rules ORDER BY id DESC").all();
}
function getEnabledRules() {
  return db.prepare("SELECT * FROM keyword_rules WHERE enabled = 1").all();
}
function addKeywordRule(keyword, autoReply = "", action = "order") {
  const stmt = db.prepare("INSERT OR IGNORE INTO keyword_rules (keyword, auto_reply, action) VALUES (?, ?, ?)");
  return stmt.run(keyword, autoReply, action).changes > 0;
}
function updateKeywordRule(id, updates) {
  const fields = [];
  const values = [];
  if (updates.keyword !== void 0) {
    fields.push("keyword = ?");
    values.push(updates.keyword);
  }
  if (updates.auto_reply !== void 0) {
    fields.push("auto_reply = ?");
    values.push(updates.auto_reply);
  }
  if (updates.action !== void 0) {
    fields.push("action = ?");
    values.push(updates.action);
  }
  if (updates.enabled !== void 0) {
    fields.push("enabled = ?");
    values.push(updates.enabled ? 1 : 0);
  }
  if (fields.length === 0) return false;
  values.push(id);
  const stmt = db.prepare(`UPDATE keyword_rules SET ${fields.join(", ")} WHERE id = ?`);
  return stmt.run(...values).changes > 0;
}
function deleteKeywordRule(id) {
  return db.prepare("DELETE FROM keyword_rules WHERE id = ?").run(id).changes > 0;
}
function insertOrder(order) {
  const stmt = db.prepare(`
    INSERT INTO orders (rule_id, keyword, nickname, text, triggered_at)
    VALUES (@rule_id, @keyword, @nickname, @text, @triggered_at)
  `);
  return stmt.run({
    rule_id: order.rule_id || null,
    keyword: order.keyword,
    nickname: order.nickname,
    text: order.text,
    triggered_at: order.triggered_at || (/* @__PURE__ */ new Date()).toISOString()
  });
}
function getOrders(limit = 200) {
  return db.prepare(`
    SELECT o.*, r.keyword as rule_keyword, r.auto_reply
    FROM orders o
    LEFT JOIN keyword_rules r ON o.rule_id = r.id
    ORDER BY o.id DESC LIMIT ?
  `).all(limit);
}
function deleteOrder(id) {
  return db.prepare("DELETE FROM orders WHERE id = ?").run(id).changes > 0;
}
function clearOrders() {
  db.exec("DELETE FROM orders");
}
function exportMessagesToJson() {
  return JSON.stringify(getMessages(1e4), null, 2);
}
function exportOrdersToJson() {
  return JSON.stringify(getOrders(1e4), null, 2);
}
log.initialize();
log.info("App starting...");
let mainWindow = null;
let tiktokConnection = null;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
    log.info("Main window shown");
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
  log.info("Window created");
}
function checkKeywordAndCreateOrder(nickname, text, time) {
  const rules = getEnabledRules();
  for (const rule of rules) {
    if (text.includes(rule.keyword)) {
      insertOrder({ rule_id: rule.id, keyword: rule.keyword, nickname, text, triggered_at: time });
      mainWindow?.webContents.send("tiktok:order", {
        keyword: rule.keyword,
        nickname,
        text,
        time,
        autoReply: rule.auto_reply
      });
      log.info(`Order triggered: keyword="${rule.keyword}" by @${nickname}`);
      break;
    }
  }
}
function setupTikTokHandlers() {
  ipcMain.handle("tiktok:connect", async (_, uniqueId) => {
    try {
      log.info(`TikTok: connecting to @${uniqueId}`);
      if (tiktokConnection) {
        try {
          tiktokConnection.disconnect();
        } catch (_2) {
        }
        tiktokConnection = null;
      }
      tiktokConnection = new TikTokLiveConnection(uniqueId, {});
      tiktokConnection.on("chat", (data) => {
        const nickname = data.user?.nickname || data.uniqueId || "匿名";
        const time = (/* @__PURE__ */ new Date()).toLocaleTimeString();
        if (isBlacklisted(nickname)) {
          log.info(`Blocked message from @${nickname}`);
          return;
        }
        const payload = { nickname, text: data.comment, time };
        insertMessage({ ...payload, type: "chat", raw_json: data });
        checkKeywordAndCreateOrder(nickname, data.comment, time);
        mainWindow?.webContents.send("tiktok:chat", payload);
      });
      tiktokConnection.on("gift", (data) => {
        const nickname = data.user?.nickname || data.uniqueId || "匿名";
        const time = (/* @__PURE__ */ new Date()).toLocaleTimeString();
        if (isBlacklisted(nickname)) return;
        const payload = { nickname, text: `送禮物: ${data.giftName} x${data.repeatCount}`, time };
        insertMessage({ ...payload, type: "gift", raw_json: data });
        mainWindow?.webContents.send("tiktok:gift", payload);
      });
      tiktokConnection.on("member", (data) => {
        const nickname = data.user?.nickname || data.uniqueId || "匿名";
        const time = (/* @__PURE__ */ new Date()).toLocaleTimeString();
        if (isBlacklisted(nickname)) return;
        const payload = { nickname, text: "進入了直播間", time };
        insertMessage({ ...payload, type: "member", raw_json: data });
        mainWindow?.webContents.send("tiktok:member", payload);
      });
      tiktokConnection.on("streamEnd", () => {
        mainWindow?.webContents.send("tiktok:streamEnd", {});
      });
      tiktokConnection.on("disconnect", () => {
        mainWindow?.webContents.send("tiktok:disconnect", {});
      });
      await tiktokConnection.connect();
      log.info(`TikTok: connected to @${uniqueId}`);
      return { success: true };
    } catch (error) {
      log.error(`TikTok: connect failed - ${error.message}`);
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle("tiktok:disconnect", async () => {
    try {
      if (tiktokConnection) {
        tiktokConnection.disconnect();
        tiktokConnection = null;
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle("tiktok:status", () => {
    return { connected: !!tiktokConnection };
  });
}
function setupDatabaseHandlers() {
  ipcMain.handle("db:getMessages", (_, limit, offset) => getMessages(limit, offset));
  ipcMain.handle("db:clearMessages", () => {
    clearMessages();
    return true;
  });
  ipcMain.handle("db:exportMessages", () => exportMessagesToJson());
  ipcMain.handle("db:getKeywordRules", () => getKeywordRules());
  ipcMain.handle("db:addKeywordRule", (_, keyword, autoReply, action) => addKeywordRule(keyword, autoReply, action));
  ipcMain.handle("db:updateKeywordRule", (_, id, updates) => updateKeywordRule(id, updates));
  ipcMain.handle("db:deleteKeywordRule", (_, id) => deleteKeywordRule(id));
  ipcMain.handle("db:getOrders", (_, limit) => getOrders(limit));
  ipcMain.handle("db:deleteOrder", (_, id) => deleteOrder(id));
  ipcMain.handle("db:clearOrders", () => {
    clearOrders();
    return true;
  });
  ipcMain.handle("db:exportOrders", () => exportOrdersToJson());
  ipcMain.handle("db:getBlacklist", () => getBlacklist());
  ipcMain.handle("db:addToBlacklist", (_, nickname, reason) => addToBlacklist(nickname, reason));
  ipcMain.handle("db:removeFromBlacklist", (_, id) => removeFromBlacklist(id));
  ipcMain.handle("db:clearBlacklist", () => {
    clearBlacklist();
    return true;
  });
  ipcMain.handle("db:exportBlacklist", () => exportBlacklist());
}
app.whenReady().then(() => {
  log.info("App ready");
  electronApp.setAppUserModelId("com.electron.app");
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  try {
    initDatabase();
  } catch (err) {
    log.error("Database init failed:", err.message);
  }
  setupTikTokHandlers();
  setupDatabaseHandlers();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  log.info("All windows closed");
  if (tiktokConnection) {
    try {
      tiktokConnection.disconnect();
    } catch (_) {
    }
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
