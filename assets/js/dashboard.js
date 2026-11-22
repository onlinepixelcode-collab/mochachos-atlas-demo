/* Mochachos Atlas Road — staff dashboard ("The Pass").
   Order board: New → On the grill → Ready → Out for delivery → Done, with ticket timers that go
   green → amber → red, an "all day" count of what to cook, hold-to-complete with undo,
   curbside "I'm here" alerts, customer chat, an inbox, busy mode and a timed pause. */
(function () {
  "use strict";
  var O = window.MochachosOrders;
  var app = document.querySelector("[data-dash]");
  if (!O || !app) return;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var R = function (n) { return "R" + Number(n).toFixed(2); };
  var hhmm = function (t) { return new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(t)); };
  var ago = function (ms) { var s = Math.max(0, Math.floor(ms / 1000)), m = Math.floor(s / 60); return m >= 60 ? Math.floor(m / 60) + "h " + (m % 60) + "m" : m + ":" + String(s % 60).padStart(2, "0"); };
  var $ = function (s) { return app.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(app.querySelectorAll(s)); };
  var setAll = function (sel, txt) { $$(sel).forEach(function (e) { e.textContent = txt; }); };
  var mobile = matchMedia("(max-width: 900px)");

  var state = { orders: [], settings: {}, unread: 0, filter: "all", q: "", selected: null, seen: {}, sound: true, first: true, msgs: [], openChat: null, col: "new", firstPaint: true };
  try { state.sound = localStorage.getItem("mochachos-dash-sound") !== "0"; } catch (e) {}
  var COLS = [
    { key: "new", title: "New", sub: "Accept & start" },
    { key: "grill", title: "On the grill", sub: "Cooking now" },
    { key: "ready", title: "Ready", sub: "Waiting pickup / driver" },
    { key: "out", title: "Out for delivery", sub: "With the driver" }
  ];
  var NEXT = {
    pickup: { new: ["grill", MIcon("flame") + " Start grilling"], grill: ["ready", MIcon("check") + " Mark ready"], ready: ["done", "Collected"] },
    delivery: { new: ["grill", MIcon("flame") + " Start grilling"], grill: ["ready", MIcon("check") + " Packed"], ready: ["out", MIcon("scooter") + " Send out"], out: ["done", "Delivered"] }
  };
  var LABEL = { new: "New", grill: "On the grill", ready: "Ready", out: "Out for delivery", done: "Done", cancelled: "Cancelled" };

  /* ---------- login ---------- */
  var login = document.querySelector("[data-login]");
  var pinOut = login.querySelector("[data-pin-out]"), pin = "";
  O.mode().then(function (m) {
    login.querySelector("[data-login-mode]").innerHTML = m === "demo"
      ? "Demo mode: no database connected, so orders stay in this browser. PIN <b>" + O.DEMO_PIN + "</b>."
      : "Live mode: enter the staff PIN.";
  });
  function tryLogin() {
    O.login(pin).then(function () { login.hidden = true; app.hidden = false; start(); }).catch(function (e) {
      pinOut.classList.add("shake"); login.querySelector("[data-login-err]").textContent = e.message;
      setTimeout(function () { pinOut.classList.remove("shake"); }, 500); pin = ""; paintPin();
    });
  }
  function paintPin() { pinOut.textContent = pin.replace(/./g, "●") || "Enter PIN"; }
  login.addEventListener("click", function (e) {
    var k = e.target.closest("[data-k]"); if (!k) return;
    var v = k.getAttribute("data-k");
    if (v === "del") pin = pin.slice(0, -1); else if (v === "ok") return tryLogin(); else if (pin.length < 8) pin += v;
    paintPin();
  });
  document.addEventListener("keydown", function (e) {
    if (login.hidden) return;
    if (/^\d$/.test(e.key) && pin.length < 8) { pin += e.key; paintPin(); }
    if (e.key === "Backspace") { pin = pin.slice(0, -1); paintPin(); }
    if (e.key === "Enter") tryLogin();
  });
  try { if (sessionStorage.getItem("mochachos-staff-pin")) { pin = sessionStorage.getItem("mochachos-staff-pin"); tryLogin(); } } catch (e) {}

  /* ---------- sound ---------- */
  var actx = null;
  function chime() {
    if (!state.sound) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext; actx = actx || new AC(); actx.resume();
      [659, 880, 1175].forEach(function (f, i) {
        var o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * 0.14;
        o.type = "triangle"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 0.55);
      });
    } catch (e) {}
  }

  /* ---------- data ---------- */
  function load() {
    return O.list().then(function (r) {
      var fresh = [];
      r.orders.forEach(function (o) {
        if (!state.first && !state.seen[o.id]) fresh.push(o);
        if (!state.first && state.seen[o.id] && !state.seen[o.id].arrived && o.arrived) { chime(); toast(o.customer.name + " is here for " + o.id, o.id); }
        if (!state.first && state.seen[o.id] && o.messages.length > state.seen[o.id].msgs && o.messages[o.messages.length - 1].from === "customer") { chime(); toast("New message on " + o.id, o.id); }
        state.seen[o.id] = { arrived: !!o.arrived, msgs: o.messages.length };
      });
      var sig = JSON.stringify([r.orders, r.settings, r.unread]);
      state.orders = r.orders; state.settings = r.settings || {}; state.unread = r.unread || 0;
      if (sig === state.sig && !fresh.length) { tick(); return; }
      state.sig = sig;
      if (fresh.length) { chime(); fresh.forEach(function (o) { toast("New " + o.type + " order " + o.id + " · " + R(o.total), o.id); }); }
      state.first = false;
      render();
    }).catch(function (e) { if (e.code === 401) { sessionStorage.removeItem("mochachos-staff-pin"); location.reload(); } });
  }
  function start() {
    O.mode().then(function (m) { $("[data-mode]").textContent = m === "live" ? "LIVE" : "DEMO"; $("[data-mode]").classList.toggle("demo", m === "demo"); $("[data-simulate]").hidden = m !== "demo"; $("[data-clear]").hidden = m !== "demo"; });
    load();
    O.onChange(load);
    setInterval(function () { if (!document.hidden) load(); }, 4000);
    setInterval(tick, 1000);
  }

  /* ---------- timers ---------- */
  function limits(o) {
    var s = state.settings, prep = (s.prepMins || 15) + (s.busyMins || 0);
    return { new: [2, 5], grill: [prep, prep + 5], ready: o.type === "pickup" ? [10, 20] : [5, 10], out: [s.deliveryMins || 25, (s.deliveryMins || 25) + 10] }[o.status] || [999, 999];
  }
  function since(o) { var h = o.history.filter(function (x) { return x.s === o.status; }).pop(); return h ? h.t : o.createdAt; }
  function heat(o) {
    if (o.when !== "asap" && o.status === "new") { var lead = (o.etaAt - Date.now()) / 60000; return lead > 30 ? "sched" : "ok"; }
    var m = (Date.now() - since(o)) / 60000, l = limits(o);
    return m >= l[1] ? "late" : m >= l[0] ? "warn" : "ok";
  }
  function tick() {
    $("[data-clock]").textContent = new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date());
    app.querySelectorAll("[data-timer]").forEach(function (el) {
      var o = byId(el.getAttribute("data-timer")); if (!o) return;
      el.textContent = ago(Date.now() - since(o));
      var card = el.closest(".tk"); var h = heat(o);
      card.classList.remove("ok", "warn", "late", "sched"); card.classList.add(h);
    });
    var s = state.settings, now = Date.now();
    var paused = s.pausedUntil && now < s.pausedUntil;
    $("[data-pause-state]").textContent = paused ? "Paused · " + Math.ceil((s.pausedUntil - now) / 60000) + "m" : "Taking orders";
    $("[data-pause-btn]").classList.toggle("is-on", !!paused);
    $("[data-busy-state]").textContent = s.busyMins ? "+" + s.busyMins + " min" : "Normal";
    $("[data-busy-btn]").classList.toggle("is-on", !!s.busyMins);
  }
  function byId(id) { return state.orders.filter(function (o) { return o.id === id; })[0]; }

  /* ---------- render ---------- */
  function today(o) { return hhmm(o.createdAt) && new Date(o.createdAt).toDateString() === new Date().toDateString(); }
  function visible(o) {
    if (state.filter !== "all" && o.type !== state.filter) return false;
    if (state.q) { var q = state.q.toLowerCase(); return (o.id + " " + o.customer.name + " " + o.customer.phone).toLowerCase().indexOf(q) > -1; }
    return true;
  }
  function ticket(o) {
    var nx = NEXT[o.type][o.status], h = heat(o);
    var unread = o.unreadStaff || 0;
    var final = nx && nx[0] === "done";
    var isNew = !state.rendered[o.id]; state.rendered[o.id] = true;
    return '<article class="tk ' + h + (isNew && !state.firstPaint ? " is-new" : "") + (state.selected === o.id ? " is-sel" : "") + (o.arrived && o.status !== "done" ? " is-here" : "") + '" data-id="' + o.id + '" tabindex="0">' +
      '<header><b class="tk-code">' + o.id + '</b><span class="tk-type ' + o.type + '">' + (o.type === "delivery" ? MIcon("scooter") + " Delivery" : MIcon("car") + " Pickup") + '</span><span class="tk-timer" data-timer="' + o.id + '">0:00</span></header>' +
      (o.arrived && o.status !== "done" ? '<div class="tkt-here">' + MIcon("car") + ' Customer is here' + (o.arrived.spot ? " · " + esc(o.arrived.spot) : "") + (o.arrived.car || o.car ? " · " + esc(o.arrived.car || o.car) : "") + "</div>" : "") +
      '<div class="tk-who"><b>' + esc(o.customer.name) + '</b><a href="tel:' + esc(o.customer.phone) + '">' + esc(o.customer.phone) + "</a></div>" +
      '<div class="tk-when">' + (o.when === "asap" ? "ASAP · placed " + hhmm(o.createdAt) + " · due " + hhmm(o.etaAt) : MIcon("clock") + " Scheduled for <b>" + hhmm(o.etaAt) + "</b>") + "</div>" +
      '<ul class="tkt-items">' + o.items.map(function (i) {
        var parts = i.name.split(" · ");
        return "<li><b>" + i.qty + "×</b> " + esc(parts[0]) + (parts[1] ? ' <i class="tk-flav">' + esc(parts[1]) + "</i>" : "") + "</li>";
      }).join("") + "</ul>" +
      (o.notes ? '<p class="tk-notes">' + MIcon("note") + ' ' + esc(o.notes) + "</p>" : "") +
      (o.type === "delivery" ? '<p class="tk-addr">' + MIcon("pin") + ' <a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(o.address) + '" target="_blank" rel="noopener">' + esc(o.address) + "</a></p>" : (o.car ? '<p class="tk-addr">' + MIcon("car") + ' ' + esc(o.car) + "</p>" : "")) +
      '<div class="tk-foot"><span class="tkt-total">' + R(o.total) + ' <small>' + (o.payment === "card" ? "card" : "cash") + "</small></span>" +
      '<button class="tk-icon" data-chat="' + o.id + '" aria-label="Messages for ' + o.id + '">' + MIcon("chat") + (unread ? "<i>" + unread + "</i>" : "") + "</button>" +
      '<button class="tk-icon" data-print="' + o.id + '" aria-label="Print ticket ' + o.id + '">' + MIcon("printer") + '</button>' +
      '<button class="tk-icon" data-cancel="' + o.id + '" aria-label="Cancel ' + o.id + '">' + MIcon("close") + '</button></div>' +
      (nx ? (final
        ? '<button class="tk-go hold" data-hold="' + o.id + '"><span class="fill"></span><span class="lbl">Hold to complete · ' + nx[1] + "</span></button>"
        : '<button class="tk-go" data-go="' + o.id + '" data-to="' + nx[0] + '">' + nx[1] + "</button>") : "") +
      "</article>";
  }
  function render() {
    if (state.holding) { state.pendingRender = true; return; }
    state.rendered = state.rendered || {};
    var list = state.orders.filter(visible);
    var active = list.filter(function (o) { return ["new", "grill", "ready", "out"].indexOf(o.status) > -1; });
    $("[data-board]").innerHTML = COLS.map(function (c) {
      var items = active.filter(function (o) { return o.status === c.key; }).sort(function (a, b) { return (a.when === "asap" ? a.createdAt : a.etaAt - 1800000) - (b.when === "asap" ? b.createdAt : b.etaAt - 1800000); });
      if (c.key === "out" && state.filter === "pickup") return "";
      return '<section class="col col-' + c.key + '"><header><h2>' + c.title + " <span>" + items.length + "</span></h2><p>" + c.sub + "</p></header>" +
        '<div class="col-list">' + (items.length ? items.map(ticket).join("") : '<p class="col-empty">' + (c.key === "new" ? "No new orders. The grill is ready." : "Nothing here") + "</p>") + "</div></section>";
    }).join("") + '<section class="col col-done"><header><h2>Done today</h2><p>Collected, delivered or cancelled</p></header><ul class="done-list col-list" data-done-m></ul></section>';
    // all-day counts (everything still to cook)
    var counts = {};
    active.filter(function (o) { return o.status === "new" || o.status === "grill"; }).forEach(function (o) {
      o.items.forEach(function (i) { var k = i.name.split(" · ")[0]; counts[k] = (counts[k] || 0) + i.qty; });
    });
    var keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
    $("[data-allday]").innerHTML = keys.length ? keys.map(function (k) { return "<li><b>" + counts[k] + "</b>" + esc(k) + "</li>"; }).join("") : '<li class="muted">Nothing to cook right now.</li>';
    // completed today
    var done = state.orders.filter(function (o) { return (o.status === "done" || o.status === "cancelled") && today(o) && visible(o); });
    $("[data-done-count]").textContent = done.length;
    var doneHtml = done.length ? done.map(function (o) {
      var end = o.history[o.history.length - 1].t;
      return '<li class="' + o.status + '"><b>' + o.id + "</b><span>" + esc(o.customer.name) + " · " + (o.type === "delivery" ? MIcon("scooter") : MIcon("car")) + "</span><span>" + hhmm(o.createdAt) + " → " + hhmm(end) + " (" + Math.round((end - o.createdAt) / 60000) + " min)</span><em>" + (o.status === "cancelled" ? "Cancelled" : R(o.total)) + '</em><button data-recall="' + o.id + '" title="Bring back">↩</button></li>';
    }).join("") : '<li class="muted">No completed orders yet today.</li>';
    $("[data-done]").innerHTML = doneHtml;
    var dm = $("[data-done-m]"); if (dm) dm.innerHTML = doneHtml;
    // stats
    var todays = state.orders.filter(today), completed = todays.filter(function (o) { return o.status === "done"; });
    var avg = completed.length ? Math.round(completed.reduce(function (s, o) { return s + (o.history[o.history.length - 1].t - o.createdAt); }, 0) / completed.length / 60000) : 0;
    setAll("[data-stat-active]", state.orders.filter(function (o) { return ["new", "grill", "ready", "out"].indexOf(o.status) > -1; }).length);
    setAll("[data-stat-today]", todays.filter(function (o) { return o.status !== "cancelled"; }).length);
    setAll("[data-stat-rev]", R(todays.filter(function (o) { return o.status !== "cancelled"; }).reduce(function (s, o) { return s + o.total; }, 0)));
    setAll("[data-stat-avg]", avg ? avg + " min" : "—");
    var orderUnread = state.orders.reduce(function (s, o) { return s + (o.unreadStaff || 0); }, 0);
    $$("[data-msg-badge]").forEach(function (badge) { badge.textContent = orderUnread + state.unread; badge.hidden = !(orderUnread + state.unread); });
    // mobile: status tabs with live counts + the "all day" strip
    var counts2 = { new: 0, grill: 0, ready: 0, out: 0, done: done.length };
    active.forEach(function (o) { counts2[o.status]++; });
    $$("[data-col-tabs] [data-col]").forEach(function (b) {
      var k = b.getAttribute("data-col");
      b.querySelector("b").textContent = counts2[k];
      b.setAttribute("aria-pressed", String(k === state.col));
      b.hidden = k === "out" && state.filter === "pickup";
      b.classList.toggle("has-late", k !== "done" && active.some(function (o) { return o.status === k && heat(o) === "late"; }));
    });
    $("[data-board]").setAttribute("data-active", state.col);
    $("[data-board]").classList.toggle("col-enter", !!state.colAnim); state.colAnim = false;
    state.firstPaint = false;
    $("[data-allday-strip]").innerHTML = keys.length ? '<span class="strip-label">' + MIcon("flame") + ' All day</span>' + keys.map(function (k) { return "<span><b>" + counts[k] + "</b> " + esc(k) + "</span>"; }).join("") : "";
    var newCount = active.filter(function (o) { return o.status === "new"; }).length;
    document.title = (newCount ? "(" + newCount + ") " : "") + "The Pass · Mochachos Atlas Road";
    tick();
    if (state.openChat) paintChat();
  }

  /* ---------- actions ---------- */
  var undoTimer = null;
  function move(id, to) {
    var o = byId(id); if (!o) return;
    var from = o.status;
    return O.staff(id, { status: to }).then(function () {
      showUndo(id, LABEL[from], LABEL[to]);
      return load();
    });
  }
  function showUndo(id, from, to) {
    var u = $("[data-undo]");
    u.hidden = false;
    u.querySelector("span").textContent = id + ": " + from + " → " + to;
    u.querySelector("button").onclick = function () { O.staff(id, { undo: true }).then(load); u.hidden = true; };
    clearTimeout(undoTimer); undoTimer = setTimeout(function () { u.hidden = true; }, 8000);
  }
  function toast(text, id) {
    var t = document.createElement("button");
    t.className = "dash-toast"; t.textContent = text;
    t.addEventListener("click", function () { var el = app.querySelector('.tk[data-id="' + id + '"]'); if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); select(id); } t.remove(); });
    $("[data-toasts]").appendChild(t);
    setTimeout(function () { t.classList.add("out"); }, 6000);
    setTimeout(function () { t.remove(); }, 6600);
  }
  function burst(el) {
    var r = el.getBoundingClientRect();
    for (var i = 0; i < 26; i++) {
      var s = document.createElement("span"); s.className = "burst"; s.innerHTML = MIcon(["flame", "star", "chilli"][i % 3]);
      var a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 160;
      s.style.left = r.left + r.width / 2 + "px"; s.style.top = r.top + r.height / 2 + "px";
      s.style.setProperty("--dx", Math.cos(a) * d + "px"); s.style.setProperty("--dy", Math.sin(a) * d - 40 + "px"); s.style.setProperty("--rot", Math.random() * 600 - 300 + "deg");
      document.body.appendChild(s); setTimeout(function (x) { x.remove(); }, 1100, s);
    }
  }
  function select(id) { state.selected = id; app.querySelectorAll(".tk").forEach(function (t) { t.classList.toggle("is-sel", t.getAttribute("data-id") === id); }); }

  app.addEventListener("click", function (e) {
    var t;
    if ((t = e.target.closest("[data-go]"))) { move(t.getAttribute("data-go"), t.getAttribute("data-to")); return; }
    if ((t = e.target.closest("[data-chat]"))) { openChat(t.getAttribute("data-chat")); return; }
    if ((t = e.target.closest("[data-print]"))) { printTicket(byId(t.getAttribute("data-print"))); return; }
    if ((t = e.target.closest("[data-cancel]"))) { var id = t.getAttribute("data-cancel"); if (confirm("Cancel order " + id + "? You can bring it back from Completed.")) move(id, "cancelled"); return; }
    if ((t = e.target.closest("[data-recall]"))) { O.staff(t.getAttribute("data-recall"), { undo: true }).then(load); return; }
    if ((t = e.target.closest(".tk"))) select(t.getAttribute("data-id"));
    if ((t = e.target.closest("[data-filter]"))) { state.filter = t.getAttribute("data-filter"); app.querySelectorAll("[data-filter]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === t)); }); render(); }
  });
  // hold-to-complete: press and hold ~0.9s, the button fills with fire, then the ticket bursts
  var holding = null;
  app.addEventListener("pointerdown", function (e) {
    var b = e.target.closest("[data-hold]"); if (!b) return;
    e.preventDefault();
    b.classList.add("holding"); state.holding = true;
    holding = setTimeout(function () {
      b.classList.remove("holding"); b.classList.add("done");
      var card = b.closest(".tk"); burst(card); card.classList.add("vanish");
      setTimeout(function () { state.holding = false; move(b.getAttribute("data-hold"), "done"); }, 380);
      holding = null;
    }, 900);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) {
    app.addEventListener(ev, function () {
      if (holding) { clearTimeout(holding); holding = null; state.holding = false; if (state.pendingRender) { state.pendingRender = false; setTimeout(render, 50); } }
      app.querySelectorAll(".holding").forEach(function (x) { x.classList.remove("holding"); });
    }, true);
  });
  // keyboard "bump bar": arrows select, Enter/Space advances, U undoes
  document.addEventListener("keydown", function (e) {
    if (app.hidden || /input|textarea|select/i.test(document.activeElement.tagName)) return;
    var cards = Array.prototype.slice.call(app.querySelectorAll(".tk"));
    if (!cards.length) return;
    var i = cards.findIndex(function (c) { return c.getAttribute("data-id") === state.selected; });
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); select(cards[Math.min(cards.length - 1, i + 1)].getAttribute("data-id")); }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); select(cards[Math.max(0, i - 1)].getAttribute("data-id")); }
    if ((e.key === "Enter" || e.key === " ") && state.selected) {
      e.preventDefault();
      var o = byId(state.selected), nx = o && NEXT[o.type][o.status];
      if (nx) { if (nx[0] === "done") { var card = app.querySelector('.tk[data-id="' + o.id + '"]'); if (card) burst(card); } move(o.id, nx[0]); }
    }
    if (e.key === "u" || e.key === "U") { var u = $("[data-undo] button"); if (!$("[data-undo]").hidden) u.click(); }
  });
  $("[data-search]").addEventListener("input", function (e) { state.q = e.target.value; render(); });

  /* ---------- mobile: status tabs, swipe between columns, tools sheet ---------- */
  var ORDER = ["new", "grill", "ready", "out", "done"];
  function showCol(k) {
    state.col = k; state.colAnim = true; render();
    var tab = app.querySelector('[data-col-tabs] [data-col="' + k + '"]');
    if (tab) tab.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    if (mobile.matches) window.scrollTo({ top: Math.min(window.scrollY, app.querySelector("[data-col-tabs]").offsetTop - 60), behavior: "smooth" });
  }
  $("[data-col-tabs]").addEventListener("click", function (e) { var b = e.target.closest("[data-col]"); if (b) showCol(b.getAttribute("data-col")); });
  var tx = null, ty = null;
  $("[data-board]").addEventListener("touchstart", function (e) { if (e.target.closest("[data-hold]")) return; tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  $("[data-board]").addEventListener("touchend", function (e) {
    if (tx === null || !mobile.matches) return;
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
    if (Math.abs(dx) < 70 || Math.abs(dy) > 60) return;
    var list = ORDER.filter(function (k) { return !(k === "out" && state.filter === "pickup"); });
    var i = list.indexOf(state.col) + (dx < 0 ? 1 : -1);
    if (i >= 0 && i < list.length) showCol(list[i]);
  }, { passive: true });
  var moreBtn = $("[data-more]");
  function sheet(open) { app.classList.toggle("tools-open", open); moreBtn.setAttribute("aria-expanded", String(open)); }
  moreBtn.addEventListener("click", function (e) { e.stopPropagation(); sheet(!app.classList.contains("tools-open")); });
  $("[data-more-close]").addEventListener("click", function () { sheet(false); });
  $("[data-tools]").addEventListener("click", function (e) { if (e.target.closest("[data-sound-btn],[data-simulate],[data-clear],[data-full]")) setTimeout(function () { sheet(false); }, 150); });
  document.addEventListener("click", function (e) { if (app.classList.contains("tools-open") && !e.target.closest("[data-tools],[data-more],[data-pop]")) sheet(false); });
  // a new order pulls the phone view to the New tab
  var prevNew = 0;
  setInterval(function () { var n = state.orders.filter(function (o) { return o.status === "new"; }).length; if (mobile.matches && n > prevNew && state.col !== "new") showCol("new"); prevNew = n; }, 1500);

  /* ---------- toolbar: sound, busy, pause, settings, demo ---------- */
  var soundBtn = $("[data-sound-btn]");
  function paintSound() { soundBtn.innerHTML = state.sound ? MIcon("bell") + " Sound on" : MIcon("belloff") + " Sound off"; soundBtn.classList.toggle("is-on", state.sound); }
  soundBtn.addEventListener("click", function () { state.sound = !state.sound; try { localStorage.setItem("mochachos-dash-sound", state.sound ? "1" : "0"); } catch (e) {} paintSound(); if (state.sound) chime(); });
  paintSound();
  function menuFor(btn, html, onPick) {
    var m = $("[data-pop]");
    m.innerHTML = html; m.hidden = false;
    var r = btn.getBoundingClientRect(), ar = app.getBoundingClientRect();
    if (mobile.matches) { m.style.left = ""; m.style.top = ""; app.classList.remove("tools-open"); }
    else { m.style.left = Math.min(r.left - ar.left, ar.width - 260) + "px"; m.style.top = r.bottom - ar.top + 8 + "px"; }
    m.onclick = function (e) { var b = e.target.closest("[data-v]"); if (b) { onPick(b.getAttribute("data-v")); m.hidden = true; } };
  }
  document.addEventListener("click", function (e) { var m = $("[data-pop]"); if (m && !m.hidden && !m.contains(e.target) && !e.target.closest("[data-busy-btn],[data-pause-btn],[data-settings-btn]")) m.hidden = true; });
  $("[data-busy-btn]").addEventListener("click", function (e) {
    menuFor(e.currentTarget, '<p class="pop-title">Busy mode</p><p class="pop-sub">Adds minutes to every quoted time for the next hour.</p>' + [0, 5, 10, 15, 20, 30].map(function (m) { return '<button data-v="' + m + '">' + (m ? "+" + m + " min" : "Normal") + "</button>"; }).join(""), function (v) { O.saveSettings({ busyMins: +v }).then(load); });
  });
  $("[data-pause-btn]").addEventListener("click", function (e) {
    menuFor(e.currentTarget, '<p class="pop-title">Pause online orders</p><p class="pop-sub">Resumes automatically.</p>' + [["0", "Resume now"], ["15", "15 minutes"], ["30", "30 minutes"], ["60", "1 hour"], ["600", "Until close"]].map(function (x) { return '<button data-v="' + x[0] + '">' + x[1] + "</button>"; }).join(""), function (v) { O.saveSettings({ pauseMins: +v }).then(load); });
  });
  $("[data-settings-btn]").addEventListener("click", function (e) {
    var s = state.settings;
    menuFor(e.currentTarget, '<p class="pop-title">Kitchen settings</p><label>Prep time (min)<input type="number" min="5" max="90" value="' + (s.prepMins || 15) + '" data-set="prepMins"></label><label>Delivery time (min)<input type="number" min="5" max="120" value="' + (s.deliveryMins || 25) + '" data-set="deliveryMins"></label><label>Delivery fee (R, blank = confirm by phone)<input type="number" min="0" step="1" value="' + (typeof s.deliveryFee === "number" ? s.deliveryFee : "") + '" data-set="deliveryFee"></label><button data-v="save" class="pop-save">Save</button>', function () {
      var b = {}; $("[data-pop]").querySelectorAll("[data-set]").forEach(function (i) { b[i.getAttribute("data-set")] = i.value === "" ? null : +i.value; });
      O.saveSettings(b).then(load);
    });
  });
  $("[data-simulate]").addEventListener("click", function () {
    var M = window.MochachosMenu, U = window.MochachosMenuUtil; if (!M || !U) return;
    var names = ["Thandi M", "Yusuf A", "Lerato K", "Pieter V", "Aisha D", "Sipho N", "Fatima R", "Johan B"];
    var picks = [["1/2 Chicken, Beeg Chips & Buddy"], ["Burrito", "Chicken"], ["Nacho Crunch Gourmet Burger"], ["Family Fiesta"], ["4 Full BBQ Wings & Beeg Chips"], ["Chicken Schwarma"], ["Loaded Chips", "Beeg"], ["1/4 Chicken"], ["Milkshake 350ml"]];
    var items = [], n = 1 + Math.floor(Math.random() * 3);
    for (var i = 0; i < n; i++) { var p = picks[Math.floor(Math.random() * picks.length)], f = U.find(M, p[0], p[1]); if (f) items.push({ name: f.name + (/Chicken$|^1\/[24] Chicken/.test(f.name) ? " · " + ["Mild", "Hot", "Extra Hot", "Lemon & Herb"][i % 4] : ""), qty: 1 + Math.floor(Math.random() * 2), price: f.price }); }
    var del = Math.random() < 0.4;
    O.create({ type: del ? "delivery" : "pickup", when: "asap", customer: { name: names[Math.floor(Math.random() * names.length)], phone: "08" + Math.floor(10000000 + Math.random() * 89999999) }, address: del ? "12 Campo St, Beyers Park" : "", car: del ? "" : ["Silver Polo", "White Hilux", "Red Kia Picanto"][Math.floor(Math.random() * 3)], notes: Math.random() < 0.3 ? "Extra peri-mayo please" : "", payment: Math.random() < 0.5 ? "card" : "cash", items: items }).then(load).catch(function (e) { toast("Problem: " + e.message); });
  });
  $("[data-clear]").addEventListener("click", function () { if (confirm("Clear all demo orders and messages?")) O.clearDemo().then(function () { state.seen = {}; load(); }); });
  $("[data-full]").addEventListener("click", function () { if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); else document.exitFullscreen(); });
  $("[data-logout]").addEventListener("click", function () { sessionStorage.removeItem("mochachos-staff-pin"); location.reload(); });

  /* ---------- messages drawer ---------- */
  var drawer = $("[data-drawer]");
  $$("[data-msg-btn]").forEach(function (b) { b.addEventListener("click", function () { drawer.hidden = false; state.openChat = null; paintInbox(); }); });
  drawer.querySelector("[data-drawer-close]").addEventListener("click", function () { drawer.hidden = true; state.openChat = null; });
  function openChat(id) { drawer.hidden = false; state.openChat = id; O.staff(id, { read: true }).then(load); paintChat(); }
  function paintInbox() {
    O.messages().then(function (r) {
      state.msgs = r.messages || [];
      var chats = state.orders.filter(function (o) { return o.messages.length; }).sort(function (a, b) { return (b.unreadStaff || 0) - (a.unreadStaff || 0) || b.messages[b.messages.length - 1].t - a.messages[a.messages.length - 1].t; });
      drawer.querySelector("[data-drawer-body]").innerHTML =
        "<h3>Order chats</h3>" + (chats.length ? chats.map(function (o) { var m = o.messages[o.messages.length - 1]; return '<button class="inbox-row' + (o.unreadStaff ? " unread" : "") + '" data-open-chat="' + o.id + '"><b>' + o.id + " · " + esc(o.customer.name) + "</b><span>" + esc(m.text) + "</span><small>" + hhmm(m.t) + "</small></button>"; }).join("") : '<p class="muted">No order chats yet.</p>') +
        "<h3>Messages from the website</h3>" + (state.msgs.length ? state.msgs.map(function (m) { return '<div class="inbox-row' + (m.read ? "" : " unread") + '"><b>' + esc(m.name) + (m.phone ? ' · <a href="tel:' + esc(m.phone) + '">' + esc(m.phone) + "</a>" : "") + "</b><span>" + esc(m.text) + "</span><small>" + hhmm(m.t) + " · " + new Date(m.t).toLocaleDateString("en-ZA") + "</small>" + (m.read ? "" : '<button data-read="' + m.id + '">Mark read</button>') + "</div>"; }).join("") : '<p class="muted">No messages yet.</p>');
    });
  }
  drawer.addEventListener("click", function (e) {
    var t;
    if ((t = e.target.closest("[data-open-chat]"))) openChat(t.getAttribute("data-open-chat"));
    if ((t = e.target.closest("[data-read]"))) O.readMessage(t.getAttribute("data-read")).then(function () { paintInbox(); load(); });
    if (e.target.closest("[data-back]")) { state.openChat = null; paintInbox(); }
  });
  function paintChat() {
    var o = byId(state.openChat); if (!o) return;
    var body = drawer.querySelector("[data-drawer-body]");
    var keep = body.querySelector("textarea") ? body.querySelector("textarea").value : "";
    body.innerHTML = '<button class="link-btn" data-back>← All messages</button><h3>' + o.id + " · " + esc(o.customer.name) + ' <a href="tel:' + esc(o.customer.phone) + '" aria-label="Call">' + MIcon("phone") + '</a></h3>' +
      '<div class="chat-thread">' + (o.messages.length ? o.messages.map(function (m) { return '<div class="tk-msg ' + m.from + '"><p>' + esc(m.text) + "</p><small>" + (m.from === "store" ? "You" : esc(o.customer.name)) + " · " + hhmm(m.t) + "</small></div>"; }).join("") : '<p class="muted">No messages yet. Send the customer an update.</p>') + "</div>" +
      '<div class="quick-replies">' + ["Your order is on the grill.", "Ready! See you soon.", "Driver is on the way.", "Running 5 minutes late, sorry!"].map(function (q) { return '<button data-quick="' + esc(q) + '">' + esc(q) + "</button>"; }).join("") + "</div>" +
      '<form data-reply><textarea name="text" rows="2" placeholder="Reply to ' + esc(o.customer.name) + '…" required>' + esc(keep) + '</textarea><button class="btn btn-fire btn-sm"><span>Send</span></button></form>';
    var th = body.querySelector(".chat-thread"); th.scrollTop = th.scrollHeight;
    body.querySelector("[data-reply]").addEventListener("submit", function (e) { e.preventDefault(); var v = e.currentTarget.text.value.trim(); if (!v) return; e.currentTarget.text.value = ""; O.staff(o.id, { message: v, read: true }).then(load); });
    body.querySelectorAll("[data-quick]").forEach(function (b) { b.addEventListener("click", function () { O.staff(o.id, { message: b.getAttribute("data-quick"), read: true }).then(load); }); });
  }

  /* ---------- print ---------- */
  function printTicket(o) {
    if (!o) return;
    var w = window.open("", "_blank", "width=380,height=600");
    if (!w) return;
    w.document.write('<html><head><title>' + o.id + '</title><style>body{font:14px/1.4 monospace;padding:12px;width:300px}h1{font-size:22px;margin:0}hr{border:0;border-top:1px dashed #000}li{margin:4px 0}ul{padding-left:0;list-style:none}</style></head><body>' +
      "<h1>" + o.id + "</h1><p><b>" + (o.type === "delivery" ? "DELIVERY" : "PICKUP") + "</b> · " + (o.when === "asap" ? "ASAP" : "FOR " + hhmm(o.etaAt)) + "<br>Placed " + hhmm(o.createdAt) + "</p><hr>" +
      "<ul>" + o.items.map(function (i) { return "<li><b>" + i.qty + "x</b> " + esc(i.name) + "</li>"; }).join("") + "</ul>" +
      (o.notes ? "<hr><p>NOTE: " + esc(o.notes) + "</p>" : "") + "<hr><p>" + esc(o.customer.name) + "<br>" + esc(o.customer.phone) + (o.address ? "<br>" + esc(o.address) : "") + "</p><p><b>Total " + R(o.total) + "</b> (" + o.payment + ")</p><script>print()<\/script></body></html>");
    w.document.close();
  }
})();
