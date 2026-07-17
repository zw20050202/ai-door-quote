const Database = require('better-sqlite3');
const path = require('path');

// 构建时和运行时都能正确解析
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'dev.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
