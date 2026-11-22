/* Mochachos Atlas Road — site-wide fire effects.
   - Heat dial (top bar): Lemon & Herb → Dynamite, saved for the whole site; drives every flame.
   - Dynamite mode (level 5): flames along the bottom of the screen, embers, heat haze, red glow.
   - Fire sound: a crackle made live with Web Audio (off by default).
   - Burning page transitions between pages. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NAMES = ["Lemon & Herb", "Mild", "Hot", "Extra Hot", "Dynamite"];
  var KEY = "mochachos-heat", SKEY = "mochachos-sound";
  var get = function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
  var put = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var level = Math.min(5, Math.max(1, parseInt(get(KEY, "2"), 10) || 2));
  var root = document.documentElement;

  /* ---------- screen-edge fire (shown from Extra Hot up) ---------- */
  var edge = document.createElement("div");
  edge.className = "edge-fire";
  edge.setAttribute("aria-hidden", "true");
  edge.innerHTML = '<canvas class="fire-layer" data-fire data-fire-min="4" data-res="0.3" data-smoke="0.3"></canvas><canvas class="ember-layer" data-embers data-fire-min="4"></canvas>';
  document.body.appendChild(edge);
  var glow = document.createElement("div");
  glow.className = "dynamite-glow"; glow.setAttribute("aria-hidden", "true");
  document.body.appendChild(glow);
  if (window.MochachosFire) window.MochachosFire.scan();

  /* ---------- heat haze filter (SVG), used by the hero food and Dynamite headings ---------- */
  if (!document.getElementById("haze")) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "0"); svg.setAttribute("height", "0"); svg.setAttribute("aria-hidden", "true");
    svg.style.position = "absolute";
    svg.innerHTML = '<filter id="haze" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.010 0.045" numOctaves="2" seed="4" result="n">' +
      (reduce ? "" : '<animate attributeName="baseFrequency" dur="5s" values="0.010 0.045;0.014 0.07;0.010 0.045" repeatCount="indefinite"/>') +
      '</feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/></filter>';
    document.body.appendChild(svg);
  }

  /* ---------- heat dial ---------- */
  var host = document.querySelector(".topbar-right");
  var dial = document.createElement("div");
  dial.className = "heat-dial";
  dial.innerHTML = '<button class="heat-btn" aria-expanded="false" aria-haspopup="true"><span class="heat-chillies" aria-hidden="true"></span><span class="heat-name"></span><span class="sr-only"> heat level, change</span></button>' +
    '<div class="heat-pop" hidden><p class="heat-title">Turn up the heat</p><p class="heat-sub">Sets the flames across the whole site.</p>' +
    '<div class="heat-levels" role="radiogroup" aria-label="Heat level">' +
    NAMES.map(function (n, i) { return '<button role="radio" data-level="' + (i + 1) + '"><span>' + "🌶".repeat(i + 1) + "</span>" + n + "</button>"; }).join("") +
    '</div><label class="toggle heat-sound"><input type="checkbox" data-sound><span></span> Fire sound</label></div>';
  if (host) host.insertBefore(dial, host.firstChild);
  var btn = dial.querySelector(".heat-btn"), pop = dial.querySelector(".heat-pop");
  btn.addEventListener("click", function (e) { e.stopPropagation(); var o = pop.hidden; pop.hidden = !o; btn.setAttribute("aria-expanded", String(o)); });
  document.addEventListener("click", function (e) { if (!dial.contains(e.target)) { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); } });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !pop.hidden) { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); btn.focus(); } });
  dial.querySelector(".heat-levels").addEventListener("click", function (e) { var b = e.target.closest("[data-level]"); if (b) { set(+b.getAttribute("data-level")); pop.hidden = true; btn.setAttribute("aria-expanded", "false"); } });

  var toastShown = false;
  function paint() {
    root.setAttribute("data-heat", level);
    dial.querySelector(".heat-chillies").textContent = "🌶".repeat(level);
    dial.querySelector(".heat-name").textContent = NAMES[level - 1];
    dial.querySelectorAll("[data-level]").forEach(function (b) { b.setAttribute("aria-checked", String(+b.getAttribute("data-level") === level)); });
  }
  function set(l, quiet) {
    var prev = level;
    level = Math.min(5, Math.max(1, l));
    put(KEY, level);
    paint();
    window.dispatchEvent(new CustomEvent("heat", { detail: level }));
    if (level === 5 && prev !== 5 && !quiet && !toastShown) { toastShown = true; toast("🔥 Dynamite mode! The whole site is on fire. Turn the heat down any time from the 🌶 dial."); }
    sound.level(level);
  }
  window.MochachosHeat = { set: set, get: function () { return level; } };

  function toast(msg) {
    var t = document.createElement("div");
    t.className = "fx-toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add("out"); }, 3800);
    setTimeout(function () { t.remove(); }, 4400);
  }

  /* ---------- fire sound (Web Audio, generated live) ---------- */
  var sound = (function () {
    var ctx = null, master = null, rumble = null, on = false, timer = null, lvl = level;
    function start() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      if (!ctx) {
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
        var len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0), last = 0;
        for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
        var src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 600;
        rumble = ctx.createGain(); rumble.gain.value = 0.5;
        src.connect(lp); lp.connect(rumble); rumble.connect(master); src.start();
      }
      ctx.resume();
      on = true;
      master.gain.setTargetAtTime(0.1 + lvl * 0.06, ctx.currentTime, 0.4);
      crackle();
      return true;
    }
    function crackle() {
      if (!on) return;
      var n = 1 + Math.floor(Math.random() * (lvl + 1));
      for (var k = 0; k < n; k++) pop(ctx.currentTime + Math.random() * 0.15);
      timer = setTimeout(crackle, 60 + Math.random() * (520 - lvl * 80));
    }
    function pop(t) {
      var len = 0.004 + Math.random() * 0.02;
      var b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
      var s = ctx.createBufferSource(); s.buffer = b;
      var hp = ctx.createBiquadFilter(); hp.type = "bandpass"; hp.frequency.value = 1200 + Math.random() * 3500; hp.Q.value = 0.8;
      var g = ctx.createGain(); g.gain.value = 0.25 + Math.random() * 0.6;
      s.connect(hp); hp.connect(g); g.connect(master); s.start(t);
    }
    function stop() { on = false; clearTimeout(timer); if (master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.2); }
    return {
      toggle: function (v) { if (v) return start(); stop(); return true; },
      level: function (l) { lvl = l; if (on && master) master.gain.setTargetAtTime(0.1 + lvl * 0.06, ctx.currentTime, 0.4); },
      isOn: function () { return on; }
    };
  })();
  var sbox = dial.querySelector("[data-sound]");
  sbox.addEventListener("change", function () {
    var ok = sound.toggle(sbox.checked);
    if (!ok) { sbox.checked = false; sbox.disabled = true; }
    put(SKEY, sbox.checked ? "1" : "0");
  });
  // browsers only allow sound after a tap, so a saved "on" resumes on the first interaction
  if (get(SKEY, "0") === "1") {
    sbox.checked = true;
    var resume = function () { sound.toggle(true); document.removeEventListener("pointerdown", resume); document.removeEventListener("keydown", resume); };
    document.addEventListener("pointerdown", resume); document.addEventListener("keydown", resume);
  }
  document.addEventListener("visibilitychange", function () { if (document.hidden && sound.isOn()) { sound.toggle(false); sbox.dataset.paused = "1"; } else if (!document.hidden && sbox.dataset.paused) { delete sbox.dataset.paused; if (sbox.checked) sound.toggle(true); } });

  paint();
  window.dispatchEvent(new CustomEvent("heat", { detail: level }));

  /* ---------- burning page transitions ---------- */
  var burn = document.createElement("div");
  burn.className = "burn"; burn.setAttribute("aria-hidden", "true");
  burn.innerHTML = '<div class="burn-wall"></div>';
  document.body.appendChild(burn);
  var arrived = false;
  try { arrived = sessionStorage.getItem("mochachos-burn") === "1"; sessionStorage.removeItem("mochachos-burn"); } catch (e) {}
  if (arrived && !reduce) {
    burn.classList.add("cover");
    // timers (not animation frames) so the page always uncovers, even if the tab is in the background
    setTimeout(function () { burn.classList.remove("cover"); burn.classList.add("reveal"); }, 40);
    setTimeout(function () { burn.className = "burn"; }, 1250);
  }
  window.addEventListener("pageshow", function (e) { if (e.persisted) burn.className = "burn"; });
  document.addEventListener("click", function (e) {
    if (reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.search === location.search) return; // same page (hash links)
    e.preventDefault();
    try { sessionStorage.setItem("mochachos-burn", "1"); } catch (err) {}
    burn.classList.add("ignite");
    setTimeout(function () { location.href = url.href; }, 520);
  });
})();
