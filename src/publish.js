/**
 * Publishing to the static site.
 *
 * With two services (render.yaml), visitors get the public page from a
 * static site that never sleeps, built from this server's content. After
 * every change in the admin panel this asks Render to rebuild it, through
 * the static site's Deploy Hook (STATIC_DEPLOY_HOOK, a secret). Saves that
 * come close together share one rebuild.
 */

const DELAY_MS = 30 * 1000;
let timer = null;

function hook() {
  return (process.env.STATIC_DEPLOY_HOOK || "").trim();
}

function schedule() {
  const url = hook();
  if (!url) return;
  clearTimeout(timer);
  timer = setTimeout(async () => {
    timer = null;
    try {
      const r = await fetch(url, { method: "POST", signal: AbortSignal.timeout(15000) });
      if (r.ok) console.log("[publish] Asked Render to rebuild the static site.");
      else console.error("[publish] The deploy hook answered " + r.status + ". Check STATIC_DEPLOY_HOOK.");
    } catch (err) {
      console.error("[publish] Could not reach the deploy hook: " + err.message);
    }
  }, DELAY_MS);
}

/** "off" with one service, "static" when saves are published, "no-hook" when they cannot be. */
function mode() {
  if (!(process.env.PUBLIC_SITE_URL || "").trim()) return "off";
  return hook() ? "static" : "no-hook";
}

module.exports = { schedule, mode };
