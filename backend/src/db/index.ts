import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../database.sqlite');
const schemaPath = path.join(__dirname, 'schema.sql');

export const db = new Database(dbPath);

// Initialize DB schema
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

console.log('📦 Database initialized at', dbPath);
