// Usage: npm run list-users
// Shows all usernames (no passwords). Works with MongoDB (MONGODB_URI) or data/users.json.
import { dbGet, DATA_DIR } from './lib/core.js';
import { connectDb, closeDb } from './lib/db.js';
await connectDb(DATA_DIR);
const all = dbGet('users', {});
const rows = Object.entries(all);
if (!rows.length) console.log('Koi user nahi hai. Admin panel kholkar setup karein.');
for (const [u, d] of rows) console.log(`${u}\t(${d.role})\t${d.name || ''}\tlast login: ${d.last_login || '-'}`);
await closeDb();
