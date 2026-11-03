// Usage: npm run reset-password -- <username> <new-password>
// Creates the user as admin if it does not exist. Works with MongoDB (MONGODB_URI) or JSON files.
import bcrypt from 'bcryptjs';
import { dbGet, dbPut, nowIso, saveCredsToEnv, DATA_DIR } from './lib/core.js';
import { connectDb, closeDb } from './lib/db.js';

const [u, p] = process.argv.slice(2);
if (!u || !p || p.length < 8) {
  console.log('Usage: npm run reset-password -- <username> <new-password (8+ chars)>');
  process.exit(1);
}
await connectDb(DATA_DIR);
const all = dbGet('users', {});
const key = u.toLowerCase();
all[key] = { ...(all[key] || { role: 'admin', name: u, created: nowIso() }), hash: bcrypt.hashSync(p, 11) };
dbPut('users', all);
if (all[key].role === 'admin') saveCredsToEnv(key, p);
await closeDb();
console.log(`Password updated for "${key}" (role: ${all[key].role}).`);
