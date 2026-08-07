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

function secret() {
  const s = (process.env.SESSION_SECRET || "").trim();
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production.");
  }
  return "dev-only-insecure-secret";
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
  verifyCredentials,
  issue,
  clear,
  currentUser,
  requireAdmin,
  COOKIE,
};
