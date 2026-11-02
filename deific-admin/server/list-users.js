// Usage: npm run list-users
// Shows all usernames saved in data/users.json (no passwords).
import { dbGet } from './lib/core.js';
const all = dbGet('users', {});
const rows = Object.entries(all);
if (!rows.length) console.log('Koi user nahi hai. Admin panel kholkar setup karein.');
for (const [u, d] of rows) console.log(`${u}\t(${d.role})\t${d.name || ''}\tlast login: ${d.last_login || '-'}`);
