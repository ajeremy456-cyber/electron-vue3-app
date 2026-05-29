import Database from 'better-sqlite3';
import { writeFileSync } from 'fs';

const db = new Database('/tmp/test_tiktok.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time TEXT NOT NULL, type TEXT NOT NULL,
    nickname TEXT NOT NULL, text TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS keyword_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL UNIQUE, auto_reply TEXT NOT NULL DEFAULT '',
    action TEXT NOT NULL DEFAULT 'order', enabled INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id INTEGER, keyword TEXT NOT NULL,
    nickname TEXT NOT NULL, text TEXT NOT NULL, triggered_at TEXT NOT NULL
  );
`);

db.prepare('DELETE FROM messages').run();
db.prepare('DELETE FROM orders').run();
db.prepare('DELETE FROM keyword_rules').run();

// Insert test data
db.prepare('INSERT INTO messages (time, type, nickname, text) VALUES (?,?,?,?)')
  .run('10:00:00', 'chat', '小明', '請問可以購買嗎？');
db.prepare('INSERT INTO messages (time, type, nickname, text) VALUES (?,?,?,?)')
  .run('10:01:00', 'chat', '小美', '想報名課程');
db.prepare('INSERT INTO keyword_rules (keyword, auto_reply, action) VALUES (?,?,?)')
  .run('購買', '感謝購買！我們將私訊您', 'both');
db.prepare('INSERT INTO keyword_rules (keyword, auto_reply, action) VALUES (?,?,?)')
  .run('報名', '', 'order');

const rules = db.prepare('SELECT * FROM keyword_rules WHERE enabled = 1').all();
const messages = db.prepare('SELECT * FROM messages').all();

console.log('=== Messages ===');
messages.forEach(m => console.log(`  [${m.time}] ${m.nickname}: ${m.text}`));

console.log('\n=== Rules ===');
rules.forEach(r => console.log(`  「${r.keyword}」 -> ${r.action} (auto_reply: ${r.auto_reply || '無'})`));

console.log('\n=== Keyword Matching ===');
rules.forEach(rule => {
  const matched = messages.filter(m => m.text.includes(rule.keyword));
  matched.forEach(m => {
    db.prepare('INSERT INTO orders (rule_id, keyword, nickname, text, triggered_at) VALUES (?,?,?,?,?)')
      .run(rule.id, rule.keyword, m.nickname, m.text, m.time);
    console.log(`  「${rule.keyword}」 triggered by @${m.nickname}: ${m.text}`);
  });
});

console.log('\n=== Orders (Quasi-Orders) ===');
const orders = db.prepare('SELECT * FROM orders').all();
orders.forEach(o => {
  console.log(`  [${o.triggered_at}] ${o.nickname} -> "${o.text}" (keyword: ${o.keyword})`);
});

console.log(`\n✅ Database test passed! Orders created: ${orders.length}`);
db.close();