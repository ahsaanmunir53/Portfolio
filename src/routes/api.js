/**
 * API.
 *
 * GET routes are public - the site itself is the main consumer.
 * Every write is behind requireAdmin.
 *
 * Field whitelists on write are not decoration: without them a crafted
 * request could set `order` to nonsense or add junk keys that then render
 * on the live page.
 */

const express = require("express");
const store = require("../store");
const { verifyCredentials, issue, clear, currentUser, requireAdmin } =
  require("../middleware/auth");

const router = express.Router();

/* ------------------------------------------------------------- helpers ---- */

const MAX_COVER_CHARS = 3_000_000; // ~2.2MB decoded

function str(v, max) {
  if (v === undefined || v === null) return undefined;
  return String(v).trim().slice(0, max);
}

function strList(v, maxItems, maxLen) {
  if (!Array.isArray(v)) return undefined;
  return v
    .map((x) => String(x).trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

function bool(v) {
  if (v === undefined) return undefined;
  return Boolean(v);
}

function pick(obj, shape) {
  const out = {};
  Object.keys(shape).forEach((key) => {
    const val = shape[key](obj[key]);
    if (val !== undefined) out[key] = val;
  });
  return out;
}

function coverField(v) {
  if (v === undefined) return undefined;
  const s = String(v);
  if (s === "") return "";
  if (s.length > MAX_COVER_CHARS) {
    const err = new Error("Cover image is too large. Pick a smaller file.");
    err.status = 413;
    throw err;
  }
  if (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(s) && !/^https?:\/\//.test(s)) {
    const err = new Error("Cover must be an uploaded image or an https URL.");
    err.status = 400;
    throw err;
  }
  return s;
}

const PROJECT_SHAPE = {
  title: (v) => str(v, 120),
  tagline: (v) => str(v, 160),
  description: (v) => str(v, 900),
  url: (v) => str(v, 400),
  repo: (v) => str(v, 400),
  cover: coverField,
  initials: (v) => (v === undefined ? undefined : String(v).trim().slice(0, 3).toUpperCase()),
  hue: (v) => (v === undefined ? undefined : Math.max(0, Math.min(360, Number(v) || 0))),
  tags: (v) => strList(v, 10, 30),
  status: (v) => (v === undefined ? undefined : (["live", "wip", "archived"].includes(v) ? v : "live")),
  featured: bool,
  visible: bool,
};

const EXPERIENCE_SHAPE = {
  role: (v) => str(v, 140),
  org: (v) => str(v, 160),
  period: (v) => str(v, 80),
  current: bool,
  points: (v) => strList(v, 8, 300),
  visible: bool,
};

const SKILL_SHAPE = {
  group: (v) => str(v, 80),
  items: (v) => strList(v, 30, 40),
  visible: bool,
};

const SITE_SHAPE = {
  name: (v) => str(v, 80),
  role: (v) => str(v, 120),
  availability: (v) => str(v, 120),
  heroLine: (v) => str(v, 400),
  aboutTitle: (v) => str(v, 120),
  about: (v) => strList(v, 6, 900),
  email: (v) => str(v, 160),
  phone: (v) => str(v, 60),
  location: (v) => str(v, 100),
  linkedin: (v) => str(v, 300),
  github: (v) => str(v, 300),
  cvFile: (v) => str(v, 200),
  contactTitle: (v) => str(v, 160),
  contactLine: (v) => str(v, 400),
  footer: (v) => str(v, 300),
  marquee: (v) => strList(v, 24, 40),
  stats: (v) => {
    if (!Array.isArray(v)) return undefined;
    return v.slice(0, 6).map((s) => ({
      value: Number(s.value) || 0,
      suffix: String(s.suffix || "").slice(0, 6),
      label: String(s.label || "").slice(0, 60),
    }));
  },
};

const SHAPES = {
  projects: PROJECT_SHAPE,
  experience: EXPERIENCE_SHAPE,
  skills: SKILL_SHAPE,
};

/* ---------------------------------------------------------------- auth ---- */

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Enter a username and password." });
  }
  const ok = await verifyCredentials(String(username), String(password));
  if (!ok) {
    return res.status(401).json({ error: "That username and password don't match." });
  }
  issue(res, String(username));
  res.json({ ok: true, user: String(username) });
});

router.post("/auth/logout", (req, res) => {
  clear(res);
  res.json({ ok: true });
});

router.get("/auth/me", (req, res) => {
  const user = currentUser(req);
  res.json({ user: user, storage: store.getMode() });
});

/* -------------------------------------------------------------- public ---- */

router.get("/content", async (req, res, next) => {
  try {
    const [site, projects, experience, skills] = await Promise.all([
      store.getSite(),
      store.list("projects"),
      store.list("experience"),
      store.list("skills"),
    ]);
    res.json({
      site: site || {},
      projects: projects.filter((p) => p.visible !== false),
      experience: experience.filter((e) => e.visible !== false),
      skills: skills.filter((s) => s.visible !== false),
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------- admin: reads ---- */

router.get("/admin/content", requireAdmin, async (req, res, next) => {
  try {
    const [site, projects, experience, skills] = await Promise.all([
      store.getSite(),
      store.list("projects"),
      store.list("experience"),
      store.list("skills"),
    ]);
    res.json({ site: site || {}, projects, experience, skills, storage: store.getMode() });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------ admin: writes ---- */

["projects", "experience", "skills"].forEach((collection) => {
  router.post("/admin/" + collection, requireAdmin, async (req, res, next) => {
    try {
      const payload = pick(req.body || {}, SHAPES[collection]);
      const required = collection === "projects" ? "title" : collection === "skills" ? "group" : "role";
      if (!payload[required]) {
        return res.status(400).json({ error: "The " + required + " field is required." });
      }
      res.status(201).json(await store.create(collection, payload));
    } catch (err) {
      next(err);
    }
  });

  router.put("/admin/" + collection + "/:id", requireAdmin, async (req, res, next) => {
    try {
      const payload = pick(req.body || {}, SHAPES[collection]);
      const updated = await store.update(collection, req.params.id, payload);
      if (!updated) return res.status(404).json({ error: "That item no longer exists." });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/admin/" + collection + "/:id", requireAdmin, async (req, res, next) => {
    try {
      const gone = await store.remove(collection, req.params.id);
      if (!gone) return res.status(404).json({ error: "That item no longer exists." });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  router.post("/admin/" + collection + "/reorder", requireAdmin, async (req, res, next) => {
    try {
      const ids = Array.isArray(req.body.ids) ? req.body.ids.map(String) : [];
      res.json(await store.reorder(collection, ids));
    } catch (err) {
      next(err);
    }
  });
});

router.put("/admin/site", requireAdmin, async (req, res, next) => {
  try {
    res.json(await store.saveSite(pick(req.body || {}, SITE_SHAPE)));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
