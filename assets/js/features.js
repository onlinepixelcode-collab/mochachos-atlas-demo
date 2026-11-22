/* Mochachos Atlas Road — flip-book menu, spin wheel, crew planner, printed menu lightbox,
   hero parallax and the heat bar. Menu data comes from menu.js (window.MochachosMenu). */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var R = function (n) { return "R" + n.toFixed(2); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  function whenMenu(cb) {
    if (window.MochachosMenu) cb(window.MochachosMenu);
    else document.addEventListener("menu:ready", function () { cb(window.MochachosMenu); }, { once: true });
  }
  function findItem(M, name, label) {
    for (var i = 0; i < M.categories.length; i++) {
      var c = M.categories[i];
      for (var j = 0; j < c.items.length; j++) {
        var it = c.items[j];
        if (it.n === name) {
          var p = label ? it.p.filter(function (x) { return x[0] === label; })[0] : it.p[0];
          if (p) return { name: it.n + (p[0] ? " (" + p[0] + ")" : ""), price: p[1], cat: c };
        }
      }
    }
    return null;
  }

  /* ---------- chilli burst ---------- */
  function burst(x, y, n) {
    if (reduce) return;
    var chars = ["🌶", "🔥", "✦"];
    for (var i = 0; i < (n || 18); i++) {
      var s = document.createElement("span");
      s.className = "burst";
      s.textContent = chars[i % chars.length];
      var a = Math.random() * Math.PI * 2, d = 80 + Math.random() * 140;
      s.style.left = x + "px"; s.style.top = y + "px";
      s.style.setProperty("--dx", Math.cos(a) * d + "px");
      s.style.setProperty("--dy", Math.sin(a) * d - 60 + "px");
      s.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg");
      document.body.appendChild(s);
      setTimeout(function (el) { el.remove(); }, 1100, s);
    }
  }

  /* ---------- flip book ---------- */
  whenMenu(function (M) {
    var el = document.querySelector("[data-book]");
    if (!el) return;
    var pages = [];
    var heat = ["🌶", "🌶🌶", "🌶🌶🌶", "🌶🌶🌶🌶", "🌶🌶🌶🌶🌶"];
    pages.push('<div class="page page-cover" data-density="hard"><div class="pg"><div class="cover-tiles"></div><img src="assets/img/logo-horizontal.png" alt="Mochachos"><p class="cover-kicker">Atlas Road · Beyers Park</p><h3 class="cover-title">Menu</h3><p class="cover-year">2026</p><p class="cover-hint">Drag the corner to open →</p></div></div>');
    pages.push('<div class="page page-intro"><div class="pg"><p class="pg-tag">Taste the fiesta</p><h4>Zee Flavours</h4><ul class="pg-flav">' +
      M.flavours.map(function (f, i) { return "<li><b>" + esc(f.name) + "</b><span>" + heat[i] + "</span></li>"; }).join("") +
      '</ul><h4>Portion sizes</h4><ul class="pg-sizes"><li><b>Beeg</b><span>regular</span></li><li><b>Beeger</b><span>large</span></li><li><b>Beegest</b><span>sharing</span></li></ul><p class="pg-note">100% halaal · Prices include VAT and may change.</p><span class="pg-num">1</span></div></div>');
    M.categories.forEach(function (c, ci) {
      var showDesc = c.items.length <= 6;
      var h = '<div class="page"><div class="pg">';
      if (!c.noImg) h += '<div class="pg-photo" style="background-image:url(assets/img/' + c.img + ')"></div>';
      h += '<p class="pg-tag">' + esc(c.tag) + "</p><h4>" + esc(c.name) + '</h4><ul class="pg-items' + (c.items.length > 10 ? " tight" : "") + '">';
      var last = -1;
      c.items.forEach(function (it) {
        if (c.groups && it.g !== last) { last = it.g; h += '<li class="pg-group">' + esc(c.groups[it.g]) + "</li>"; }
        h += '<li><div class="pg-row"><span class="pg-name">' + esc(it.n) + (it.v ? ' <i class="veg">V</i>' : "") + '</span><span class="pg-dots"></span><span class="pg-price">' +
          it.p.map(function (p) { return (p[0] ? "<small>" + esc(p[0]) + "</small> " : "") + R(p[1]); }).join(" · ") + "</span></div>" +
          (showDesc && it.d ? '<p class="pg-desc">' + esc(it.d) + "</p>" : "") + "</li>";
      });
      h += '</ul><span class="pg-num">' + (ci + 2) + "</span></div></div>";
      pages.push(h);
    });
    pages.push('<div class="page page-order"><div class="pg"><p class="pg-tag">Ready?</p><h4>Order your way</h4><ul class="pg-order"><li><b>Call for pick-up</b><span>010 448 0666</span></li><li><b>Dine in</b><span>254 Atlas Road, Beyers Park</span></li><li><b>Delivery</b><span>Uber Eats &amp; Mr D</span></li></ul><h4>Trading hours</h4><ul class="pg-order"><li><b>Mon–Thu &amp; Sun</b><span>10:00 – 20:00</span></li><li><b>Fri – Sat</b><span>10:00 – 21:00</span></li><li><b>Fridays</b><span>Closed 12:15 – 13:30</span></li></ul><span class="pg-num">' + (M.categories.length + 2) + "</span></div></div>");
    pages.push('<div class="page page-cover page-back" data-density="hard"><div class="pg"><div class="cover-tiles"></div><p class="cover-kicker">Fresh · Healthy · Flame grilled</p><h3 class="cover-title small">Taste the fiesta</h3><p class="cover-year">@mochachosatlas</p></div></div>');
    el.innerHTML = pages.join("");

    var count = document.querySelector("[data-book-count]");
    var total = pages.length;
    var label = function (i) { return i === 0 ? "Cover" : i >= total - 1 ? "Back cover" : "Page " + i + " of " + (total - 2); };

    if (!window.St || !window.St.PageFlip) {
      el.classList.add("book-fallback");
      return;
    }
    var flip = new window.St.PageFlip(el, {
      width: 460, height: 640, size: "stretch",
      minWidth: 260, maxWidth: 600, minHeight: 360, maxHeight: 840,
      showCover: true, usePortrait: true, mobileScrollSupport: false,
      maxShadowOpacity: 0.55, flippingTime: reduce ? 1 : 850, drawShadow: true
    });
    flip.loadFromHTML(el.querySelectorAll(".page"));
    requestAnimationFrame(function () { document.dispatchEvent(new CustomEvent("book:ready")); });
    /* page-turn sound: a paper swish plus a soft settle, made live with Web Audio */
    var actx = null, soundOn = true;
    try { soundOn = localStorage.getItem("mochachos-book-sound") !== "0"; } catch (x) {}
    function pageSound() {
      if (!soundOn) return;
      try {
        var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        actx = actx || new AC(); actx.resume();
        var now = actx.currentTime, dur = 0.42, sr = actx.sampleRate;
        var buf = actx.createBuffer(1, Math.floor(sr * dur), sr), d = buf.getChannelData(0);
        for (var i = 0; i < d.length; i++) { var t = i / d.length; d[i] = (Math.random() * 2 - 1) * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 1.6) * (0.6 + 0.4 * Math.sin(t * 40)); }
        var src = actx.createBufferSource(); src.buffer = buf;
        var bp = actx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.9;
        bp.frequency.setValueAtTime(5200, now); bp.frequency.exponentialRampToValueAtTime(900, now + dur);
        var hp = actx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 350;
        var g = actx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.5, now + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        src.connect(bp); bp.connect(hp); hp.connect(g); g.connect(actx.destination); src.start(now);
        // the page landing
        var o = actx.createOscillator(), og = actx.createGain(), t2 = now + dur - 0.06;
        o.type = "sine"; o.frequency.setValueAtTime(140, t2); o.frequency.exponentialRampToValueAtTime(60, t2 + 0.12);
        og.gain.setValueAtTime(0.0001, t2); og.gain.exponentialRampToValueAtTime(0.18, t2 + 0.01); og.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.14);
        o.connect(og); og.connect(actx.destination); o.start(t2); o.stop(t2 + 0.16);
      } catch (x) {}
    }
    var sb = document.querySelector("[data-book-sound]");
    if (sb) {
      var paintSb = function () { sb.textContent = soundOn ? "🔊" : "🔇"; sb.setAttribute("aria-label", soundOn ? "Mute page-turn sound" : "Turn on page-turn sound"); sb.setAttribute("aria-pressed", String(soundOn)); };
      sb.addEventListener("click", function () { soundOn = !soundOn; try { localStorage.setItem("mochachos-book-sound", soundOn ? "1" : "0"); } catch (x) {} paintSb(); if (soundOn) pageSound(); });
      paintSb();
    }
    flip.on("changeState", function (e) { if (e.data === "flipping") pageSound(); });
    flip.on("flip", function (e) { count.textContent = label(e.data); });
    document.querySelector("[data-book-prev]").addEventListener("click", function () { flip.flipPrev(); });
    document.querySelector("[data-book-next]").addEventListener("click", function () { flip.flipNext(); });
    el.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") flip.flipNext(); if (e.key === "ArrowLeft") flip.flipPrev(); });
    el.tabIndex = 0;
  });


  /* ---------- 3D store: order at the counter ---------- */
  whenMenu(function (M) {
    var panel = document.querySelector("[data-counter]");
    if (!panel) return;
    var catsEl = panel.querySelector("[data-counter-cats]"), listEl = panel.querySelector("[data-counter-items]");
    var U = window.MochachosMenuUtil, all = U.all(M), current = "pollo";
    catsEl.innerHTML = M.categories.map(function (c) { return '<button data-ccat="' + c.id + '">' + esc(c.name) + "</button>"; }).join("");
    function show(cat) {
      current = cat === "all" || !cat ? current : cat;
      catsEl.querySelectorAll("button").forEach(function (b) {
        var on = b.getAttribute("data-ccat") === current;
        b.setAttribute("aria-pressed", String(on));
        if (on) catsEl.scrollTo({ left: b.offsetLeft - 12, behavior: "smooth" });
      });
      listEl.innerHTML = all.filter(function (x) { return x.cat.id === current; }).map(function (x) {
        var img = U.thumb(x, "");
        return '<li><span class="counter-thumb">' + img + '</span><div class="counter-text"><b>' + esc(x.item.n) + "</b>" + (x.item.d ? "<small>" + esc(x.item.d) + "</small>" : "") +
          '<div class="counter-prices">' + x.item.p.map(function (p, j) {
            return '<button data-cadd="' + x.id + "|" + j + '">' + (p[0] ? "<small>" + esc(p[0]) + "</small> " : "") + R(p[1]) + " <i>+</i></button>";
          }).join("") + "</div></div></li>";
      }).join("");
      listEl.scrollTop = 0;
    }
    function open(cat) { panel.hidden = false; show(cat); document.querySelector(".store-stage").classList.add("ordering"); }
    function close() { panel.hidden = true; document.querySelector(".store-stage").classList.remove("ordering"); }
    window.addEventListener("counter:open", function (e) { open(e.detail && e.detail.cat); });
    document.addEventListener("click", function (e) { if (e.target.closest("[data-counter-open]")) open(current); });
    panel.querySelector("[data-counter-close]").addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) close(); });
    catsEl.addEventListener("click", function (e) { var b = e.target.closest("[data-ccat]"); if (b) show(b.getAttribute("data-ccat")); });
    listEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cadd]"); if (!b) return;
      var k = b.getAttribute("data-cadd").split("|"), x = all.filter(function (d) { return d.id === k[0]; })[0], p = x.item.p[+k[1]];
      window.MochachosTray.add(x.item.n + (p[0] ? " (" + p[0] + ")" : ""), p[1]);
      b.classList.add("is-done"); setTimeout(function () { b.classList.remove("is-done"); }, 900);
      var r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 8);
    });
    panel.querySelector("[data-counter-tray]").addEventListener("click", function () { window.MochachosTray.open(); });
  });

  /* ---------- printed menu lightbox ---------- */
  var lb = document.querySelector("[data-lightbox]");
  var opener = document.querySelector("[data-print-open]");
  if (lb && opener) {
    var close = function () { lb.hidden = true; document.documentElement.classList.remove("no-scroll"); opener.focus(); };
    opener.addEventListener("click", function () { lb.hidden = false; document.documentElement.classList.add("no-scroll"); lb.querySelector("[data-print-close]").focus(); });
    lb.querySelector("[data-print-close]").addEventListener("click", close);
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) close(); });
  }

  /* ---------- spin the wheel ---------- */
  whenMenu(function (M) {
    var cv = document.querySelector("[data-wheel]");
    if (!cv) return;
    var picks = [
      ["1/2 Chicken, Beeg Chips & Buddy"], ["Nacho Crunch Gourmet Burger"], ["Burrito", "Chicken"], ["Nachos", "Chicken"],
      ["Chicken Schwarma"], ["4 Full BBQ Wings"], ["Jalapeño Cheese Burger", "Single"], ["Quesadilla", "Chicken"],
      ["Chimichanga", "Chicken"], ["6 Chicken Strips, Chips & Dip"]
    ].map(function (p) { return findItem(M, p[0], p[1]); }).filter(Boolean);
    var short = function (n) { return n.replace(", Beeg Chips & Buddy", " combo").replace(" Gourmet Burger", " Burger").replace(" (Chicken)", "").replace(" (Single)", "").replace(", Chips & Dip", " & chips"); };
    var cols = ["#db342e", "#f5c000", "#00a7b5", "#24262a", "#2f78c4"];
    var ink = ["#fff", "#2e1c0d", "#fff", "#f5c000", "#fff"];
    var g = cv.getContext("2d"), N = picks.length, seg = (Math.PI * 2) / N, cx = 320, cy = 320, r = 306;
    g.clearRect(0, 0, 640, 640);
    for (var i = 0; i < N; i++) {
      g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r, i * seg, (i + 1) * seg); g.closePath();
      g.fillStyle = cols[i % 5]; g.fill();
      g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 4; g.stroke();
      g.save(); g.translate(cx, cy); g.rotate(i * seg + seg / 2);
      g.fillStyle = ink[i % 5]; g.textAlign = "right"; g.textBaseline = "middle";
      g.font = "400 26px Anton, Impact, sans-serif";
      var words = short(picks[i].name).toUpperCase();
      if (words.length > 13) {
        var mid = words.lastIndexOf(" ", 13); if (mid < 4) mid = words.indexOf(" ");
        g.fillText(words.slice(0, mid), r - 26, -16); g.fillText(words.slice(mid + 1), r - 26, 18);
      } else g.fillText(words, r - 26, 0);
      g.restore();
    }
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.lineWidth = 12; g.strokeStyle = "#2e1c0d"; g.stroke();
    for (var k = 0; k < N * 2; k++) { var a = (k / (N * 2)) * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2), 6, 0, 7); g.fillStyle = k % 2 ? "#fff" : "#f5c000"; g.fill(); }

    var btn = document.querySelector("[data-spin]"), out = document.querySelector("[data-wheel-result]");
    var rot = 0, spinning = false;
    btn.addEventListener("click", function () {
      if (spinning) return;
      spinning = true; btn.disabled = true; out.innerHTML = "";
      rot += 360 * (5 + Math.floor(Math.random() * 3)) + Math.random() * 360;
      cv.style.transition = reduce ? "none" : "transform 4.6s cubic-bezier(.12,.62,.08,1)";
      cv.style.transform = "rotate(" + rot + "deg)";
      var done = function () {
        spinning = false; btn.disabled = false;
        var pointer = ((270 - rot) % 360 + 360) % 360;
        var win = picks[Math.floor(pointer / (360 / N)) % N];
        out.innerHTML = '<p class="win-kicker">The fiesta says…</p><p class="win-name">' + esc(win.name) + '</p><p class="win-price">' + R(win.price) + '</p><button class="btn btn-fire btn-sm" data-win-add><span>Add to my tray</span></button>';
        out.querySelector("[data-win-add]").addEventListener("click", function (e) {
          window.MochachosTray && window.MochachosTray.add(win.name, win.price);
          e.currentTarget.innerHTML = "<span>Added ✓</span>";
          var b = e.currentTarget.getBoundingClientRect(); burst(b.left + b.width / 2, b.top, 14);
        });
        var w = cv.getBoundingClientRect(); burst(w.left + w.width / 2, w.top + w.height / 2, 22);
      };
      var fired = false;
      var once = function () { if (fired) return; fired = true; done(); };
      if (reduce) once(); else { cv.addEventListener("transitionend", once, { once: true }); setTimeout(once, 4800); }
    });
  });

  /* ---------- feed the crew ---------- */
  whenMenu(function (M) {
    var form = document.querySelector("[data-crew]");
    if (!form) return;
    var list = document.querySelector("[data-crew-list]"), totalEl = document.querySelector("[data-crew-total]"), ppEl = document.querySelector("[data-crew-pp]");
    var peopleOut = document.querySelector("[data-crew-people-out]");
    var I = {
      treat: findItem(M, "Family Treat"), fiesta: findItem(M, "Family Fiesta"), variety: findItem(M, "Family Variety"),
      half: findItem(M, "1/2 Chicken, Beeg Chips & Buddy"), quarter: findItem(M, "1/4 Chicken, Beeg Chips & Buddy"),
      burger: findItem(M, "Chicken Burger, Beeg Chips & Buddy"), chips: findItem(M, "Loaded Chips", "Beeger"),
      nachos: findItem(M, "Nachos", "Cheese"), buddy: findItem(M, "Buddy")
    };
    var order = [];
    function plan() {
      var fd = new FormData(form);
      var people = +fd.get("people"), appetite = +fd.get("appetite"), burgers = !!fd.get("burgers"), share = !!fd.get("share");
      peopleOut.textContent = people;
      var units = people * appetite, bag = {}, fed = 0, flip = false, withDrink = 0;
      var add = function (it, q) { if (!it) return; bag[it.name] = bag[it.name] || { it: it, q: 0 }; bag[it.name].q += q || 1; };
      while (units >= 8 && !burgers) { add(I.treat); units -= 8; fed += 8; }
      while (units >= 3.5) { add(burgers && !flip ? I.variety : I.fiesta); flip = !flip; units -= 4; fed += 4; }
      while (units >= 1.75) { add(I.half); units -= 2; withDrink++; }
      while (units >= 0.75) { add(burgers ? I.burger : I.quarter); units -= 1; withDrink++; }
      if (units > 0.2) add(I.chips);
      if (share) add(I.nachos, Math.max(1, Math.round(people / 5)));
      var drinks = Math.max(0, people - withDrink); if (drinks) add(I.buddy, drinks);
      order = Object.keys(bag).map(function (k) { return bag[k]; });
      var total = order.reduce(function (s, o) { return s + o.it.price * o.q; }, 0);
      list.innerHTML = order.map(function (o) { return "<li><span><b>" + o.q + "×</b> " + esc(o.it.name) + "</span><em>" + R(o.it.price * o.q) + "</em></li>"; }).join("");
      totalEl.textContent = R(total);
      ppEl.textContent = R(total / people);
    }
    form.addEventListener("input", plan);
    plan();
    document.querySelector("[data-crew-add]").addEventListener("click", function (e) {
      if (!window.MochachosTray) return;
      order.forEach(function (o) { window.MochachosTray.add(o.it.name, o.it.price, o.q); });
      var b = e.currentTarget.getBoundingClientRect(); burst(b.left + b.width / 2, b.top, 20);
      setTimeout(function () { window.MochachosTray.open(); }, 450);
    });
  });

  /* ---------- hero parallax + heat bar ---------- */
  var hero = document.querySelector("[data-hero]"), food = document.querySelector("[data-parallax]");
  if (hero && food && !reduce) {
    var mx = 0, my = 0, cx = 0, cy = 0, sy = 0;
    if (matchMedia("(pointer: fine)").matches) {
      hero.addEventListener("pointermove", function (e) {
        var b = hero.getBoundingClientRect();
        mx = (e.clientX - b.left) / b.width - 0.5; my = (e.clientY - b.top) / b.height - 0.5;
      });
      hero.addEventListener("pointerleave", function () { mx = my = 0; });
    }
    (function tick() {
      requestAnimationFrame(tick);
      sy = Math.min(window.scrollY, 900);
      cx += (mx - cx) * 0.06; cy += (my - cy) * 0.06;
      food.style.transform = "translate3d(" + cx * 26 + "px," + (cy * 18 + sy * 0.12) + "px,0) rotate(" + cx * 4 + "deg) scale(" + (1 - sy / 6000) + ")";
    })();
  }
  var header = document.querySelector(".site-header");
  if (header) {
    var bar = document.createElement("div"); bar.className = "heat-bar"; bar.setAttribute("aria-hidden", "true"); header.appendChild(bar);
    var onScroll = function () {
      var max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? scrollY / max : 0) + ")";
    };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }
})();
