# Portfolio + Admin

A portfolio whose every word, project, number and cover image is edited from a
browser instead of a code editor.

- **Site** — `/`
- **Admin** — `/admin`

## Run it

```bash
npm install
cp .env.example .env      # then edit it
npm start
```

Open http://localhost:3000 and http://localhost:3000/admin

On first boot the store is empty, so it seeds itself with the starter content
in `src/seed.js`. Everything after that is edited from the admin panel.

## Setting the admin password

```bash
node src/hash.js "the password you want"
```

Paste the printed `ADMIN_PASSWORD_HASH=` line into `.env` and delete
`ADMIN_PASSWORD`. Plain `ADMIN_PASSWORD` works for local dev; the server prints
a warning while it is in use.

Generate a session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Storage

| `MONGODB_URI` | Behaviour |
|---|---|
| blank | Writes to `data/portfolio.json`. Zero setup. **Local only.** |
| set | MongoDB. Survives restarts and redeploys. |

Render's free tier hands every restart a fresh filesystem, and a free service
restarts on its own after fifteen minutes idle. Without `MONGODB_URI`, anything
entered in the admin panel is gone by morning. A free MongoDB Atlas cluster
(M0, 512MB) is far more than this needs.

## Deploying to Render

1. Push to GitHub.
2. Render → **New → Web Service** → pick the repo.
3. Build Command `npm install` · Start Command `npm start`
4. Environment:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `ADMIN_USERNAME` | your username |
| `ADMIN_PASSWORD_HASH` | output of `node src/hash.js` |
| `SESSION_SECRET` | 64+ random characters |
| `MONGODB_URI` | your Atlas connection string |

In Atlas, allow access from anywhere (`0.0.0.0/0`) under Network Access —
Render's outbound IPs are not fixed on the free plan.

### If the admin panel will not open

Visit `/api/auth/config` on your deployed site. It returns booleans only, no
values:

```json
{"storage":"mongo","adminUser":true,"adminPassword":true,
 "passwordHashed":true,"sessionSecret":true}
```

`adminPassword: false` is the usual cause — the environment variable is
missing or misspelled, so every sign-in is refused. `storage: "json"` in
production means `MONGODB_URI` never took effect. The sign-in screen also
reports both of these before you type anything.

## Cover images

The admin panel resizes each upload to 1200px wide and re-encodes it as WebP
**in your browser**, then stores the result on the document. No file storage,
no S3, no Cloudinary. A cover lands around 100–250KB, well inside MongoDB's
16MB document limit.

## A trade-off worth knowing

Content is fetched and rendered by JavaScript. That is what makes the admin
panel possible, but it means a crawler reading the raw HTML sees an empty
shell. Google runs JavaScript and will index it fine; some link-preview
scrapers do not. The `<title>`, `<meta name="description">` and Open Graph
tags in `public/index.html` are static for exactly that reason — edit them
there if the copy changes.

## Layout

```
src/
  server.js          express app, startup checks
  seed.js            starter content, runs once on an empty store
  hash.js            password hashing helper
  routes/api.js      public reads, admin writes, field whitelists
  middleware/auth.js single admin, JWT in an httpOnly cookie
  store/index.js     mongo or json behind one interface
  store/models.js    mongoose schemas
public/
  index.html         site shell — content injected at runtime
  admin.html         admin panel
  css/ js/
  Ahsaan-Munir-CV.pdf
build_cv.py          regenerates the CV (pip install pymupdf)
```
