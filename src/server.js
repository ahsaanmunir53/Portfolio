require("dotenv").config();

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

const store = require("./store");
const api = require("./routes/api");
const { loadPublicContent } = require("./content");
const seed = require("./seed");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, "..", "public");

/* Two services (render.yaml): the public page is a static site that never
 * sleeps, and this server keeps the admin panel, the API and the CV. With
 * PUBLIC_SITE_URL set, visitors who open this server's address are sent to
 * the static site. */
const PUBLIC_SITE_URL = (() => {
  const raw = (process.env.PUBLIC_SITE_URL || "").trim();
  if (!raw) return "";
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : "https://" + raw).origin;
  } catch (err) {
    console.warn("[config] PUBLIC_SITE_URL is not a valid address; ignoring it.");
    return "";
  }
})();

// Cover images arrive as base64 in the JSON body, so the default 100kb
// limit would reject every upload.
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  next();
});

app.use("/api", api);

if (PUBLIC_SITE_URL) {
  app.get(["/", "/index.html", "/open/:app"], (req, res) => {
    const q = req.originalUrl.indexOf("?");
    res.redirect(302, PUBLIC_SITE_URL + req.path + (q >= 0 ? req.originalUrl.slice(q) : ""));
  });
}

// The page reads its copy from here; the static site has the same file, saved at build time.
app.get("/content.json", async (req, res, next) => {
  try {
    res.setHeader("Cache-Control", "no-cache");
    res.json(await loadPublicContent());
  } catch (err) {
    next(err);
  }
});

app.use(
  express.static(PUBLIC, {
    maxAge: process.env.NODE_ENV === "production" ? "1h" : 0,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
    },
  })
);

/* The CV.
 *
 * Two reasons this is a route and not a plain static file.
 *
 * First, the admin panel can now replace the PDF without a redeploy, so the
 * bytes live in the store and the file on disk is only the fallback.
 *
 * Second, mobile browsers ignore the `download` attribute on a link and hand
 * the PDF to a built-in viewer, which renders an A4 page at a useless zoom.
 * Sending Content-Disposition: attachment makes the phone download it instead,
 * which is what someone tapping "Download CV" actually wanted. Add ?view=1 to
 * read it in the browser on purpose. */
app.get("/cv", async (req, res, next) => {
  try {
    const site = (await store.getSite()) || {};
    const inline = req.query.view !== undefined;
    const name = (site.cvName || site.cvFile || "CV.pdf").replace(/[^\w.\- ]+/g, "");

    if (site.cvData) {
      const base64 = String(site.cvData).split(",")[1] || "";
      const buf = Buffer.from(base64, "base64");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", buf.length);
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader(
        "Content-Disposition",
        (inline ? "inline" : "attachment") + '; filename="' + name + '"'
      );
      return res.end(buf);
    }

    const fallback = path.join(PUBLIC, String(site.cvFile || "Ahsaan-Munir-CV.pdf").replace(/^\/+/, ""));
    if (!fallback.startsWith(PUBLIC)) return res.status(400).json({ error: "Bad CV path." });
    return res.sendFile(fallback, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": (inline ? "inline" : "attachment") + '; filename="' + name + '"',
      },
    }, (err) => {
      if (err) res.status(404).json({ error: "No CV has been uploaded yet." });
    });
  } catch (err) {
    next(err);
  }
});

app.get("/admin", (req, res) => res.sendFile(path.join(PUBLIC, "admin.html")));
// Waiting room for the apps that are one sleeping server on Render (TriageDesk, DocMind): the page
// comes from this warm service at once, wakes the app and opens it when it answers.
app.get("/open/:app", (req, res) => res.sendFile(path.join(PUBLIC, "open.html")));
app.get("/healthz", (req, res) => res.json({ ok: true, storage: store.getMode() }));

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "No such endpoint." });
  }
  res.status(404).sendFile(path.join(PUBLIC, "index.html"));
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? "Something broke on the server." : err.message,
  });
});

function banner(mode) {
  const cfg = require("./middleware/auth").configReport();
  const stop = [];
  const warn = [];

  if (!cfg.adminPassword) {
    stop.push(
      "No admin password. The admin panel will refuse every sign-in until you set\n" +
      "        ADMIN_PASSWORD_HASH (or ADMIN_PASSWORD) in the environment."
    );
  }
  if (!cfg.sessionSecret) {
    warn.push("SESSION_SECRET is unset - you will be signed out on every restart.");
  }
  if (cfg.hashFieldHoldsPlaintext) {
    warn.push(
      "ADMIN_PASSWORD_HASH holds a plain password, not a bcrypt hash.\n" +
      "        Sign-in still works, but rename that variable to ADMIN_PASSWORD,\n" +
      "        or replace its value with the output of: node src/hash.js \"your password\""
    );
  } else if (cfg.adminPassword && !cfg.passwordHashed) {
    warn.push("ADMIN_PASSWORD is plaintext - run `node src/hash.js \"your password\"` and use ADMIN_PASSWORD_HASH.");
  }
  if (mode === "json" && process.env.NODE_ENV === "production") {
    stop.push("Running in production on the JSON store. Set MONGODB_URI or every edit vanishes on restart.");
  }

  if (stop.length || warn.length) console.log("");
  stop.forEach((s) => console.log("[STOP] " + s));
  warn.forEach((w) => console.log("[warn] " + w));
  if (stop.length || warn.length) console.log("");
}

(async function start() {
  const mode = await store.init();
  if (await store.isEmpty()) {
    console.log("[seed] empty store - loading starter content");
    await seed.run(store);
  }
  banner(mode);
  app.listen(PORT, () => {
    console.log("Portfolio  -> http://localhost:" + PORT);
    console.log("Admin      -> http://localhost:" + PORT + "/admin");
  });
})().catch((err) => {
  console.error("Failed to start:", err.message);
  process.exit(1);
});
