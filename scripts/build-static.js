/**
 * Builds the public portfolio as plain files in dist/, for a Render static
 * site that never sleeps (render.yaml: ahsaan-munir).
 *
 * It copies public/, then asks the server (API_URL) for the content and the
 * CV, and saves them next to the page: content.json, which the page reads,
 * and the CV as a file. Nothing secret is needed here; the server's database
 * stays on the server. Render runs this as the static site's build command,
 * and again every time the admin panel saves (STATIC_DEPLOY_HOOK).
 *
 * The server may be asleep when the build starts. Render then holds the
 * first request while it wakes, so the build waits up to a few minutes.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const OUT = path.join(ROOT, "dist");
const CV_FILE = "Ahsaan-Munir-CV.pdf"; // the address the CV reader opens; render.yaml uses it too

function fail(message) {
  console.error("Static build stopped: " + message);
  process.exit(1);
}

function origin(raw) {
  raw = String(raw || "").trim();
  if (!raw) return "";
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : "https://" + raw).origin;
  } catch (err) {
    return "";
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  const deadline = Date.now() + 4 * 60 * 1000;
  let last = "";
  for (;;) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(90000), headers: { "User-Agent": "portfolio-static-build" } });
      if (r.ok) return r;
      last = "answered " + r.status;
      if (r.status < 500) break;
    } catch (err) {
      last = err.message;
    }
    if (Date.now() > deadline) break;
    console.log("Waiting for the server (" + last + ")...");
    await sleep(10000);
  }
  fail(url + " " + last + ".");
}

async function main() {
  const api = origin(process.env.API_URL);
  if (!api) fail("API_URL is not set. It is the server's address, for example https://ahsaan-portfolio.onrender.com.");

  const content = await (await get(api + "/api/content")).json();
  if (!content || !content.site) fail("the server sent no site content.");

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.cpSync(PUBLIC, OUT, {
    recursive: true,
    // The admin panel stays on the server; /admin on the static site redirects there.
    filter: (src) => path.basename(src) !== "admin.html" && !src.endsWith(path.join("js", "admin.js")) && !src.endsWith(path.join("css", "admin.css")),
  });

  // The CV: the uploaded one if there is one, otherwise the file in public/.
  // /cv downloads it (render.yaml sets the download header); /Ahsaan-Munir-CV.pdf reads it.
  let cv = null;
  if (content.site.hasCv) {
    cv = Buffer.from(await (await get(api + "/cv")).arrayBuffer());
  } else if (fs.existsSync(path.join(PUBLIC, CV_FILE))) {
    cv = fs.readFileSync(path.join(PUBLIC, CV_FILE));
  }
  if (cv) {
    if (cv.subarray(0, 5).toString() !== "%PDF-") fail("the CV the server sent is not a PDF.");
    fs.writeFileSync(path.join(OUT, CV_FILE), cv);
    fs.writeFileSync(path.join(OUT, "cv-download.pdf"), cv);
    content.site.cvViewUrl = "/" + CV_FILE;
  }

  fs.writeFileSync(path.join(OUT, "content.json"), JSON.stringify(content));

  const kb = (f) => Math.round(fs.statSync(path.join(OUT, f)).size / 1024);
  console.log(
    "Static site built in dist/: " + (content.projects || []).length + " projects, content.json " + kb("content.json") + " KB" +
    (cv ? ", CV " + kb(CV_FILE) + " KB" : ", no CV") + ". Content from " + api + "."
  );
}

main().catch((err) => fail(err.message));
