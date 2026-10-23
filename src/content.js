/**
 * What the public page shows. Used by /api/content, by /content.json and,
 * through /api/content, by the static build (scripts/build-static.js).
 */

const store = require("./store");

/** The CV blob is megabytes. It is served by /cv, never inlined here. */
function publicSite(site) {
  const out = Object.assign({}, site || {});
  out.hasCv = Boolean(out.cvData);
  delete out.cvData;
  return out;
}

async function loadPublicContent() {
  const [site, projects, experience, skills] = await Promise.all([
    store.getSite(),
    store.list("projects"),
    store.list("experience"),
    store.list("skills"),
  ]);
  return {
    site: publicSite(site),
    projects: projects.filter((p) => p.visible !== false),
    experience: experience.filter((e) => e.visible !== false),
    skills: skills.filter((s) => s.visible !== false),
  };
}

module.exports = { publicSite, loadPublicContent };
