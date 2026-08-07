require("dotenv").config();

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

const store = require("./store");
const api = require("./routes/api");
const seed = require("./seed");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, "..", "public");

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

app.use(
  express.static(PUBLIC, {
    maxAge: process.env.NODE_ENV === "production" ? "1h" : 0,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
    },
  })
);

app.get("/admin", (req, res) => res.sendFile(path.join(PUBLIC, "admin.html")));
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
  const warn = [];
  if (!process.env.SESSION_SECRET) {
    warn.push("SESSION_SECRET is unset - sessions use a known dev key.");
  }
  if (!process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_PASSWORD) {
    warn.push("ADMIN_PASSWORD is plaintext - run `node src/hash.js <password>` and use ADMIN_PASSWORD_HASH.");
  }
  if (!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD) {
    warn.push("No admin password set - the admin panel cannot be opened. Set ADMIN_PASSWORD.");
  }
  if (mode === "json" && process.env.NODE_ENV === "production") {
    warn.push("Running in production on the JSON store. Set MONGODB_URI or your edits will vanish.");
  }
  if (warn.length) {
    console.log("");
    warn.forEach((w) => console.log("[warn] " + w));
    console.log("");
  }
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
