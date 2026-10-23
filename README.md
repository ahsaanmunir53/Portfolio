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

### Static site (the public page never sleeps)

On Render's free plan the server sleeps after 15 quiet minutes, and the next
visitor waits about a minute on Render's loading page. So the public page is
also published as a static site, `ahsaan-munir` in `render.yaml`, which
never sleeps. `scripts/build-static.js` copies `public/`, reads the content
and the CV from the server (`API_URL`) and saves them as `content.json` and
a PDF. The admin panel stays on the server.

Setup, once:

1. Render → **Blueprints** → the Portfolio blueprint → **Sync** (or let it
   sync by itself after the push). It creates `ahsaan-munir`. The first build
   waits for the server to wake, so it can take a few minutes.
2. Open `https://ahsaan-munir.onrender.com` and check the page and the CV.
3. `ahsaan-munir` → **Settings → Deploy Hook**: copy it. It is a secret.
4. `ahsaan-portfolio` → **Environment**, add two values and save:

| Key | Value |
|---|---|
| `PUBLIC_SITE_URL` | `https://ahsaan-munir.onrender.com` |
| `STATIC_DEPLOY_HOOK` | the Deploy Hook from step 3 |

After that:

- Old links to `ahsaan-portfolio.onrender.com` still work: the server sends
  visitors to the static page (after one wait if it was asleep).
- Every save in the admin panel rebuilds the static page about 30 seconds
  later; the change shows within about two minutes. The badge at the top of
  the admin panel says so, or warns when `STATIC_DEPLOY_HOOK` is missing.
- The admin panel opens at `ahsaan-portfolio.onrender.com/admin`
  (`ahsaan-munir.onrender.com/admin` redirects there).

Render never gives a deleted service's `.onrender.com` address back, so do
not delete `ahsaan-portfolio`: it serves the admin panel, the content and the
old address.

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

Content is fetched (from `/content.json`) and rendered by JavaScript. That is what makes the admin
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
  content.js         what the public page shows (/api/content, /content.json)
  publish.js         rebuilds the static site after admin saves
  routes/api.js      public reads, admin writes, field whitelists
  middleware/auth.js single admin, JWT in an httpOnly cookie
  store/index.js     mongo or json behind one interface
  store/models.js    mongoose schemas
scripts/
  build-static.js    builds the static site into dist/
public/
  index.html         site shell — content injected at runtime
  open.html          waiting page for TriageDesk and DocMind (/open/<app>)
  admin.html         admin panel
  css/ js/
  Ahsaan-Munir-CV.pdf
build_cv.py          regenerates the CV (pip install pymupdf)
```
