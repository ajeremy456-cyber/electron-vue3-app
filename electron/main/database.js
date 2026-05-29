/**
 * Database Service (Main Process)
 * 使用 better-sqlite3 管理所有資料
 */

import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import log from 'electron-log/main'

let db = null

export function initDatabase() {
  const userData = app.getPath('userData')
  const dbPath = join(userData, 'tiktok_data.db')

  log.info(`Database path: ${dbPath}`)

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

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
  `)

  log.info('Database initialized')
  return db
}

export function getDb() { return db }

// ============ Blacklist ============

export function isBlacklisted(nickname) {
  const stmt = db.prepare('SELECT id FROM blacklisted_users WHERE nickname = ?')
  return !!stmt.get(nickname)
}

export function getBlacklist() {
  return db.prepare('SELECT * FROM blacklisted_users ORDER BY id DESC').all()
}

export function addToBlacklist(nickname, reason = '') {
  const stmt = db.prepare('INSERT OR IGNORE INTO blacklisted_users (nickname, reason) VALUES (?, ?)')
  const result = stmt.run(nickname, reason)
  return result.changes > 0
}

export function removeFromBlacklist(id) {
  const stmt = db.prepare('DELETE FROM blacklisted_users WHERE id = ?')
  return stmt.run(id).changes > 0
}

export function clearBlacklist() {
  db.exec('DELETE FROM blacklisted_users')
}

export function exportBlacklist() {
  return JSON.stringify(getBlacklist(), null, 2)
}

// ============ Messages ============

export function insertMessage(msg) {
  const stmt = db.prepare(`
    INSERT INTO messages (time, type, nickname, text, raw_json)
    VALUES (@time, @type, @nickname, @text, @raw_json)
  `)
  return stmt.run({
    time: msg.time || new Date().toISOString(),
    type: msg.type,
    nickname: msg.nickname,
    text: msg.text,
    raw_json: msg.raw_json ? JSON.stringify(msg.raw_json) : null
  })
}

export function getMessages(limit = 500, offset = 0) {
  const stmt = db.prepare('SELECT * FROM messages ORDER BY id DESC LIMIT ? OFFSET ?')
  return stmt.all(limit, offset).reverse()
}

export function clearMessages() {
  db.exec('DELETE FROM messages')
}

// ============ Keyword Rules ============

export function getKeywordRules() {
  return db.prepare('SELECT * FROM keyword_rules ORDER BY id DESC').all()
}

export function getEnabledRules() {
  return db.prepare('SELECT * FROM keyword_rules WHERE enabled = 1').all()
}

export function addKeywordRule(keyword, autoReply = '', action = 'order') {
  const stmt = db.prepare('INSERT OR IGNORE INTO keyword_rules (keyword, auto_reply, action) VALUES (?, ?, ?)')
  return stmt.run(keyword, autoReply, action).changes > 0
}

export function updateKeywordRule(id, updates) {
  const fields = []
  const values = []
  if (updates.keyword !== undefined)    { fields.push('keyword = ?');     values.push(updates.keyword) }
  if (updates.auto_reply !== undefined) { fields.push('auto_reply = ?'); values.push(updates.auto_reply) }
  if (updates.action !== undefined)     { fields.push('action = ?');     values.push(updates.action) }
  if (updates.enabled !== undefined)    { fields.push('enabled = ?');   values.push(updates.enabled ? 1 : 0) }
  if (fields.length === 0) return false
  values.push(id)
  const stmt = db.prepare(`UPDATE keyword_rules SET ${fields.join(', ')} WHERE id = ?`)
  return stmt.run(...values).changes > 0
}

export function deleteKeywordRule(id) {
  return db.prepare('DELETE FROM keyword_rules WHERE id = ?').run(id).changes > 0
}

// ============ Orders ============

export function insertOrder(order) {
  const stmt = db.prepare(`
    INSERT INTO orders (rule_id, keyword, nickname, text, triggered_at)
    VALUES (@rule_id, @keyword, @nickname, @text, @triggered_at)
  `)
  return stmt.run({
    rule_id: order.rule_id || null,
    keyword: order.keyword,
    nickname: order.nickname,
    text: order.text,
    triggered_at: order.triggered_at || new Date().toISOString()
  })
}

export function getOrders(limit = 200) {
  return db.prepare(`
    SELECT o.*, r.keyword as rule_keyword, r.auto_reply
    FROM orders o
    LEFT JOIN keyword_rules r ON o.rule_id = r.id
    ORDER BY o.id DESC LIMIT ?
  `).all(limit)
}

export function deleteOrder(id) {
  return db.prepare('DELETE FROM orders WHERE id = ?').run(id).changes > 0
}

export function clearOrders() {
  db.exec('DELETE FROM orders')
}

// ============ Export ============

export function exportMessagesToJson() {
  return JSON.stringify(getMessages(10000), null, 2)
}

export function exportOrdersToJson() {
  return JSON.stringify(getOrders(10000), null, 2)
}