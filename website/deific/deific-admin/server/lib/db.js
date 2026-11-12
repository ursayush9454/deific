// MongoDB storage layer (optional).
//
// - MONGODB_URI set hai  -> blogs, products, users, settings, activity, backups list DB me save hote hain.
// - MONGODB_URI nahi hai -> purana tarika (data/*.json files) chalta rehta hai.
//
// Design: startup par sab collections ek baar DB se memory me load hoti hain. Reads (dbGet) memory se
// aate hain (super fast, DB par load nahi). Writes (dbPut) memory me turant update hote hain aur
// DB me background me, order se, save hote hain.
import fs from 'node:fs';
import path from 'node:path';

export const NAMES = ['users', 'settings', 'activity', 'backups', 'blogs', 'products', 'projects'];
const COLLECTION = 'store'; // ek hi collection, har name ka ek document: { _id: 'blogs', data: [...] }

let col = null;
let client = null;
const cache = new Map();
const queue = new Map(); // name -> promise chain (writes ek ke baad ek, order me)
let lastError = null;

export const dbEnabled = () => !!process.env.MONGODB_URI;
export const dbReady = () => !!col;
export const dbLastError = () => lastError;

const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export async function connectDb(dataDir) {
  if (!dbEnabled()) return false;
  let MongoClient;
  try {
    ({ MongoClient } = await import('mongodb'));
  } catch {
    throw new Error('"mongodb" package install nahi hai. Chalayein: npm install');
  }
  client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  // URI me DB ka naam ho to wahi use hoga, warna MONGODB_DB ya "deific_admin"
  const db = client.db(process.env.MONGODB_DB || undefined);
  col = db.collection(COLLECTION);

  // 1) DB se sab kuch memory me load karo
  const docs = await col.find({ _id: { $in: NAMES } }).toArray();
  for (const d of docs) cache.set(d._id, d.data);

  // 2) Jo cheez DB me nahi hai par purani data/*.json me hai, use DB me migrate karo (sirf ek baar)
  for (const name of NAMES) {
    if (cache.has(name)) continue;
    const f = path.join(dataDir, name + '.json');
    if (!fs.existsSync(f)) continue;
    try {
      const data = JSON.parse(fs.readFileSync(f, 'utf8'));
      cache.set(name, data);
      await col.updateOne({ _id: name }, { $set: { data, updated_at: new Date() } }, { upsert: true });
      console.log(`  [db] ${name}.json -> MongoDB me migrate ho gaya`);
    } catch (e) {
      console.warn(`  [db] ${name}.json migrate nahi hua:`, e.message);
    }
  }
  return true;
}

export function cacheGet(name, def) {
  return cache.has(name) ? clone(cache.get(name)) : def;
}

export function cachePut(name, data) {
  const value = clone(data);
  cache.set(name, value);
  const prev = queue.get(name) || Promise.resolve();
  const next = prev
    .then(() => col.updateOne({ _id: name }, { $set: { data: value, updated_at: new Date() } }, { upsert: true }))
    .then(() => { lastError = null; })
    .catch((e) => {
      lastError = e.message;
      console.error(`[db] "${name}" save nahi hua:`, e.message);
    });
  queue.set(name, next);
}

/** Pending writes khatam hone tak ruko (shutdown / CLI scripts ke liye). */
export async function flushDb() {
  await Promise.all([...queue.values()]);
}

export async function closeDb() {
  await flushDb();
  if (client) await client.close();
  client = null;
  col = null;
}
