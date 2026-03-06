import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      nickname TEXT NOT NULL,
      wechat TEXT,
      jd_union_id TEXT,
      rid TEXT,
      status TEXT DEFAULT 'pending', -- pending, normal, locked, blacklisted
      role TEXT DEFAULT 'user', -- user, admin, super_admin
      bank_name TEXT,
      bank_account TEXT,
      bank_branch TEXT,
      can_invoice INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, -- JD Product ID
      title TEXT NOT NULL,
      shop_name TEXT,
      original_price REAL,
      price REAL NOT NULL,
      commission_rate REAL NOT NULL,
      system_service_fee REAL NOT NULL,
      custom_service_rate REAL, -- NULL means use global default
      start_time DATETIME,
      end_time DATETIME,
      status TEXT DEFAULT 'active', -- active, inactive
      source TEXT DEFAULT 'manual', -- manual, auto
      image_url TEXT,
      coupon_url TEXT,
      memo TEXT,
      promotion_copy TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      avg_commission_rate REAL,
      avg_system_service_fee REAL,
      custom_service_rate REAL,
      start_time DATETIME,
      end_time DATETIME,
      subsidy REAL,
      content TEXT,
      image_url TEXT,
      status TEXT DEFAULT 'active',
      memo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      parent_id TEXT,
      product_id TEXT,
      product_name TEXT,
      shop_id TEXT,
      shop_name TEXT,
      status TEXT, -- paid, completed, refunded, invalid
      order_time DATETIME,
      finish_time DATETIME,
      rid TEXT,
      union_id TEXT,
      product_type TEXT,
      estimated_commission REAL,
      actual_commission REAL,
      estimated_service_fee REAL,
      actual_service_fee REAL,
      service_fee_rate REAL,
      split_rate REAL,
      quantity INTEGER,
      return_quantity INTEGER DEFAULT 0,
      frozen_quantity INTEGER DEFAULT 0,
      cp_act_id TEXT,
      owner TEXT, -- g=自营, p=pop
      main_sku_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      service_fee REAL NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, completed, rejected
      remark TEXT,
      operator_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      content TEXT,
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insert default config if not exists
  const stmt = db.prepare('INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)');
  stmt.run('default_service_rate', '0.30');

  // Add promotion_copy column if it doesn't exist
  try {
    db.exec('ALTER TABLE products ADD COLUMN promotion_copy TEXT');
  } catch (err) {
    // Column might already exist
  }

  // Add reject_reason column if it doesn't exist
  try {
    db.exec('ALTER TABLE users ADD COLUMN reject_reason TEXT');
  } catch (err) {
    // Column might already exist
  }

  // Add missing columns if they don't exist
  const addColumn = (table: string, column: string, type: string) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    } catch (e: any) {
      if (!e.message.includes('duplicate column name')) {
        console.error(`Error adding column ${column} to ${table}:`, e);
      }
    }
  };

  addColumn('orders', 'parent_id', 'TEXT');
  addColumn('orders', 'shop_id', 'TEXT');
  addColumn('orders', 'shop_name', 'TEXT');
  addColumn('orders', 'union_id', 'TEXT');
  addColumn('orders', 'actual_commission', 'REAL');
  addColumn('orders', 'actual_service_fee', 'REAL');
  addColumn('orders', 'return_quantity', 'INTEGER DEFAULT 0');
  addColumn('orders', 'frozen_quantity', 'INTEGER DEFAULT 0');
  addColumn('orders', 'cp_act_id', 'TEXT');
  addColumn('orders', 'owner', 'TEXT');
  addColumn('orders', 'main_sku_id', 'TEXT');

  // Create super admin if not exists
  const adminStmt = db.prepare('SELECT id FROM users WHERE role = ?');
  const admin = adminStmt.get('super_admin');
  if (!admin) {
    const insertAdmin = db.prepare(`
      INSERT INTO users (phone, nickname, role, status)
      VALUES (?, ?, ?, ?)
    `);
    insertAdmin.run('admin', 'Super Admin', 'super_admin', 'normal');
  }
}

export default db;
