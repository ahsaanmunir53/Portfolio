/**
 * Storage.
 *
 * Two backends behind one interface.
 *
 *   MONGODB_URI set   -> Mongoose. Survives restarts and redeploys.
 *   MONGODB_URI blank -> a JSON file on disk. Runs instantly with nothing
 *                        installed, which is what you want while building.
 *
 * The JSON backend is for local work only. Render's free tier gives every
 * deploy a fresh filesystem, so anything written there disappears the next
 * time the service restarts - and free services restart on their own after
 * fifteen minutes idle. The server says so loudly at boot rather than
 * letting you discover it when your projects vanish.
 */

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "..", "data", "portfolio.json");

const EMPTY = {
  site: null,
  projects: [],
  experience: [],
  skills: [],
};

let mode = "json";
let cache = null;

/* ---------------------------------------------------------------- JSON ---- */

function readJson() {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    cache = Object.assign({}, EMPTY, JSON.parse(raw));
  } catch (err) {
    cache = JSON.parse(JSON.stringify(EMPTY));
  }
  return cache;
}

function writeJson() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(cache, null, 2));
}

function nextId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ------------------------------------------------------------- Mongoose ---- */

let models = null;

async function connectMongo(uri) {
  const mongoose = require("mongoose");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });
  models = require("./models")(mongoose);
  mode = "mongo";
}

/* -------------------------------------------------------------- public ---- */

const COLLECTIONS = ["projects", "experience", "skills"];

async function init() {
  const uri = (process.env.MONGODB_URI || "").trim();
  if (!uri) {
    readJson();
    console.log("[store] JSON file mode -> " + DATA_FILE);
    console.log("[store] WARNING: on Render's free tier this file is wiped on every");
    console.log("[store]          restart and redeploy. Set MONGODB_URI before you");
    console.log("[store]          rely on anything you enter in the admin panel.");
    return "json";
  }
  await connectMongo(uri);
  console.log("[store] MongoDB connected");
  return "mongo";
}

function getMode() {
  return mode;
}

async function list(collection) {
  if (!COLLECTIONS.includes(collection)) throw new Error("Unknown collection");
  if (mode === "mongo") {
    const docs = await models[collection].find().sort({ order: 1, createdAt: 1 }).lean();
    return docs.map(normalise);
  }
  const data = readJson();
  return data[collection].slice().sort((a, b) => (a.order || 0) - (b.order || 0));
}

async function create(collection, payload) {
  if (!COLLECTIONS.includes(collection)) throw new Error("Unknown collection");
  if (mode === "mongo") {
    const count = await models[collection].countDocuments();
    const doc = await models[collection].create(
      Object.assign({ order: count }, payload)
    );
    return normalise(doc.toObject());
  }
  const data = readJson();
  const item = Object.assign({ id: nextId(), order: data[collection].length }, payload);
  data[collection].push(item);
  writeJson();
  return item;
}

async function update(collection, id, payload) {
  if (!COLLECTIONS.includes(collection)) throw new Error("Unknown collection");
  if (mode === "mongo") {
    const doc = await models[collection]
      .findByIdAndUpdate(id, payload, { new: true, runValidators: true })
      .lean();
    return doc ? normalise(doc) : null;
  }
  const data = readJson();
  const item = data[collection].find((x) => x.id === id);
  if (!item) return null;
  Object.assign(item, payload, { id: item.id });
  writeJson();
  return item;
}

async function remove(collection, id) {
  if (!COLLECTIONS.includes(collection)) throw new Error("Unknown collection");
  if (mode === "mongo") {
    const res = await models[collection].findByIdAndDelete(id);
    return Boolean(res);
  }
  const data = readJson();
  const before = data[collection].length;
  data[collection] = data[collection].filter((x) => x.id !== id);
  if (data[collection].length === before) return false;
  writeJson();
  return true;
}

async function reorder(collection, ids) {
  if (!COLLECTIONS.includes(collection)) throw new Error("Unknown collection");
  if (mode === "mongo") {
    await Promise.all(
      ids.map((id, i) => models[collection].findByIdAndUpdate(id, { order: i }))
    );
    return list(collection);
  }
  const data = readJson();
  ids.forEach((id, i) => {
    const item = data[collection].find((x) => x.id === id);
    if (item) item.order = i;
  });
  writeJson();
  return list(collection);
}

async function getSite() {
  if (mode === "mongo") {
    const doc = await models.site.findOne().lean();
    return doc ? normalise(doc) : null;
  }
  return readJson().site;
}

async function saveSite(payload) {
  if (mode === "mongo") {
    const doc = await models.site
      .findOneAndUpdate({}, payload, { new: true, upsert: true, runValidators: true })
      .lean();
    return normalise(doc);
  }
  const data = readJson();
  data.site = Object.assign({}, data.site || {}, payload);
  writeJson();
  return data.site;
}

/** Mongo returns _id; the front end only ever knows about id. */
function normalise(doc) {
  if (!doc) return doc;
  const out = Object.assign({}, doc);
  if (out._id) {
    out.id = String(out._id);
    delete out._id;
  }
  delete out.__v;
  return out;
}

async function isEmpty() {
  const projects = await list("projects");
  const site = await getSite();
  return projects.length === 0 && !site;
}

module.exports = {
  init,
  getMode,
  list,
  create,
  update,
  remove,
  reorder,
  getSite,
  saveSite,
  isEmpty,
  DATA_FILE,
};
