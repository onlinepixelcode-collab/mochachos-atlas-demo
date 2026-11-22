/* Mochachos Atlas Road — order client used by checkout, tracking and the staff dashboard.
   Live mode: talks to /api/* (Vercel + Upstash Redis).
   Demo mode (no backend connected): orders live in this browser's storage and sync between
   tabs instantly, so the customer side and the dashboard can be shown side by side. */
(function () {
  "use strict";
  var DEMO_PIN = "1234";
  var OK = "mochachos-demo-orders", MK = "mochachos-demo-msgs", SK = "mochachos-demo-settings";
  var DEFAULTS = { prepMins: 15, deliveryMins: 25, busyMins: 0, busyUntil: 0, pausedUntil: 0, deliveryFee: null };
  var FLOW = { pickup: ["new", "grill", "ready", "done"], delivery: ["new", "grill", "ready", "out", "done"] };
  var chan = "BroadcastChannel" in window ? new BroadcastChannel("mochachos-orders") : null;
  var listeners = [];
  var modeP = null;

  function mode() {
    if (!modeP) modeP = fetch("api/health", { cache: "no-store" }).then(function (r) { return r.ok ? "live" : "demo"; }).catch(function () { return "demo"; });
    return modeP;
  }

  /* ---------- demo store ---------- */
  var read = function (k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  var write = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} ping(); };
  function ping() { if (chan) chan.postMessage("changed"); listeners.forEach(function (f) { f(); }); }
  if (chan) chan.onmessage = function () { listeners.forEach(function (f) { f(); }); };
  window.addEventListener("storage", function (e) { if ([OK, MK, SK].indexOf(e.key) > -1) listeners.forEach(function (f) { f(); }); });

  function settingsDemo() {
    var s = Object.assign({}, DEFAULTS, read(SK, {}));
    if (s.busyUntil && Date.now() > s.busyUntil) { s.busyMins = 0; s.busyUntil = 0; }
    return s;
  }
  function priceLine(name) {
    var M = window.MochachosMenu; if (!M) return null;
    var parts = String(name).split(" · "), main = parts[0], flavour = parts[1];
    var m = main.match(/^(.*?)(?: \(([^()]*)\))?$/), base = m[1], opt = m[2] || "";
    for (var i = 0; i < M.categories.length; i++) for (var j = 0; j < M.categories[i].items.length; j++) {
      var it = M.categories[i].items[j];
      if (it.n !== base && it.n !== main) continue;
      var p = it.n === main ? it.p[0] : it.p.filter(function (x) { return x[0] === opt; })[0];
      if (!p) continue;
      var fl = flavour && (M.flavours.some(function (f) { return f.name === flavour; }) || (it.choices || []).indexOf(flavour) > -1) ? " · " + flavour : "";
      return { name: it.n + (p[0] ? " (" + p[0] + ")" : "") + fl, price: p[1] };
    }
    return null;
  }
  function openAt(t) {
    if (!window.MochachosHours) return true;
    var d = new Date(t);
    var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Johannesburg", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
    var map = {}; parts.forEach(function (p) { map[p.type] = p.value; });
    var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(map.weekday), mins = (parseInt(map.hour, 10) % 24) * 60 + parseInt(map.minute, 10);
    return window.MochachosHours.slots(day).some(function (s) { return mins >= s[0] && mins < s[1]; });
  }
  var fail = function (msg, code) { var e = new Error(msg); e.code = code; return Promise.reject(e); };

  var demo = {
    create: function (b) {
      var s = settingsDemo(), now = Date.now();
      if (s.pausedUntil && now < s.pausedUntil) return fail("We've paused online orders for a few minutes. Please call 010 448 0666.");
      var type = b.type === "delivery" ? "delivery" : "pickup";
      var phone = String(b.customer.phone || "").replace(/[^\d+]/g, "");
      if ((b.customer.name || "").trim().length < 2) return fail("Please add your name.");
      if (!/^(\+27|0)\d{9}$/.test(phone)) return fail("Please add a valid SA phone number.");
      if (type === "delivery" && (b.address || "").trim().length < 6) return fail("Please add your delivery address.");
      var items = (b.items || []).map(function (it) { var l = priceLine(it.name); return l && { name: l.name, price: l.price, qty: Math.min(30, Math.max(1, it.qty | 0)) }; }).filter(Boolean);
      if (!items.length) return fail("Your tray is empty.");
      var when = "asap", prep = s.prepMins + s.busyMins + (type === "delivery" ? s.deliveryMins : 0);
      if (b.when && b.when !== "asap") {
        var t = Date.parse(b.when);
        if (!t || t < now + 10 * 60000 || !openAt(t)) return fail("Please pick a time when we're open.");
        when = new Date(t).toISOString();
      } else if (!openAt(now)) return fail("We're closed right now. Schedule your order for when we're open.");
      var subtotal = Math.round(items.reduce(function (a, i) { return a + i.price * i.qty; }, 0) * 100) / 100;
      var fee = type === "delivery" && typeof s.deliveryFee === "number" ? s.deliveryFee : 0;
      var id = "MA-" + Math.floor(1000 + Math.random() * 9000) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
      var order = { id: id, token: Math.random().toString(36).slice(2, 14), createdAt: now, status: "new", history: [{ s: "new", t: now }],
        type: type, when: when, etaAt: when === "asap" ? now + prep * 60000 : Date.parse(when), customer: { name: b.customer.name.trim().slice(0, 60), phone: phone },
        address: type === "delivery" ? b.address.trim().slice(0, 200) : "", notes: (b.notes || "").trim().slice(0, 300), payment: b.payment === "card" ? "card" : "cash",
        car: (b.car || "").trim().slice(0, 60), items: items, subtotal: subtotal, deliveryFee: type === "delivery" ? s.deliveryFee : null, total: Math.round((subtotal + fee) * 100) / 100,
        arrived: null, messages: [], unreadStaff: 0, unreadCustomer: 0, demo: true };
      var all = read(OK, []); all.unshift(order); write(OK, all.slice(0, 300));
      return Promise.resolve({ id: id, token: order.token, etaAt: order.etaAt, order: order });
    },
    get: function (id, token) {
      var o = read(OK, []).filter(function (x) { return x.id === id; })[0];
      if (!o || (token && o.token !== token)) return fail("Order not found", 404);
      return Promise.resolve({ order: o });
    },
    customer: function (id, token, b) {
      var all = read(OK, []), o = all.filter(function (x) { return x.id === id; })[0];
      if (!o || o.token !== token) return fail("Order not found", 404);
      if (b.arrived) { o.arrived = { t: Date.now(), spot: (b.arrived.spot || "").slice(0, 40), car: (b.arrived.car || "").slice(0, 60) }; o.unreadStaff = (o.unreadStaff || 0) + 1; }
      if (b.message) { o.messages.push({ from: "customer", text: b.message.slice(0, 400), t: Date.now() }); o.unreadStaff = (o.unreadStaff || 0) + 1; }
      if (b.seen) o.unreadCustomer = 0;
      write(OK, all); return Promise.resolve({ order: o });
    },
    list: function () { return Promise.resolve({ orders: read(OK, []), settings: settingsDemo(), unread: read(MK, []).filter(function (m) { return !m.read; }).length }); },
    staff: function (id, b) {
      var all = read(OK, []), o = all.filter(function (x) { return x.id === id; })[0];
      if (!o) return fail("Order not found", 404);
      var now = Date.now();
      if (b.undo && o.history.length > 1) { o.history.pop(); o.status = o.history[o.history.length - 1].s; }
      else if (b.status && (b.status === "cancelled" || FLOW[o.type].indexOf(b.status) > -1)) { o.status = b.status; o.history.push({ s: b.status, t: now }); }
      if (b.message) { o.messages.push({ from: "store", text: b.message.slice(0, 400), t: now }); o.unreadCustomer = (o.unreadCustomer || 0) + 1; }
      if (b.read) o.unreadStaff = 0;
      write(OK, all); return Promise.resolve({ order: o });
    },
    messages: function () { return Promise.resolve({ messages: read(MK, []) }); },
    sendMessage: function (b) {
      if ((b.name || "").trim().length < 2 || (b.text || "").trim().length < 3) return fail("Please add your name and a message.");
      var list = read(MK, []); list.unshift({ id: "M" + Date.now().toString(36), name: b.name.trim().slice(0, 60), phone: (b.phone || "").replace(/[^\d+]/g, ""), text: b.text.trim().slice(0, 800), t: Date.now(), read: false });
      write(MK, list.slice(0, 300)); return Promise.resolve({ ok: true });
    },
    readMessage: function (id) { var list = read(MK, []); list.forEach(function (m) { if (m.id === id) m.read = true; }); write(MK, list); return Promise.resolve({ ok: true }); },
    settings: function () { return Promise.resolve({ settings: settingsDemo() }); },
    saveSettings: function (b) {
      var s = settingsDemo(), now = Date.now();
      if (b.prepMins !== undefined) s.prepMins = Math.min(90, Math.max(5, b.prepMins | 0));
      if (b.deliveryMins !== undefined) s.deliveryMins = Math.min(120, Math.max(5, b.deliveryMins | 0));
      if (b.busyMins !== undefined) { s.busyMins = Math.min(60, Math.max(0, b.busyMins | 0)); s.busyUntil = s.busyMins ? now + 3600000 : 0; }
      if (b.pauseMins !== undefined) s.pausedUntil = b.pauseMins ? now + (b.pauseMins | 0) * 60000 : 0;
      if (b.deliveryFee !== undefined) s.deliveryFee = b.deliveryFee === null || b.deliveryFee === "" ? null : Math.max(0, Number(b.deliveryFee) || 0);
      write(SK, s); return Promise.resolve({ settings: s });
    },
    clearAll: function () { write(OK, []); write(MK, []); return Promise.resolve(); }
  };

  /* ---------- live API ---------- */
  var pin = function () { try { return sessionStorage.getItem("mochachos-staff-pin") || ""; } catch (e) { return ""; } };
  function call(method, url, b, staff) {
    var h = { "Content-Type": "application/json" };
    if (staff) h["x-staff-pin"] = pin();
    return fetch(url, { method: method, headers: h, body: b ? JSON.stringify(b) : undefined, cache: "no-store" }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || "Something went wrong"); e.code = r.status; throw e; } return j; });
    });
  }
  var live = {
    create: function (b) { return call("POST", "api/orders", b); },
    get: function (id, token) { return call("GET", "api/order?id=" + encodeURIComponent(id) + (token ? "&token=" + encodeURIComponent(token) : ""), null, !token); },
    customer: function (id, token, b) { return b.seen ? live.get(id, token) : call("POST", "api/order?id=" + encodeURIComponent(id) + "&token=" + encodeURIComponent(token), b); },
    list: function () { return call("GET", "api/orders", null, true); },
    staff: function (id, b) { return call("PATCH", "api/order?id=" + encodeURIComponent(id), b, true); },
    messages: function () { return call("GET", "api/messages", null, true); },
    sendMessage: function (b) { return call("POST", "api/messages", b); },
    readMessage: function (id) { return call("PATCH", "api/messages?id=" + encodeURIComponent(id), { read: true }, true); },
    settings: function () { return call("GET", "api/settings"); },
    saveSettings: function (b) { return call("PUT", "api/settings", b, true); }
  };

  function api(name) { return function () { var a = arguments; return mode().then(function (m) { return (m === "live" ? live : demo)[name].apply(null, a); }); }; }
  window.MochachosOrders = {
    mode: mode, DEMO_PIN: DEMO_PIN, FLOW: FLOW,
    create: api("create"), get: api("get"), customer: api("customer"), list: api("list"), staff: api("staff"),
    messages: api("messages"), sendMessage: api("sendMessage"), readMessage: api("readMessage"),
    settings: api("settings"), saveSettings: api("saveSettings"),
    clearDemo: function () { return demo.clearAll(); },
    onChange: function (f) { listeners.push(f); },
    login: function (p) {
      return mode().then(function (m) {
        if (m === "demo") { if (p !== DEMO_PIN) throw new Error("Wrong PIN"); sessionStorage.setItem("mochachos-staff-pin", p); return m; }
        sessionStorage.setItem("mochachos-staff-pin", p);
        return live.list().then(function () { return m; }, function (e) { sessionStorage.removeItem("mochachos-staff-pin"); throw new Error(e.code === 401 ? "Wrong PIN" : e.message); });
      });
    },
    /* the customer's own orders on this device */
    mine: function () { try { return JSON.parse(localStorage.getItem("mochachos-my-orders")) || []; } catch (e) { return []; } },
    remember: function (o) {
      var list = window.MochachosOrders.mine().filter(function (x) { return x.id !== o.id; });
      list.unshift({ id: o.id, token: o.token, t: Date.now(), items: o.items, type: o.type, total: o.total });
      try { localStorage.setItem("mochachos-my-orders", JSON.stringify(list.slice(0, 10))); } catch (e) {}
    },
    priceLine: priceLine, openAt: openAt
  };
})();
