# Deific Digital Admin (Node.js + React)

Aapki static website ke liye admin panel. Isse blog posts aur products add, edit, delete aur publish karte hain. Pages site ke design (same header, footer, menu, chatbot, CSS) me khud ban jaate hain. Database optional hai: `MONGODB_URI` set karein to sab data MongoDB me save hota hai, warna JSON files me.

- **Backend:** Node.js 18+ aur Express (`server/`)
- **Admin UI:** React 18, Vite, React Router, Quill editor (`client/`)
- **`dist/`:** pehle se build kiya hua admin UI. Production me sirf `npm start` chahiye.

## Folder layout

Website aur admin ko ek hi parent folder me rakhein:

```
my-site/
├── website/        ← aapki existing website (index.html, blog/, products/, assets/ …)
└── deific-admin/   ← yeh project
```

`.env` me `SITE_DIR` se website folder ka path badal sakte hain.

## Run karna (local ya server)

```bash
cd deific-admin
cp .env.example .env        # zaroorat ho to SITE_DIR / SITE_URL badlein
npm install --omit=dev      # production (dist/ pehle se bana hai)
npm start
```

- Admin: `http://localhost:3000/admin/`. Pehli baar me setup screen par admin account banayein.
- Website: `http://localhost:3000/` (jab `SERVE_SITE=true` ho)

### Development (UI me changes karne ke liye)
```bash
npm install
npm run dev     # API port 3000 par, React (Vite) port 5173 par → http://localhost:5173/admin/
npm run build   # dist/ dobara banata hai
```

## MongoDB (database) lagana

1. MongoDB Atlas (free M0) me cluster banayein, **Connect → Drivers** se connection string lein.
2. Atlas me **Network Access** me apne server ka IP allow karein.
3. `.env` me daalein: `MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/deific_admin?retryWrites=true&w=majority`
4. `npm install` phir `npm start`. Pehli baar purani `data/*.json` apne aap DB me migrate ho jaati hain.

DB me ye save hota hai: blogs, products, users, settings, activity log, backups ki list. Images (`assets/uploads`), generated pages aur backup files disk par hi rehti hain. Agar host ka disk reset hota hai to admin me **Rebuild all pages** chala dein, pages DB se wapas ban jaate hain.

## Portfolio Projects (admin se project add karna)

Admin me **Portfolio Projects** (sidebar) se naya project add karein: title, client, tag, short description, image, stats, technologies, aur optional case study (rich text + website link + outcome). **Published** karte hi card `/portfolio` page ke grid me lag jata hai, "And many more" wale card se theek pehle. Pehle se bane 7 hand-written cards ko admin nahi chhoota. Draft/unpublish/delete karne par card hat jata hai. Display order ka chhota number pehle dikhta hai.

- Projects bhi MongoDB (ya `data/projects.json`) me save hote hain.
- **Rebuild all pages** (Dashboard) projects ko DB se `/portfolio` par dobara laga deta hai.
- Admin UI ka source badla hai, isliye ek baar `npm install` aur `npm run build` chalana zaroori hai (dist/ naya ban jata hai).

## Cloudinary (images ke liye, optional)

Hosting par permanent disk na ho (Render/Railway jaisi) to images Cloudinary par rakhein, taaki redeploy par na mitein.

1. Cloudinary dashboard > **API Keys** se key banayein.
2. `.env` me daalein: `CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME` (aur optional `CLOUDINARY_FOLDER=deific`).
3. `npm install` phir server restart.

- `CLOUDINARY_URL` set hone par blogs, products aur projects ki saari nayi uploads Cloudinary par jaati hain (auto WebP/AVIF + compression). Set na ho to purana local upload (`assets/uploads/`) chalta hai.
- Media Library me Cloudinary aur purani local images dono dikhti hain. Image kisi blog/product/project me use ho rahi ho to delete nahi hoti.
- API secret kabhi git me ya chat me share na karein. Leak ho jaye to Cloudinary me key rotate karein.

## Production deploy

Admin ko aisa server chahiye jo **files disk par likh sake**, kyunki naye pages website folder me save hote hain:

**1. VPS / Render / Railway / Hostinger VPS (recommended)**
`SERVE_SITE=true` rakhein. Node server website aur admin dono serve karega (clean URLs aur `_redirects` ke saath).
```bash
npm install --omit=dev
npm i -g pm2 && pm2 start server/index.js --name deific-admin && pm2 save
```
Production me `.env` me `COOKIE_SECURE=true` set karein. Nginx ke peeche chalane par `TRUST_PROXY=true` bhi set karein.
Render/Railway par `website/` aur `data/` folder ke liye **persistent disk** zaroor lagayein. Nahi lagaya to har redeploy par naye posts mit jaayenge.

