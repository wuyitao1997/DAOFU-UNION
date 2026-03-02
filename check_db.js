import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'database.sqlite');
const db = new Database(dbPath);

console.log('Users:');
const stmt = db.prepare("SELECT * FROM users WHERE role = 'user' ORDER BY created_at DESC LIMIT ? OFFSET ?");
console.log(stmt.all(20, 0));
