/* Portfolio front end.
   Every piece of copy on this page comes from /api/content, which the admin
   panel writes to. Nothing here is hard-coded except the shapes. */

(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  root.classList.add("js");

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hoverable = window.matchMedia("(hover:hover)").matches;

  function $(sel) { return doc.querySelector(sel); }
  function esc(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function el(tag, cls, html) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  /* Only ever emit links we can vouch for. A javascript: URL saved through a
     compromised admin session should not become a working link. */
  function safeUrl(u) {
    var s = String(u || "").trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s) || s.charAt(0) === "/" || s.charAt(0) === "#") return s;
    return "";
  }

  /* ── boot tiles ─────────────────────────────────────────────── */
  var bg = $("#bootgrid");
  if (bg) {
    var hot = [5, 6, 9, 10];
    for (var b = 0; b < 16; b++) {
      var t = el("i");
      if (hot.indexOf(b) >= 0) t.className = "hot";
      t.style.animationDelay = (b * 0.038) + "s";
      bg.appendChild(t);
    }
  }
  function dismissBoot() {
    var boot = $("#boot");
    if (boot) boot.classList.add("gone");
  }
  setTimeout(dismissBoot, reduced ? 200 : 2200);

  /* ── chrome ─────────────────────────────────────────────────── */
  var prog = $("#prog"), nav = $("#nav");
  function onScroll() {
    var h = root.scrollHeight - window.innerHeight;
    if (prog) prog.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    if (nav) nav.classList.toggle("stuck", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var burger = $("#burger"), links = $("#navlinks");
  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        burger.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  var beam = $("#beam");
  if (beam && hoverable && !reduced) {
    var bx = 0, by = 0, cx = 0, cy = 0, lit = false;
    doc.addEventListener("mousemove", function (e) {
      bx = e.clientX; by = e.clientY;
      if (!lit) { beam.style.opacity = "1"; lit = true; }
    });
    (function spin() {
      cx += (bx - cx) * 0.07; cy += (by - cy) * 0.07;
      beam.style.left = cx + "px"; beam.style.top = cy + "px";
      requestAnimationFrame(spin);
    })();
  }

  /* ── reveal ─────────────────────────────────────────────────── */
  var revealer = null;
  if ("IntersectionObserver" in window) {
    revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); revealer.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -5% 0px" });
  }
  function watch(nodes) {
    if (!revealer) {
      Array.prototype.forEach.call(nodes, function (n) { n.classList.add("in"); });
      return;
    }
    Array.prototype.forEach.call(nodes, function (n) { revealer.observe(n); });
  }
  watch(doc.querySelectorAll(".rise"));

  /* ── 3D interactions ────────────────────────────────────────── */
  function tiltCard(card) {
    if (!hoverable || reduced) return;
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", (px * 100) + "%");
      card.style.setProperty("--my", (py * 100) + "%");
      card.style.transform =
        "perspective(1100px) rotateX(" + ((py - 0.5) * -7) + "deg) rotateY(" +
        ((px - 0.5) * 9) + "deg) translateZ(24px)";
      var cover = card.querySelector(".cover");
      var body = card.querySelector(".body");
      if (cover) cover.style.transform = "translateZ(38px) scale(1.012)";
      if (body) body.style.transform = "translateZ(22px)";
    });
    card.addEventListener("mouseleave", function () {
      card.style.transform = "";
      var cover = card.querySelector(".cover");
      var body = card.querySelector(".body");
      if (cover) cover.style.transform = "";
      if (body) body.style.transform = "";
    });
  }

  function magnet(node) {
    if (!hoverable || reduced) return;
    node.addEventListener("mousemove", function (e) {
      var r = node.getBoundingClientRect();
      node.style.transform =
        "translate(" + ((e.clientX - r.left - r.width / 2) * 0.15) + "px," +
        ((e.clientY - r.top - r.height / 2) * 0.2) + "px)";
    });
    node.addEventListener("mouseleave", function () { node.style.transform = ""; });
  }

  /* ── the tile wall ──────────────────────────────────────────── */
  /* Six tiles laid out on a fixed grid in 3D space. Percent positions so it
     scales with the container instead of needing a breakpoint per size. */
  var SLOTS = [
    { l: 2,  t: 4,  w: 44, h: 40, z: 60 },
    { l: 51, t: 0,  w: 34, h: 30, z: 10 },
    { l: 51, t: 33, w: 34, h: 30, z: 95 },
    { l: 2,  t: 47, w: 30, h: 34, z: 30 },
    { l: 35, t: 47, w: 30, h: 34, z: 130 },
    { l: 68, t: 66, w: 28, h: 30, z: 55 }
  ];

  function buildWall(projects) {
    var inner = $("#wallInner");
    if (!inner) return;
    inner.innerHTML = "";
    var picked = projects.slice(0, SLOTS.length);
    picked.forEach(function (p, i) {
      var s = SLOTS[i];
      var tile = el("div", "tile");
      tile.style.cssText =
        "left:" + s.l + "%;top:" + s.t + "%;width:" + s.w + "%;height:" + s.h + "%;" +
        "transform:translateZ(" + s.z + "px);--h:" + (p.hue || 210) + ";" +
        "animation-delay:" + (0.35 + i * 0.09) + "s";
      var cover = safeUrl(p.cover) || (String(p.cover || "").indexOf("data:image/") === 0 ? p.cover : "");
      if (cover) {
        tile.classList.add("has-img");
        var img = el("img");
        img.src = cover;
        img.alt = "";
        img.loading = "lazy";
        tile.appendChild(img);
      }
      tile.appendChild(el("b", null, esc(p.initials || String(p.title || "?").slice(0, 2).toUpperCase())));
      tile.appendChild(el("span", "flare"));
      inner.appendChild(tile);
    });

    var wall = $("#wall"), wi = $("#wallInner");
    if (wall && wi && hoverable && !reduced) {
      wall.addEventListener("mousemove", function (e) {
        var r = wall.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        wi.style.setProperty("--ry", (-16 + px * 22) + "deg");
        wi.style.setProperty("--rx", (10 - py * 18) + "deg");
      });
      wall.addEventListener("mouseleave", function () {
        wi.style.setProperty("--ry", "-16deg");
        wi.style.setProperty("--rx", "10deg");
      });
    }
  }

  /* ── renderers ──────────────────────────────────────────────── */
  var NUMBER_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six",
                      "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

  function renderHero(site, projects) {
    var name = site.name || "Portfolio";
    var parts = name.split(" ");
    var first = parts.shift() || name;
    var rest = parts.join(" ");
    var h1 = $("#heroName");
    h1.innerHTML =
      '<span class="ln"><span>' + esc(first.toUpperCase()) + "</span></span>" +
      (rest ? '<span class="ln"><span>' + esc(rest.toUpperCase()) + "</span></span>" : "");

    $("#brandName").textContent = (first.charAt(0) + (rest.charAt(0) || "")).toUpperCase();
    $("#heroRole").textContent = site.role || "";
    $("#heroLine").textContent = site.heroLine || "";
    $("#avail").textContent = site.availability || "Open to work";

    var live = projects.filter(function (p) { return p.status !== "archived"; }).length;
    var facts = $("#heroFacts");
    facts.innerHTML = "";
    facts.appendChild(el("span", null, "<b>" + live + "</b> live deployments"));
    var current = null;
    if (window.__experience) {
      current = window.__experience.filter(function (e) { return e.current; })[0];
    }
    if (current) facts.appendChild(el("span", null, esc(current.org || current.role)));
    if (site.location) facts.appendChild(el("span", null, esc(site.location)));

    var word = live < NUMBER_WORDS.length ? NUMBER_WORDS[live] : String(live);
    var wc = $("#workCount");
    if (wc) wc.textContent = word;

    /* /cv is served by the server, which sets the download header itself.
       That matters on phones: a link with the `download` attribute is ignored
       there and the PDF opens in a cramped built-in viewer instead. */
    var external = safeUrl(site.cvFile);
    ["#cvTop", "#cvHero", "#cvContact"].forEach(function (id) {
      var node = $(id);
      if (node) node.setAttribute("href", external || "/cv");
    });
    var viewer = $("#cvView");
    if (viewer) viewer.setAttribute("href", external || "/cv?view=1");
  }

  function renderStrip(items) {
    var strip = $("#strip");
    if (!strip) return;
    var list = (items && items.length) ? items : ["React", "Node.js", "Python", "MongoDB"];
    var html = list.map(function (x) {
      return "<span>" + esc(x) + "</span><em>&#9679;</em>";
    }).join("");
    strip.innerHTML = html + html;
  }

  /* ── free hosting: start a project's server when a visitor shows interest ── */
  // Render's free plan puts a server to sleep after 15 quiet minutes, and the first visit then waits
  // about a minute. Pinging it as soon as someone points at or taps a card gives it a head start.
  // Most apps now open from a static site that never sleeps, with the API on a second service;
  // the rules below wake that API too. They match the project's title or link.
  var ALSO_WAKE = [
    [/hoshiyar/i, ["https://hoshiyar-api.onrender.com/api/health"]],
    [/caselink/i, ["https://caselink-api.onrender.com/api/health"]],
    [/sign.?bridge|sign-web|urdu-sign/i, ["https://sign-web-v7cj.onrender.com/api/status", "https://sign-ml-api.onrender.com/health"]],
    [/qahva/i, ["https://qahva-cafe.onrender.com/api/health"]],
    [/mahru/i, ["https://mahru-store.onrender.com/api/health"]],
    [/monal/i, ["https://monal-ai.onrender.com/api/health"]],
    [/sehat/i, ["https://sehat-g2f6.onrender.com/api/health"]],
    [/job.?match/i, ["https://jobmatch-ai-lee4.onrender.com/api/health"]],
    [/lead.?desk/i, ["https://leaddesk.onrender.com/api/health"]],
    [/lum[eé]ra/i, ["https://lumera-salon.onrender.com/api/health"]],
    [/triage/i, ["https://triagedesk-r8pt.onrender.com/api/health", "https://triagedesk-ml.onrender.com/health"]]
  ];
  var woken = {};
  function ping(url) {
    if (!url || woken[url]) return;
    woken[url] = true;
    try { fetch(url, { mode: "no-cors", cache: "no-store" }).catch(function () {}); } catch (e) { /* old browser */ }
  }
  function onRender(href) {
    try { return /\.onrender\.com$/i.test(new URL(href).host); } catch (e) { return false; }
  }
  function wakeProject(href, title) {
    if (!onRender(href)) return;
    ping(href);
    var key = (title || "") + " " + href;
    ALSO_WAKE.forEach(function (rule) {
      if (rule[0].test(key)) rule[1].forEach(ping);
    });
  }

  function renderProjects(projects) {
    var wrap = $("#mosaic");
    if (!wrap) return;
    wrap.innerHTML = "";

    if (!projects.length) {
      wrap.appendChild(el("div", "empty",
        "No projects yet. Add the first one from the admin panel."));
      return;
    }

    projects.forEach(function (p) {
      var card = el("article", "card" + (p.featured ? " wide" : ""));
      card.style.setProperty("--h", p.hue || 210);

      var href = safeUrl(p.url);
      var cover = p.cover && String(p.cover).indexOf("data:image/") === 0
        ? p.cover : safeUrl(p.cover);

      var coverBox = el("div", "cover");
      if (cover) {
        var img = el("img");
        img.src = cover;
        img.alt = p.title + " cover";
        img.loading = "lazy";
        coverBox.appendChild(img);
      } else {
        coverBox.appendChild(el("span", "orb"));
        coverBox.appendChild(el("span", "kind", esc((p.tags || []).slice(0, 2).join(" · ") || "project")));
        coverBox.appendChild(el("span", "glyph",
          esc(p.initials || String(p.title || "?").slice(0, 2).toUpperCase())));
      }
      coverBox.appendChild(el("span", "scan"));
      card.appendChild(coverBox);

      var body = el("div", "body");

      var head = el("div", "head");
      var titles = el("div");
      titles.appendChild(el("h3", null, esc(p.title)));
      if (p.tagline) titles.appendChild(el("p", "sub", esc(p.tagline)));
      head.appendChild(titles);

      if (p.status === "live") {
        head.appendChild(el("span", "flag", "<i></i>LIVE"));
      } else if (p.status === "wip") {
        head.appendChild(el("span", "flag wip", "<i></i>BUILDING"));
      }
      body.appendChild(head);

      if (p.description) body.appendChild(el("p", "desc", esc(p.description)));

      if (p.tags && p.tags.length) {
        var tags = el("div", "tags");
        p.tags.forEach(function (t) { tags.appendChild(el("span", null, esc(t))); });
        body.appendChild(tags);
      }

      if (href) {
        var go = el("a", "go", "Open app <s>&#8599;</s>");
        go.href = href;
        go.target = "_blank";
        go.rel = "noopener noreferrer";
        body.appendChild(go);
        if (onRender(href)) {
          body.appendChild(el("p", "cold",
            "Free hosting: if nobody has used it for 15 minutes, it takes up to a minute to start."));
          ["pointerenter", "focusin", "touchstart"].forEach(function (ev) {
            card.addEventListener(ev, function () { wakeProject(href, p.title); }, { passive: true, once: true });
          });
        }
      } else if (p.repo && safeUrl(p.repo)) {
        var gh = el("a", "go", "View code <s>&#8599;</s>");
        gh.href = safeUrl(p.repo);
        gh.target = "_blank";
        gh.rel = "noopener noreferrer";
        body.appendChild(gh);
      }

      card.appendChild(body);
      card.appendChild(el("div", "sheen"));
      wrap.appendChild(card);
      tiltCard(card);
    });

    watch(wrap.querySelectorAll(".card"));
  }

  function renderExperience(items) {
    var track = $("#track");
    if (!track) return;
    track.innerHTML = "";
    if (!items.length) {
      track.appendChild(el("div", "empty", "No roles added yet."));
      return;
    }
    items.forEach(function (x, i) {
      var stop = el("div", "stop rise" + (x.current ? " now" : ""));
      if (i < 4) stop.classList.add("s" + Math.min(i, 4));
      var when = el("span", "when", esc(x.period || ""));
      stop.appendChild(when);
      if (x.current) stop.appendChild(el("span", "tag", "current"));
      stop.appendChild(el("h3", null, esc(x.role)));
      if (x.org) stop.appendChild(el("p", "org", esc(x.org)));
      if (x.points && x.points.length) {
        var ul = el("ul");
        x.points.forEach(function (pt) { ul.appendChild(el("li", null, esc(pt))); });
        stop.appendChild(ul);
      }
      track.appendChild(stop);
    });
    watch(track.querySelectorAll(".rise"));
  }

  function renderSkills(groups) {
    var wrap = $("#skills");
    if (!wrap) return;
    wrap.innerHTML = "";
    if (!groups.length) {
      wrap.appendChild(el("div", "empty", "No skills added yet."));
      return;
    }
    groups.forEach(function (g, i) {
      var box = el("div", "sgroup rise s" + (i % 4));
      box.appendChild(el("h3", null, esc(g.group)));
      var chips = el("div", "chips");
      (g.items || []).forEach(function (it) { chips.appendChild(el("span", null, esc(it))); });
      box.appendChild(chips);
      wrap.appendChild(box);
    });
    watch(wrap.querySelectorAll(".rise"));
  }

  function renderAbout(site) {
    if (site.aboutTitle) {
      var words = site.aboutTitle.split(" ");
      var last = words.pop();
      $("#aboutTitle").innerHTML = esc(words.join(" ")) + " <em>" + esc(last) + "</em>";
    }
    var copy = $("#aboutCopy");
    copy.innerHTML = "";
    (site.about || []).forEach(function (para) {
      copy.appendChild(el("p", null, esc(para)));
    });

    var figs = $("#figs");
    figs.innerHTML = "";
    (site.stats || []).forEach(function (s, i) {
      var fig = el("div", "fig rise s" + (i % 4));
      var b = el("b", null, "0");
      b.setAttribute("data-count", s.value);
      b.setAttribute("data-suffix", s.suffix || "");
      fig.appendChild(b);
      fig.appendChild(el("span", null, esc(s.label || "")));
      figs.appendChild(fig);
    });
    watch(figs.querySelectorAll(".rise"));
    countUp(figs.querySelectorAll("b[data-count]"));
  }

  function renderContact(site) {
    $("#contactTitle").innerHTML = (function () {
      var t = site.contactTitle || "Let's build something that ships.";
      var w = t.split(" ");
      var last = w.pop();
      return esc(w.join(" ")) + " <em>" + esc(last) + "</em>";
    })();
    $("#contactLine").textContent = site.contactLine || "";

    var mail = $("#mailBtn");
    mail.textContent = (site.email || "Get in touch") + "  \u29C9";
    mail.addEventListener("click", function () {
      var email = site.email || "";
      if (!email) return;
      function flash() {
        var toast = $("#toast");
        if (!toast) return;
        toast.classList.add("show");
        setTimeout(function () { toast.classList.remove("show"); }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(flash, function () {
          window.location.href = "mailto:" + email;
        });
      } else {
        window.location.href = "mailto:" + email;
      }
    });

    var reach = $("#reach");
    reach.innerHTML = "";
    if (site.phone) {
      var tel = el("a", null, "\u260E " + esc(site.phone));
      tel.href = "tel:" + site.phone.replace(/\s/g, "");
      reach.appendChild(tel);
    }
    if (safeUrl(site.linkedin)) {
      var li = el("a", null, "in/ linkedin \u2197");
      li.href = safeUrl(site.linkedin); li.target = "_blank"; li.rel = "noopener noreferrer";
      reach.appendChild(li);
    }
    if (safeUrl(site.github)) {
      var gh = el("a", null, "gh/ github \u2197");
      gh.href = safeUrl(site.github); gh.target = "_blank"; gh.rel = "noopener noreferrer";
      reach.appendChild(gh);
    }
    $("#footNote").textContent = site.footer || "";
  }

  function countUp(nodes) {
    function run(node) {
      var target = parseInt(node.getAttribute("data-count"), 10) || 0;
      var suffix = node.getAttribute("data-suffix") || "";
      if (reduced) { node.textContent = target + suffix; return; }
      var start = null;
      function tick(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / 1300, 1);
        node.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(nodes, run);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    Array.prototype.forEach.call(nodes, function (n) { io.observe(n); });
  }

  /* ── nav highlighting ───────────────────────────────────────── */
  function spy() {
    var secs = doc.querySelectorAll("section[id]");
    var anchors = doc.querySelectorAll(".navlinks a[href^='#']");
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.getAttribute("id");
        Array.prototype.forEach.call(anchors, function (a) {
          a.classList.toggle("on", a.getAttribute("href") === "#" + id);
        });
      });
    }, { rootMargin: "-42% 0px -52% 0px" });
    Array.prototype.forEach.call(secs, function (s) { io.observe(s); });
  }

  /* ── go ─────────────────────────────────────────────────────── */
  fetch("/api/content", { headers: { Accept: "application/json" } })
    .then(function (r) {
      if (!r.ok) throw new Error("Content unavailable (" + r.status + ")");
      return r.json();
    })
    .then(function (data) {
      var site = data.site || {};
      var projects = data.projects || [];
      window.__experience = data.experience || [];

      renderHero(site, projects);
      buildWall(projects);
      renderStrip(site.marquee);
      renderProjects(projects);
      renderExperience(data.experience || []);
      renderSkills(data.skills || []);
      renderAbout(site);
      renderContact(site);
      spy();

      Array.prototype.forEach.call(doc.querySelectorAll(".btn"), magnet);
      dismissBoot();
    })
    .catch(function (err) {
      dismissBoot();
      var m = $("#mosaic");
      if (m) {
        m.innerHTML = "";
        m.appendChild(el("div", "empty",
          "Couldn't load the content. " + esc(err.message) +
          " — check the server is running, then reload."));
      }
    });
})();