**2. Nginx/Apache pehle se website serve kar raha hai**
`SERVE_SITE=false` aur `SITE_DIR=/var/www/website` set karein. Phir Nginx me sirf admin ko Node par bhejein:
```nginx
location /admin/          { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $remote_addr; client_max_body_size 20m; }
location /assets/uploads/ { root /var/www/website; }
```

> Netlify, Vercel ya GitHub Pages jaisi sirf-static hosting par yeh admin nahi chalega, kyunki wahan server files save nahi kar sakta.

## Features

**Blogs**
- Rich text editor (headings, lists, quotes, links, images, YouTube). Images paste/drag karne par upload ho jaati hain.
- Cover image, category, tags, author, date
- Draft / Published / **Scheduled**. Scheduled post server khud publish kar deta hai (har 30 min check).
- Featured post, Quick answer box, FAQs (Google FAQ schema)
- SEO title/description, Google preview, noindex
- "Keep reading" related posts aur contact CTA apne aap. `/blog` listing par card bhi apne aap lagta hai.

**Products**
- `/products` page par card apne aap lagta hai, aur poora product page banta hai: hero, problem, who needs it, features, how it works, overview, FAQs
- Price + Google Product schema, WhatsApp quote button, custom CTA, display order, show/hide

**Baaki**
- Media library (sharp se auto WebP compression), `sitemap.xml` auto update, Preview
- Backups aur ek click restore (website ka original version hamesha safe rehta hai)
- Users: Admin aur Editor roles. Activity log, export/import, "Rebuild all pages".
- Mobile-friendly admin, Ctrl/Cmd+S se save, unsaved changes warning

## Safety
- Website ke **original pages kabhi overwrite ya delete nahi hote**. Admin sirf apne banaye pages chhoota hai (`<!-- ddadmin:managed -->` mark se pehchanta hai).
- Passwords bcrypt se hash hote hain. Login session httpOnly cookie me rehta hai (8 ghante). 5 galat attempts par 15 min lock. CSRF protection hai aur editor ka HTML sanitize hota hai.
- `blog/index.html`, `products/index.html`, `sitemap.xml` me admin sirf `<!-- ddadmin:start -->…<!-- ddadmin:end -->` wala block update karta hai, aur badalne se pehle backup leta hai.

## Username bhool gaye / fixed admin
- `npm run list-users` se saare usernames dikh jaate hain.
- Ya `.env` me `SUPER_ADMIN_EMAIL` aur `SUPER_ADMIN_PASSWORD` daalein, server restart karein. Login page ke Username box me wahi email daalein. Is password ko `.env` se hi badalna hai, restart par wahi wapas lag jaata hai.

## Password bhool gaye?
**Login page par "Forgot password?"** dabayein. Username, `.env` wali `RECOVERY_KEY` aur naya password daalein.
- `RECOVERY_KEY` pehli baar server start hone par `.env` me khud ban jaati hai.
- Admin ka latest `ADMIN_USERNAME` aur `ADMIN_PASSWORD` bhi `.env` me save hota rehta hai (setup, forgot, change password, CLI reset, sab me).
- `.env` ko kabhi share ya git me commit na karein.

Server se bhi kar sakte hain:
```bash
npm run reset-password -- admin NayaPassword123
```

## Website dobara upload kari?
Agar poori website ki nayi copy daali hai, to admin me **Settings → Rebuild all pages** dabayein. Saare naye pages aur cards wapas aa jaayenge. `data/` aur `website/assets/uploads/` folder delete mat karna.

## Project structure
```
server/
  index.js            Express app, API routes, website serving
  lib/core.js         config, JSON store, settings, backups, activity log
  lib/render.js       page generator (blog/product pages, listings, sitemap, scheduler)
  lib/content.js      form → record, HTML sanitizer, image uploads
  lib/cloud.js        Cloudinary upload / list / delete (optional)
  reset-password.js
client/src/
  App.jsx             auth + routes
  components/         Layout, RichEditor (Quill), useItemForm
  pages/              Dashboard, ItemList, BlogEdit, ProductEdit, Media, Backups, Users, Activity, Account, Settings
  ui.jsx              shared UI (icons, notices, image picker, FAQ editor, SEO box)
dist/                 built admin UI (npm run build)
data/                 created at runtime: users, blogs, products, settings, backups
```
