/**
 * Admin authentication.
 *
 * One admin, credentials from the environment. There is no signup route and
 * no user collection, because a portfolio has exactly one author and every
 * extra account is another way in.
 *
 * The session is a signed JWT in an httpOnly cookie, so page scripts cannot
 * read it even if something manages to inject one.
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const COOKIE = "pf_session";
const MAX_AGE = 1000 * 60 * 60 * 12;

/* A missing SESSION_SECRET used to throw, which turned every production
   login into a 500 with no explanation - the admin panel simply refused to
   open and nothing said why. Now the server generates one at boot and says
   so loudly. Sessions do not survive a restart until a real secret is set,
   which is a nuisance rather than a wall. */
const EPHEMERAL = require("crypto").randomBytes(48).toString("hex");
let warned = false;

function secret() {
  const s = (process.env.SESSION_SECRET || "").trim();
  if (s) return s;
  if (!warned) {
    warned = true;
    console.log("[warn] SESSION_SECRET is not set. Using a temporary key - you");
    console.log("[warn] will be signed out every time the server restarts.");
  }
  return EPHEMERAL;
}

/** What is configured, for the startup banner and the health endpoint.
 *  Never returns a secret or a hash, only whether one exists. */
function configReport() {
  return {
    adminUser: Boolean((process.env.ADMIN_USERNAME || "").trim()),
    adminPassword: Boolean(
      (process.env.ADMIN_PASSWORD_HASH || "").trim() ||
      (process.env.ADMIN_PASSWORD || "").trim()
    ),
    passwordHashed: Boolean((process.env.ADMIN_PASSWORD_HASH || "").trim()),
    sessionSecret: Boolean((process.env.SESSION_SECRET || "").trim()),
  };
}

async function verifyCredentials(username, password) {
  const wantUser = (process.env.ADMIN_USERNAME || "admin").trim();
  const hash = (process.env.ADMIN_PASSWORD_HASH || "").trim();
  const plain = (process.env.ADMIN_PASSWORD || "").trim();

  if (username !== wantUser) return false;
  if (hash) return bcrypt.compare(password, hash);
  if (plain) return password === plain;
  return false;
}

function issue(res, username) {
  const token = jwt.sign({ u: username }, secret(), { expiresIn: "12h" });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
  });
}

function clear(res) {
  res.clearCookie(COOKIE);
}

function currentUser(req) {
  const token = req.cookies ? req.cookies[COOKIE] : null;
  if (!token) return null;
  try {
    return jwt.verify(token, secret()).u;
  } catch (err) {
    return null;
  }
}

function requireAdmin(req, res, next) {
  const user = currentUser(req);
  if (!user) {
    return res.status(401).json({ error: "Sign in to make changes." });
  }
  req.admin = user;
  next();
}

module.exports = {
  configReport,
  verifyCredentials,
  issue,
  clear,
  currentUser,
  requireAdmin,
  COOKIE,
};
