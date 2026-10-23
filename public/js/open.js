/* Waiting room for the apps that are a single server on Render's free plan (the page and the API
   come from the same service, so there is no static site to open at once). The page loads from the
   portfolio's static site at once, wakes the app, counts the seconds and opens the app the moment
   it answers. /open/<key> picks the app. */
(function () {
  "use strict";

  var APPS = {
    triagedesk: {
      name: "TriageDesk",
      line: "AI that sorts support tickets and sends them to the right agent.",
      url: "https://triagedesk-r8pt.onrender.com/",
      probe: "https://triagedesk-r8pt.onrender.com/api/health",
      also: ["https://triagedesk-ml.onrender.com/health"]
    },
    docmind: {
      name: "DocMind",
      line: "Ask questions of long PDFs and get answers that cite the page.",
      url: "https://docqa-3nqw.onrender.com/",
      probe: "https://docqa-3nqw.onrender.com/",
      also: []
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

  // While a server starts, Render holds the request, so it ends only when the app is up.
  // The request ending is the signal, however it ends: TriageDesk sends
  // Cross-Origin-Resource-Policy: same-origin, so the browser rejects its answer even though
  // the server answered. Only our own time limit counts as "not up yet".
  function hit(url, ms) {
    var ctl = "AbortController" in window ? new AbortController() : null;
    var timedOut = false;
    var t = setTimeout(function () { timedOut = true; if (ctl) ctl.abort(); }, ms);
    return fetch(url, { mode: "no-cors", cache: "no-store", signal: ctl ? ctl.signal : undefined })
      .then(function () { return true; }, function () { return !timedOut; })
      .then(function (up) { clearTimeout(t); return up; });
  }

  app.also.forEach(function (u) { hit(u, 100000); });

  function ask() {
    return hit(app.probe, 100000).then(function (up) { return { ready: up }; });
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
      if (res.ready) return ready();
      if (tries < 2) { $("state").textContent = "Taking longer than usual, still trying"; return wake(); }
      failed();
    });
  }
  wake();
})();
