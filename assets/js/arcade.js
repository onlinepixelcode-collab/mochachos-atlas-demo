/* Mochachos Atlas Road — "Flame Catcher", an original catch-the-food game over a live grill.
   Move the plate with the mouse, a finger, or ←/→. Catch food, grab chillies, dodge the dynamite. */
(function () {
  "use strict";
  var stage = document.querySelector("[data-game]");
  if (!stage) return;
  var cv = stage.querySelector("canvas.game"), g = cv.getContext("2d");
  var fireCv = stage.querySelector("canvas[data-fire]");
  var hud = { score: document.querySelector("[data-g-score]"), best: document.querySelector("[data-g-best]"), combo: document.querySelector("[data-g-combo]"), lives: document.querySelector("[data-g-lives]"), heat: document.querySelector("[data-g-heat]") };
  var startEl = stage.querySelector("[data-g-start]"), overEl = stage.querySelector("[data-g-over]"), pauseEl = stage.querySelector("[data-g-pause]");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var BEST_KEY = "mochachos-flame-catcher-best";
  var best = 0; try { best = parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) {}
  hud.best.textContent = best;

  var TYPES = [
    { e: "🍗", pts: 10, w: 30 }, { e: "🍔", pts: 15, w: 22 }, { e: "🌯", pts: 20, w: 16 }, { e: "🍟", pts: 5, w: 18 },
    { e: "🥤", pts: 5, w: 10 }, { e: "🌶", pts: 25, w: 7, chilli: true }, { e: "⭐", pts: 50, w: 2, star: true }, { e: "🧨", pts: 0, w: 14, bomb: true }
  ];
  var totalW = TYPES.reduce(function (s, t) { return s + t.w; }, 0);
  var W = 0, H = 0, dpr = 1;
  var S;  // game state

  function size() {
    var r = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (S) S.px = Math.min(Math.max(S.px, 50), W - 50);
  }
  new ResizeObserver(size).observe(stage);
  size();

  function reset() {
    S = { running: false, paused: false, over: false, score: 0, lives: 3, combo: 1, streak: 0, t: 0, items: [], parts: [], pops: [],
      px: W / 2, tx: W / 2, spawn: 0, speed: 1, chilliUntil: 0, shake: 0, keys: {} };
    paintHud();
  }
  function paintHud() {
    hud.score.textContent = S.score;
    hud.combo.textContent = "x" + S.combo;
    hud.lives.textContent = "🔥".repeat(Math.max(0, S.lives)) || "—";
    var heat = Math.min(1, 0.3 + (S.speed - 1) * 0.35 + (S.t < S.chilliUntil ? 0.25 : 0));
    hud.heat.style.transform = "scaleX(" + heat + ")";
    if (fireCv) fireCv.setAttribute("data-heat-live", heat.toFixed(2));
  }

  /* ---------- tiny sound effects (only when the site's fire sound is on) ---------- */
  var actx = null;
  function beep(f, dur, type, vol) {
    try { if (localStorage.getItem("mochachos-sound") !== "1") return; } catch (e) { return; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    actx = actx || new AC();
    var o = actx.createOscillator(), gn = actx.createGain();
    o.type = type || "triangle"; o.frequency.value = f;
    gn.gain.setValueAtTime(vol || 0.12, actx.currentTime); gn.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
    o.connect(gn); gn.connect(actx.destination); o.start(); o.stop(actx.currentTime + dur);
  }

  /* ---------- input ---------- */
  function pointer(e) { var r = stage.getBoundingClientRect(); S.tx = Math.min(Math.max(e.clientX - r.left, 40), W - 40); }
  stage.addEventListener("pointermove", pointer);
  stage.addEventListener("pointerdown", function (e) { pointer(e); if (e.pointerType !== "mouse") e.preventDefault(); });
  window.addEventListener("keydown", function (e) {
    if (!S.running) return;
    if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].indexOf(e.key) > -1) { S.keys[e.key.toLowerCase().replace("arrow", "")] = true; e.preventDefault(); }
    if (e.key === "p" || e.key === "P" || e.key === "Escape") togglePause();
  });
  window.addEventListener("keyup", function (e) { S.keys[e.key.toLowerCase().replace("arrow", "")] = false; });
  document.addEventListener("visibilitychange", function () { if (document.hidden && S.running && !S.paused) togglePause(); });
  function togglePause() { if (!S.running || S.over) return; S.paused = !S.paused; pauseEl.hidden = !S.paused; if (!S.paused) last = performance.now(); }

  /* ---------- game flow ---------- */
  stage.querySelectorAll("[data-g-play]").forEach(function (b) { b.addEventListener("click", start); });
  pauseEl.querySelector("button").addEventListener("click", togglePause);
  function start() {
    reset();
    startEl.hidden = true; overEl.hidden = true; pauseEl.hidden = true;
    S.running = true; last = performance.now();
    stage.focus({ preventScroll: true });
  }
  function end() {
    S.running = false; S.over = true;
    var isBest = S.score > best;
    if (isBest) { best = S.score; try { localStorage.setItem(BEST_KEY, best); } catch (e) {} hud.best.textContent = best; }
    var ranks = [[0, "Lemon & Herb Rookie", "1/4 Chicken"], [250, "Mild Amigo", "1/4 Chicken, Beeg Chips & Buddy"], [600, "Hot Shot", "Nacho Crunch Gourmet Burger"], [1200, "Extra Hot Hero", "1/2 Chicken, Beeg Chips & Buddy"], [2200, "Dynamite Legend", "Family Fiesta"]];
    var rank = ranks.filter(function (r) { return S.score >= r[0]; }).pop();
    overEl.querySelector("[data-g-final]").textContent = S.score;
    overEl.querySelector("[data-g-rank]").textContent = rank[1];
    overEl.querySelector("[data-g-newbest]").hidden = !isBest;
    var refuel = overEl.querySelector("[data-g-refuel]");
    var M = window.MochachosMenu, U = window.MochachosMenuUtil;
    var f = M && U ? U.find(M, rank[2]) : null;
    if (f) {
      refuel.hidden = false;
      refuel.innerHTML = (f.entry.img ? '<img src="assets/img/' + f.entry.img + '" alt="">' : "") + '<div><small>Refuel with the real thing</small><b>' + f.name + "</b><span>" + U.money(f.price) + '</span></div><button class="btn btn-fire btn-sm" data-g-add><span>Add to tray</span></button>';
      refuel.querySelector("[data-g-add]").addEventListener("click", function (e) { window.MochachosTray && window.MochachosTray.add(f.name, f.price); e.currentTarget.innerHTML = "<span>Added ✓</span>"; });
    } else refuel.hidden = true;
    overEl.hidden = false;
    var live = stage.querySelector("[data-g-live]"); if (live) live.textContent = "Game over. You scored " + S.score + ". Rank: " + rank[1] + ".";
    beep(220, 0.5, "sawtooth", 0.1);
    if (fireCv) fireCv.setAttribute("data-heat-live", "0.35");
  }

  function spawn() {
    var r = Math.random() * totalW, t = TYPES[0];
    for (var i = 0, acc = 0; i < TYPES.length; i++) { acc += TYPES[i].w; if (r <= acc) { t = TYPES[i]; break; } }
    // fewer bombs in the first 10 seconds
    if (t.bomb && S.t < 10 && Math.random() < 0.6) t = TYPES[0];
    var size = W < 600 ? 34 : 42;
    S.items.push({ t: t, x: 30 + Math.random() * (W - 60), y: -40, vy: (110 + Math.random() * 60) * S.speed, rot: (Math.random() - 0.5) * 0.6, vr: (Math.random() - 0.5) * 2, s: size });
  }
  function burst(x, y, colors, n, power) {
    for (var i = 0; i < n; i++) { var a = Math.random() * Math.PI * 2, v = (60 + Math.random() * 220) * (power || 1); S.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: 0, max: 0.6 + Math.random() * 0.5, c: colors[i % colors.length], r: 2 + Math.random() * 3 }); }
  }
  function pop(x, y, text, color) { S.pops.push({ x: x, y: y, text: text, c: color || "#ffd84a", life: 0 }); }

  /* ---------- loop ---------- */
  var last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (S.running && !S.paused) update(dt);
    draw(now);
  }
  function update(dt) {
    S.t += dt;
    S.speed = 1 + Math.min(1.6, S.t / 45);
    var chilli = S.t < S.chilliUntil;
    // move plate
    var kb = (S.keys.right || S.keys.d ? 1 : 0) - (S.keys.left || S.keys.a ? 1 : 0);
    if (kb) S.tx = Math.min(Math.max(S.tx + kb * 620 * dt, 40), W - 40);
    S.px += (S.tx - S.px) * Math.min(1, dt * 16);
    // spawn
    S.spawn -= dt;
    if (S.spawn <= 0) { spawn(); S.spawn = Math.max(0.28, 0.95 - S.t / 70) * (0.7 + Math.random() * 0.6); }
    var plateY = H - 46, plateW = W < 600 ? 92 : 120;
    for (var i = S.items.length - 1; i >= 0; i--) {
      var it = S.items[i];
      it.y += it.vy * dt; it.rot += it.vr * dt;
      var caught = it.y > plateY - 22 && it.y < plateY + 12 && Math.abs(it.x - S.px) < plateW / 2 + 10;
      if (caught) {
        S.items.splice(i, 1);
        if (it.t.bomb) {
          S.lives--; S.combo = 1; S.streak = 0; S.shake = reduce ? 0 : 0.4;
          burst(it.x, plateY - 10, ["#ff3d00", "#ffd84a", "#fff", "#444"], 40, 1.6); pop(it.x, plateY - 40, "BOOM!", "#ff3d00");
          beep(90, 0.4, "square", 0.15);
          if (S.lives <= 0) { paintHud(); end(); return; }
        } else {
          S.streak++;
          S.combo = Math.min(5, 1 + Math.floor(S.streak / 5));
          var mult = S.combo * (chilli ? 2 : 1);
          var pts = it.t.pts * mult;
          S.score += pts;
          if (it.t.chilli) { S.chilliUntil = S.t + 6; pop(it.x, plateY - 50, "CHILLI x2!", "#ff5a1f"); beep(880, 0.15, "square", 0.1); }
          else if (it.t.star) { pop(it.x, plateY - 50, "+" + pts + " GOLDEN!", "#ffd84a"); beep(1320, 0.25, "triangle", 0.12); }
          else { pop(it.x, plateY - 40, "+" + pts); beep(520 + S.combo * 90, 0.08); }
          burst(it.x, plateY - 14, it.t.chilli ? ["#ff3d00", "#ff8a00"] : ["#ffd84a", "#ff8a00", "#fff"], it.t.star ? 30 : 12);
        }
        paintHud();
      } else if (it.y > H + 40) {
        S.items.splice(i, 1);
        if (!it.t.bomb && S.streak) { S.streak = 0; S.combo = 1; paintHud(); }
      }
    }
    for (var j = S.parts.length - 1; j >= 0; j--) { var p = S.parts[j]; p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; if (p.life > p.max) S.parts.splice(j, 1); }
    for (var k = S.pops.length - 1; k >= 0; k--) { S.pops[k].life += dt; S.pops[k].y -= 50 * dt; if (S.pops[k].life > 0.9) S.pops.splice(k, 1); }
    if (S.shake > 0) S.shake -= dt;
    if (Math.floor(S.t * 4) !== Math.floor((S.t - dt) * 4)) paintHud();
  }
  function draw(now) {
    g.clearRect(0, 0, W, H);
    g.save();
    if (S.shake > 0) g.translate((Math.random() - 0.5) * 14 * S.shake / 0.4, (Math.random() - 0.5) * 14 * S.shake / 0.4);
    // falling items
    g.textAlign = "center"; g.textBaseline = "middle";
    S.items.forEach(function (it) {
      g.save(); g.translate(it.x, it.y); g.rotate(it.rot);
      if (it.t.star || it.t.chilli) { g.shadowColor = it.t.star ? "#ffd84a" : "#ff3d00"; g.shadowBlur = 24; }
      if (it.t.bomb) { var fl = 0.5 + 0.5 * Math.sin(now / 60); g.fillStyle = "rgba(255," + Math.round(150 + fl * 100) + ",0," + (0.5 + fl * 0.5) + ")"; g.beginPath(); g.arc(it.s * 0.32, -it.s * 0.42, 4 + fl * 3, 0, 7); g.fill(); }
      g.font = it.s + "px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
      g.fillText(it.t.e, 0, 0);
      g.restore();
    });
    // plate
    var plateY = H - 46, plateW = W < 600 ? 92 : 120, chilli = S.t < S.chilliUntil;
    g.save(); g.translate(S.px, plateY);
    if (chilli) { g.shadowColor = "#ff3d00"; g.shadowBlur = 30; }
    g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(0, 18, plateW / 2, 8, 0, 0, 7); g.fill();
    g.fillStyle = "#d8262e"; g.beginPath(); g.ellipse(0, 4, plateW / 2 + 6, 15, 0, 0, 7); g.fill();
    g.fillStyle = "#fbf6ec"; g.beginPath(); g.ellipse(0, 0, plateW / 2, 12, 0, 0, 7); g.fill();
    g.fillStyle = "#f7c325"; g.beginPath(); g.ellipse(0, -1, plateW / 2 - 14, 6, 0, 0, 7); g.fill();
    g.restore();
    // particles + popups
    S.parts.forEach(function (p) { g.globalAlpha = Math.max(0, 1 - p.life / p.max); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); });
    g.globalAlpha = 1;
    S.pops.forEach(function (p) { g.globalAlpha = Math.max(0, 1 - p.life / 0.9); g.fillStyle = p.c; g.font = "400 " + (W < 600 ? 20 : 26) + "px Anton, Impact, sans-serif"; g.fillText(p.text, p.x, p.y); });
    g.globalAlpha = 1;
    if (chilli) { g.fillStyle = "rgba(255,60,0," + (0.08 + 0.05 * Math.sin(now / 120)) + ")"; g.fillRect(0, 0, W, H); }
    g.restore();
  }
  reset();
  requestAnimationFrame(frame);
  // test hook, only with ?debug in the URL
  if (/[?&]debug\b/.test(location.search)) window.__flameCatcher = { state: function () { return S; }, step: update, start: start };
})();
