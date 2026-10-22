/* Waiting room for the apps that are a single server on Render's free plan (the page and the API
   come from the same service, so there is no static site to open at once). The page loads from the
   portfolio, wakes the app, counts the seconds and opens the app the moment it answers.
   /open/<key> picks the app. */
(function () {
  "use strict";

  // The addresses the server checks are in src/routes/api.js (WAKE).
  var APPS = {
    triagedesk: {
      name: "TriageDesk",
      line: "AI that sorts support tickets and sends them to the right agent.",
      url: "https://triagedesk-r8pt.onrender.com/"
    },
    docmind: {
      name: "DocMind",
      line: "Ask questions of long PDFs and get answers that cite the page.",
      url: "https://docqa-3nqw.onrender.com/"
    }
  };

  var key = (location.pathname.split("/").filter(Boolean)[1] || "").toLowerCase();
  var app = APPS[key];
  var $ = function (id) { return document.getElementById(id); };

  if (!app) {
    $("name").textContent = "App not found";
    $("line").textContent = "This link does not point to one of the projects.";
    $("state").textContent = "Nothing to open";
    $("card").className = "card failed";
    $("direct").href = "/#work";
    $("direct").textContent = "See all projects";
    return;
  }

  document.title = "Opening " + app.name + " · Ahsaan Munir";
  $("name").textContent = app.name;
  $("line").textContent = app.line;
  $("direct").href = app.url;

  var started = Date.now();
  var ticker = setInterval(function () {
    $("secs").textContent = Math.round((Date.now() - started) / 1000) + "s";
  }, 1000);

  // The portfolio's server does the waiting (/api/wake/<key>) and answers when the app is up.
  // Checking from here would not work for every app: some send Cross-Origin-Resource-Policy,
  // and the browser then rejects the answer even when the server is running.
  function ask() {
    var ctl = "AbortController" in window ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, 125000) : null;
    return fetch("/api/wake/" + key, { cache: "no-store", signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json(); })
      .finally(function () { if (t) clearTimeout(t); });
  }

  function ready() {
    clearInterval(ticker);
    $("card").className = "card ready";
    $("state").textContent = "Ready, opening " + app.name;
    setTimeout(function () { location.replace(app.url); }, 400);
  }

  function failed() {
    clearInterval(ticker);
    $("card").className = "card failed";
    $("state").textContent = "The server is not answering yet";
    $("direct").textContent = "Try opening it directly";
  }

  var tries = 0;
  function wake() {
    tries += 1;
    ask().then(function (res) {
      if (res && res.ready) return ready();
      if (tries < 2) { $("state").textContent = "Taking longer than usual, still trying"; return wake(); }
      failed();
    }, function () {
      if (tries < 3) { $("state").textContent = "Still starting, trying again"; setTimeout(wake, 3000); return; }
      failed();
    });
  }
  wake();
})();
