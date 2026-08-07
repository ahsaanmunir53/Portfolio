/* Admin panel.
   Every section of the public site is edited from here. */

(function () {
  "use strict";

  var doc = document;
  function $(s, scope) { return (scope || doc).querySelector(s); }
  function $$(s, scope) { return Array.prototype.slice.call((scope || doc).querySelectorAll(s)); }

  var state = { projects: [], experience: [], skills: [], site: {} };

  /* ── transport ───────────────────────────────────────────────── */

  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    opts.credentials = "same-origin";
    return fetch("/api" + path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) {
        if (!r.ok) {
          var err = new Error(body.error || ("Request failed (" + r.status + ")"));
          err.status = r.status;
          throw err;
        }
        return body;
      });
    });
  }

  function flash(msg, bad) {
    var box = $("#flash");
    var t = doc.createElement("div");
    t.className = "toast" + (bad ? " bad" : "");
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(function () { t.remove(); }, 3400);
  }

  /* ── sign in ─────────────────────────────────────────────────── */

  var form = $("#signin");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = $("#signinBtn");
    var errBox = $("#signinErr");
    errBox.textContent = "";
    btn.disabled = true;
    api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: $("#u").value, password: $("#p").value })
    })
      .then(boot)
      .catch(function (err) { errBox.textContent = err.message; })
      .finally(function () { btn.disabled = false; });
  });

  $("#logout").addEventListener("click", function () {
    api("/auth/logout", { method: "POST" }).finally(function () {
      window.location.reload();
    });
  });

  /* ── tabs ────────────────────────────────────────────────────── */

  $$(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      $$(".tab").forEach(function (t) { t.classList.toggle("on", t === tab); });
      var want = tab.getAttribute("data-tab");
      $$(".panel").forEach(function (p) {
        p.classList.toggle("on", p.getAttribute("data-panel") === want);
      });
    });
  });

  /* ── helpers ─────────────────────────────────────────────────── */

  function readField(node) {
    if (node.type === "checkbox") return node.checked;
    if (node.type === "range") return Number(node.value);
    return node.value;
  }

  function writeField(node, value) {
    if (node.type === "checkbox") { node.checked = Boolean(value); return; }
    node.value = value === undefined || value === null ? "" : value;
  }

  function commaList(s) {
    return String(s || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function lineList(s) {
    return String(s || "").split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
  }

  /* Resize before upload. A phone photo is 4MB of JPEG; a portfolio cover
     needs 1200px. Doing it here means the request stays small and MongoDB
     never stores a 4MB string. */
  function shrinkImage(file, maxWidth) {
    return new Promise(function (resolve, reject) {
      if (!/^image\//.test(file.type)) {
        reject(new Error("That file is not an image."));
        return;
      }
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("Couldn't read that file.")); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("That image is corrupt or unsupported.")); };
        img.onload = function () {
          var scale = Math.min(1, maxWidth / img.width);
          var w = Math.round(img.width * scale);
          var h = Math.round(img.height * scale);
          var canvas = doc.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);

          var out = canvas.toDataURL("image/webp", 0.82);
          // Safari below 14 has no WebP encoder and silently returns a PNG
          // data URL, which is far bigger. Fall back to JPEG in that case.
          if (out.indexOf("data:image/webp") !== 0) {
            out = canvas.toDataURL("image/jpeg", 0.85);
          }
          resolve(out);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ── rows ────────────────────────────────────────────────────── */

  var CONFIG = {
    projects: {
      tpl: "#tpl-project",
      mount: "#projectRows",
      blank: function () {
        return { title: "New project", tagline: "", description: "", url: "", repo: "",
                 cover: "", initials: "", hue: 210, tags: [], status: "live",
                 featured: false, visible: true };
      },
      label: function (x) { return x.title || "Untitled"; },
      toForm: function (row, item) {
        $$("[data-f]", row).forEach(function (node) {
          var key = node.getAttribute("data-f");
          writeField(node, key === "tags" ? (item.tags || []).join(", ") : item[key]);
        });
        var hue = $("[data-f=hue]", row);
        var swatch = $("[data-swatch]", row);
        function paint() { swatch.style.setProperty("--sw", hue.value); }
        hue.addEventListener("input", paint);
        paint();

        var preview = $("[data-preview]", row);
        var img = $("img", preview);
        var emptyMsg = $(".cover-empty", preview);
        function showCover(src) {
          if (src) { img.src = src; img.hidden = false; emptyMsg.style.display = "none"; }
          else { img.removeAttribute("src"); img.hidden = true; emptyMsg.style.display = ""; }
        }
        showCover(item.cover);
        row.__cover = item.cover || "";

        $("[data-file]", row).addEventListener("change", function (e) {
          var file = e.target.files && e.target.files[0];
          if (!file) return;
          shrinkImage(file, 1200).then(function (dataUrl) {
            row.__cover = dataUrl;
            showCover(dataUrl);
            flash("Cover ready — press Save to keep it.");
          }).catch(function (err) { flash(err.message, true); });
          e.target.value = "";
        });
        $("[data-clearcover]", row).addEventListener("click", function () {
          row.__cover = "";
          showCover("");
        });
      },
      fromForm: function (row) {
        var out = { cover: row.__cover || "" };
        $$("[data-f]", row).forEach(function (node) {
          var key = node.getAttribute("data-f");
          out[key] = key === "tags" ? commaList(node.value) : readField(node);
        });
        return out;
      },
      badge: function (x) {
        if (x.visible === false) return { text: "hidden", cls: "hidden-flag" };
        if (x.status === "live") return { text: "live", cls: "live" };
        if (x.status === "wip") return { text: "building", cls: "wip" };
        return { text: "archived", cls: "" };
      }
    },

    experience: {
      tpl: "#tpl-experience",
      mount: "#experienceRows",
      blank: function () {
        return { role: "New role", org: "", period: "", current: false, points: [], visible: true };
      },
      label: function (x) { return x.role || "Untitled"; },
      toForm: function (row, item) {
        $$("[data-f]", row).forEach(function (node) {
          var key = node.getAttribute("data-f");
          writeField(node, key === "points" ? (item.points || []).join("\n") : item[key]);
        });
      },
      fromForm: function (row) {
        var out = {};
        $$("[data-f]", row).forEach(function (node) {
          var key = node.getAttribute("data-f");
          out[key] = key === "points" ? lineList(node.value) : readField(node);
        });
        return out;
      },
      badge: function (x) {
        if (x.visible === false) return { text: "hidden", cls: "hidden-flag" };
        return x.current ? { text: "current", cls: "live" } : { text: "past", cls: "" };
      }
    },

    skills: {
      tpl: "#tpl-skill",
      mount: "#skillRows",
      blank: function () { return { group: "New group", items: [], visible: true }; },
      label: function (x) { return x.group || "Untitled"; },
      toForm: function (row, item) {
        $$("[data-f]", row).forEach(function (node) {
          var key = node.getAttribute("data-f");
          writeField(node, key === "items" ? (item.items || []).join(", ") : item[key]);
        });
      },
      fromForm: function (row) {
        var out = {};
        $$("[data-f]", row).forEach(function (node) {
          var key = node.getAttribute("data-f");
          out[key] = key === "items" ? commaList(node.value) : readField(node);
        });
        return out;
      },
      badge: function (x) {
        if (x.visible === false) return { text: "hidden", cls: "hidden-flag" };
        return { text: (x.items || []).length + " items", cls: "" };
      }
    }
  };

  function buildRow(collection, item) {
    var cfg = CONFIG[collection];
    var row = $(cfg.tpl).content.firstElementChild.cloneNode(true);
    row.dataset.id = item.id;

    $(".row-title", row).textContent = cfg.label(item);
    var badge = cfg.badge(item);
    var pill = $(".pill", row);
    pill.textContent = badge.text;
    pill.className = "pill status " + badge.cls;

    cfg.toForm(row, item);

    $(".toggle", row).addEventListener("click", function () {
      var open = row.classList.toggle("open");
      $(".toggle", row).textContent = open ? "Close" : "Edit";
    });

    $("[data-save]", row).addEventListener("click", function () {
      var btn = this;
      btn.disabled = true;
      var payload = cfg.fromForm(row);
      api("/admin/" + collection + "/" + item.id, {
        method: "PUT",
        body: JSON.stringify(payload)
      }).then(function (updated) {
        Object.assign(item, updated);
        $(".row-title", row).textContent = cfg.label(item);
        var b = cfg.badge(item);
        pill.textContent = b.text;
        pill.className = "pill status " + b.cls;
        var saved = $("[data-saved]", row);
        saved.textContent = "Saved";
        saved.classList.add("show");
        setTimeout(function () { saved.classList.remove("show"); }, 1800);
      }).catch(function (err) {
        flash(err.message, true);
      }).finally(function () { btn.disabled = false; });
    });

    $("[data-delete]", row).addEventListener("click", function () {
      if (!window.confirm("Delete \u201C" + cfg.label(item) + "\u201D? This cannot be undone.")) return;
      api("/admin/" + collection + "/" + item.id, { method: "DELETE" })
        .then(function () {
          row.remove();
          state[collection] = state[collection].filter(function (x) { return x.id !== item.id; });
          flash("Deleted.");
        })
        .catch(function (err) { flash(err.message, true); });
    });

    wireDrag(collection, row);
    return row;
  }

  function renderCollection(collection) {
    var mount = $(CONFIG[collection].mount);
    mount.innerHTML = "";
    state[collection].forEach(function (item) {
      mount.appendChild(buildRow(collection, item));
    });
  }

  /* ── drag to reorder ─────────────────────────────────────────── */

  var dragging = null;

  function wireDrag(collection, row) {
    row.addEventListener("dragstart", function (e) {
      dragging = { row: row, collection: collection };
      row.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      // Firefox will not start a drag without data on the transfer.
      e.dataTransfer.setData("text/plain", row.dataset.id);
    });
    row.addEventListener("dragend", function () {
      row.classList.remove("dragging");
      $$(".row").forEach(function (r) { r.classList.remove("over"); });
      dragging = null;
    });
    row.addEventListener("dragover", function (e) {
      if (!dragging || dragging.collection !== collection || dragging.row === row) return;
      e.preventDefault();
      row.classList.add("over");
    });
    row.addEventListener("dragleave", function () { row.classList.remove("over"); });
    row.addEventListener("drop", function (e) {
      if (!dragging || dragging.collection !== collection || dragging.row === row) return;
      e.preventDefault();
      row.classList.remove("over");

      var mount = $(CONFIG[collection].mount);
      var rows = $$(".row", mount);
      var from = rows.indexOf(dragging.row);
      var to = rows.indexOf(row);
      if (from < to) mount.insertBefore(dragging.row, row.nextSibling);
      else mount.insertBefore(dragging.row, row);

      var ids = $$(".row", mount).map(function (r) { return r.dataset.id; });
      api("/admin/" + collection + "/reorder", {
        method: "POST",
        body: JSON.stringify({ ids: ids })
      }).then(function (fresh) {
        state[collection] = fresh;
        flash("Order saved.");
      }).catch(function (err) { flash(err.message, true); });
    });
  }

  /* ── add buttons ─────────────────────────────────────────────── */

  function addTo(collection) {
    api("/admin/" + collection, {
      method: "POST",
      body: JSON.stringify(CONFIG[collection].blank())
    }).then(function (created) {
      state[collection].push(created);
      var mount = $(CONFIG[collection].mount);
      var row = buildRow(collection, created);
      mount.appendChild(row);
      row.classList.add("open");
      $(".toggle", row).textContent = "Close";
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      var first = $("input[data-f]", row);
      if (first) { first.focus(); first.select(); }
    }).catch(function (err) { flash(err.message, true); });
  }

  $("#addProject").addEventListener("click", function () { addTo("projects"); });
  $("#addExperience").addEventListener("click", function () { addTo("experience"); });
  $("#addSkill").addEventListener("click", function () { addTo("skills"); });

  /* ── site tab ────────────────────────────────────────────────── */

  var SITE_INPUTS = ["name", "role", "avail", "location", "heroLine", "marquee",
    "aboutTitle", "about", "email", "phone", "linkedin", "github",
    "contactTitle", "contactLine", "cvFile", "footer"];

  function statRow(stat) {
    var wrap = doc.createElement("div");
    wrap.className = "stat-row";
    wrap.innerHTML =
      '<input type="number" data-s="value" placeholder="10">' +
      '<input type="text" data-s="suffix" placeholder="%">' +
      '<input type="text" data-s="label" placeholder="live deployments">' +
      '<button class="btn danger small" type="button">Remove</button>';
    $("[data-s=value]", wrap).value = stat.value || 0;
    $("[data-s=suffix]", wrap).value = stat.suffix || "";
    $("[data-s=label]", wrap).value = stat.label || "";
    $("button", wrap).addEventListener("click", function () { wrap.remove(); });
    return wrap;
  }

  function fillSite(site) {
    $("#s_name").value = site.name || "";
    $("#s_role").value = site.role || "";
    $("#s_avail").value = site.availability || "";
    $("#s_location").value = site.location || "";
    $("#s_heroLine").value = site.heroLine || "";
    $("#s_marquee").value = (site.marquee || []).join(", ");
    $("#s_aboutTitle").value = site.aboutTitle || "";
    $("#s_about").value = (site.about || []).join("\n");
    $("#s_email").value = site.email || "";
    $("#s_phone").value = site.phone || "";
    $("#s_linkedin").value = site.linkedin || "";
    $("#s_github").value = site.github || "";
    $("#s_contactTitle").value = site.contactTitle || "";
    $("#s_contactLine").value = site.contactLine || "";
    $("#s_cvFile").value = site.cvFile || "";
    $("#s_footer").value = site.footer || "";

    var rows = $("#statRows");
    rows.innerHTML = "";
    (site.stats || []).forEach(function (s) { rows.appendChild(statRow(s)); });
  }

  $("#addStat").addEventListener("click", function () {
    $("#statRows").appendChild(statRow({ value: 0, suffix: "", label: "" }));
  });

  $("#saveSite").addEventListener("click", function () {
    var btn = this;
    btn.disabled = true;
    var stats = $$(".stat-row", $("#statRows")).map(function (r) {
      return {
        value: Number($("[data-s=value]", r).value) || 0,
        suffix: $("[data-s=suffix]", r).value,
        label: $("[data-s=label]", r).value
      };
    });
    api("/admin/site", {
      method: "PUT",
      body: JSON.stringify({
        name: $("#s_name").value,
        role: $("#s_role").value,
        availability: $("#s_avail").value,
        location: $("#s_location").value,
        heroLine: $("#s_heroLine").value,
        marquee: commaList($("#s_marquee").value),
        aboutTitle: $("#s_aboutTitle").value,
        about: lineList($("#s_about").value),
        stats: stats,
        email: $("#s_email").value,
        phone: $("#s_phone").value,
        linkedin: $("#s_linkedin").value,
        github: $("#s_github").value,
        contactTitle: $("#s_contactTitle").value,
        contactLine: $("#s_contactLine").value,
        cvFile: $("#s_cvFile").value,
        footer: $("#s_footer").value
      })
    }).then(function (saved) {
      state.site = saved;
      flash("Site saved.");
    }).catch(function (err) {
      flash(err.message, true);
    }).finally(function () { btn.disabled = false; });
  });

  /* ── boot ────────────────────────────────────────────────────── */

  function boot() {
    return api("/admin/content").then(function (data) {
      state.projects = data.projects || [];
      state.experience = data.experience || [];
      state.skills = data.skills || [];
      state.site = data.site || {};

      renderCollection("projects");
      renderCollection("experience");
      renderCollection("skills");
      fillSite(state.site);

      var badge = $("#storeBadge");
      if (data.storage === "mongo") {
        badge.textContent = "MongoDB";
        badge.className = "store";
      } else {
        badge.textContent = "JSON file — not permanent";
        badge.className = "store warn";
        badge.title = "Set MONGODB_URI so your edits survive a restart.";
      }

      $("#gate").classList.add("hidden");
      $("#app").classList.remove("hidden");
    });
  }

  api("/auth/me").then(function (me) {
    if (me.user) return boot();
    $("#u").focus();
  }).catch(function () { /* show the sign-in form */ });

  // Unused by design: SITE_INPUTS documents the field set for future edits.
  void SITE_INPUTS;
})();
