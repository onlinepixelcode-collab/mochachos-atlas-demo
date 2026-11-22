/* Mochachos Atlas Road — "Fiesta Express" checkout (checkout.html) and live tracker (track.html). */
(function () {
  "use strict";
  var O = window.MochachosOrders;
  if (!O) return;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var R = function (n) { return "R" + Number(n).toFixed(2); };
  var hhmm = function (t) { return new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(t)); };
  var dayName = function (t) { return new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", weekday: "long" }).format(new Date(t)); };
  function menuReady(cb) { if (window.MochachosMenu) cb(); else document.addEventListener("menu:ready", cb, { once: true }); }
  var DKEY = "mochachos-my-details";

  /* =================== CHECKOUT =================== */
  var co = document.querySelector("[data-checkout]");
  if (co) menuReady(function () {
    var T = window.MochachosTray;
    var form = co.querySelector("form");
    var listEl = co.querySelector("[data-co-items]");
    var errEl = co.querySelector("[data-co-error]");
    var banner = co.querySelector("[data-co-banner]");
    var settings = { prepMins: 15, deliveryMins: 25, busyMins: 0, deliveryFee: null, pausedUntil: 0 };
    var saved = {}; try { saved = JSON.parse(localStorage.getItem(DKEY)) || {}; } catch (e) {}
    ["name", "phone", "address", "car"].forEach(function (k) { if (saved[k] && form[k]) form[k].value = saved[k]; });
    if (saved.type) { var r = form.querySelector('input[name="type"][value="' + saved.type + '"]'); if (r) r.checked = true; }

    // quick re-order of the last order on this device
    var last = O.mine()[0];
    var again = co.querySelector("[data-co-again]");
    if (last && again) {
      again.hidden = false;
      again.querySelector("[data-co-again-text]").textContent = last.items.map(function (i) { return i.qty + "× " + i.name; }).join(", ");
      again.querySelector("button").addEventListener("click", function () { last.items.forEach(function (i) { T.add(i.name, i.price, i.qty); }); again.hidden = true; paint(); });
    }

    function slots() {
      // 15-minute slots in trading hours over the next ~30 hours (skips Friday prayers automatically)
      var out = [], now = Date.now(), start = Math.ceil((now + 25 * 60000) / (15 * 60000)) * 15 * 60000;
      for (var t = start; t < now + 30 * 3600000 && out.length < 60; t += 15 * 60000) if (O.openAt(t)) out.push(t);
      return out;
    }
    var sel = form.querySelector("[data-co-slot]");
    function fillSlots() {
      var list = slots(), lastDay = "";
      sel.innerHTML = list.map(function (t) {
        var d = dayName(t), grp = "";
        if (d !== lastDay) { grp = (lastDay ? "</optgroup>" : "") + '<optgroup label="' + d + '">'; lastDay = d; }
        return grp + '<option value="' + new Date(t).toISOString() + '">' + hhmm(t) + "</option>";
      }).join("") + (list.length ? "</optgroup>" : "");
    }
    fillSlots();

    function type() { return form.type.value; }
    function eta() { return settings.prepMins + (settings.busyMins || 0) + (type() === "delivery" ? settings.deliveryMins : 0); }
    function paint() {
      var items = T.items();
      co.classList.toggle("is-delivery", type() === "delivery");
      co.querySelectorAll("[data-co-eta]").forEach(function (e) { e.textContent = "~" + eta() + " min"; });
      co.querySelector("[data-eta-pickup]").textContent = "Ready in ~" + (settings.prepMins + (settings.busyMins || 0)) + " min";
      co.querySelector("[data-eta-delivery]").textContent = "At your door in ~" + (settings.prepMins + (settings.busyMins || 0) + settings.deliveryMins) + " min";
      var open = window.MochachosHours && window.MochachosHours.status().open;
      var asap = form.querySelector('input[name="when"][value="asap"]');
      asap.disabled = !open;
      if (!open && asap.checked) form.querySelector('input[name="when"][value="later"]').checked = true;
      co.querySelector("[data-co-asap-note]").textContent = open ? "~" + eta() + " min" : "Closed now";
      sel.disabled = form.when.value !== "later";
      var paused = settings.pausedUntil && Date.now() < settings.pausedUntil;
      banner.hidden = !paused && open;
      banner.innerHTML = paused ? "⏸ We've paused online orders for a few minutes while the grill catches up. Please call <a href=\"tel:+27104480666\">010 448 0666</a>." :
        "🌙 We're closed right now (" + esc(window.MochachosHours.status().long) + ") You can schedule your order for later.";
      if (!items.length) {
        listEl.innerHTML = '<li class="co-empty">Your tray is empty. <a href="dishes.html">Pick some dishes</a> or try a favourite:</li>';
        co.querySelector("[data-co-quick]").hidden = false;
      } else {
        co.querySelector("[data-co-quick]").hidden = true;
        listEl.innerHTML = items.map(function (t) {
          return '<li><div><b>' + esc(t.name) + "</b><span>" + R(t.price) + ' each</span></div><div class="qty"><button type="button" data-cq="' + esc(t.name) + '|-1" aria-label="One less">−</button><b>' + t.qty + '</b><button type="button" data-cq="' + esc(t.name) + '|1" aria-label="One more">+</button></div><em>' + R(t.price * t.qty) + "</em></li>";
        }).join("");
      }
      var sub = T.total(), del = type() === "delivery";
      co.querySelector("[data-co-sub]").textContent = R(sub);
      co.querySelector("[data-co-fee-row]").hidden = !del;
      co.querySelector("[data-co-fee]").textContent = typeof settings.deliveryFee === "number" ? R(settings.deliveryFee) : "Confirmed by the store";
      co.querySelector("[data-co-total]").textContent = R(sub + (del && typeof settings.deliveryFee === "number" ? settings.deliveryFee : 0));
      co.querySelector("[data-co-place]").disabled = !items.length || paused;
    }
    O.settings().then(function (r) { settings = Object.assign(settings, r.settings || {}); paint(); }).catch(paint);
    O.mode().then(function (m) { var d = co.querySelector("[data-co-demo]"); if (d) d.hidden = m !== "demo"; });
    form.addEventListener("change", paint);
    document.addEventListener("tray:change", paint);
    listEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cq]"); if (!b) return;
      var k = b.getAttribute("data-cq").split("|"), cur = T.items().filter(function (t) { return t.name === k[0]; })[0];
      if (cur) T.setQty(k[0], cur.qty + +k[1]);
    });
    co.querySelector("[data-co-quick]").addEventListener("click", function (e) {
      var b = e.target.closest("[data-quick-add]"); if (!b) return;
      var f = window.MochachosMenuUtil.find(window.MochachosMenu, b.getAttribute("data-quick-add"), b.getAttribute("data-opt"));
      if (f) T.add(f.name, f.price);
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errEl.hidden = true;
      var btn = co.querySelector("[data-co-place]");
      btn.disabled = true; btn.classList.add("is-loading"); btn.querySelector("span").textContent = "Sending to the grill…";
      var body = {
        type: type(), when: form.when.value === "later" ? sel.value : "asap",
        customer: { name: form.name.value, phone: form.phone.value },
        address: form.address.value, car: form.car.value, notes: form.notes.value,
        payment: form.payment.value, items: T.items()
      };
      if (form.remember.checked) { try { localStorage.setItem(DKEY, JSON.stringify({ name: body.customer.name, phone: body.customer.phone, address: body.address, car: body.car, type: body.type })); } catch (x) {} }
      O.create(body).then(function (r) {
        O.remember({ id: r.id, token: r.token, items: r.order.items, type: r.order.type, total: r.order.total });
        T.clear();
        location.href = "track.html?id=" + encodeURIComponent(r.id) + "&t=" + encodeURIComponent(r.token) + "&new=1";
      }).catch(function (x) {
        errEl.hidden = false; errEl.textContent = x.message || "Something went wrong. Please call 010 448 0666.";
        btn.disabled = false; btn.classList.remove("is-loading"); btn.querySelector("span").textContent = "Place order";
        errEl.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
    setInterval(paint, 60000);
    paint();
  });

  /* =================== TRACKER =================== */
  var tr = document.querySelector("[data-track]");
  if (tr) menuReady(function () {
    var q = new URLSearchParams(location.search);
    var id = q.get("id") || "", token = q.get("t") || "";
    if (!id) { var m = O.mine()[0]; if (m) { id = m.id; token = m.token; history.replaceState(null, "", "track.html?id=" + id + "&t=" + token); } }
    if (!id) { tr.innerHTML = '<div class="tk-missing"><h1>No order to track</h1><p>Place an order and you can follow it here, live.</p><a class="btn btn-fire" href="dishes.html"><span>Start an order</span></a></div>'; return; }
    var STEPS = {
      pickup: [["new", "Received", "We've got your order"], ["grill", "On the grill", "Flame-grilling now"], ["ready", "Ready", "Come and get it"], ["done", "Collected", "Enjoy, amigo!"]],
      delivery: [["new", "Received", "We've got your order"], ["grill", "On the grill", "Flame-grilling now"], ["ready", "Packed", "Bagged and hot"], ["out", "On the way", "Out for delivery"], ["done", "Delivered", "Enjoy, amigo!"]]
    };
    var lastStatus = null, order = null, ding = null;
    function tone(f) {
      try { var AC = window.AudioContext || window.webkitAudioContext; ding = ding || new AC(); var o = ding.createOscillator(), g = ding.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0.15, ding.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ding.currentTime + 0.5); o.connect(g); g.connect(ding.destination); o.start(); o.stop(ding.currentTime + 0.5); } catch (e) {}
    }
    function notify(text) {
      tone(880); setTimeout(function () { tone(1320); }, 180);
      if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
      if ("Notification" in window && Notification.permission === "granted" && document.hidden) new Notification("Mochachos Atlas Road", { body: text });
    }
    function render() {
      var o = order, steps = STEPS[o.type], idx = Math.max(0, steps.findIndex(function (s) { return s[0] === o.status; }));
      var cancelled = o.status === "cancelled";
      var remain = Math.round((o.etaAt - Date.now()) / 60000);
      var etaTxt = o.status === "done" ? "Done at " + hhmm(o.history[o.history.length - 1].t) :
        cancelled ? "This order was cancelled. Please call us." :
        o.when !== "asap" && o.status === "new" ? "Scheduled for " + dayName(o.etaAt) + " " + hhmm(o.etaAt) :
        o.status === "ready" && o.type === "pickup" ? "Ready now. Tap “I'm here” when you arrive." :
        remain > 1 ? "About " + remain + " min (" + hhmm(o.etaAt) + ")" : "Any minute now…";
      tr.querySelector("[data-tk-code]").textContent = o.id;
      tr.querySelector("[data-tk-type]").textContent = o.type === "delivery" ? "🛵 Delivery" : "🚗 Pickup";
      tr.querySelector("[data-tk-eta]").textContent = etaTxt;
      tr.querySelector("[data-tk-title]").textContent = cancelled ? "Cancelled" : steps[idx][2];
      tr.classList.toggle("is-cancelled", cancelled);
      tr.style.setProperty("--progress", cancelled ? 0 : idx / (steps.length - 1));
      tr.querySelector("[data-tk-steps]").innerHTML = steps.map(function (s, i) {
        var h = o.history.filter(function (x) { return x.s === s[0]; }).pop();
        return '<li class="' + (i < idx ? "done" : i === idx ? "now" : "") + '"><span class="tk-dot">' + (i < idx ? "✓" : i === idx && s[0] === "grill" ? "🔥" : i + 1) + "</span><b>" + s[1] + "</b><small>" + (h ? hhmm(h.t) : "") + "</small></li>";
      }).join("");
      tr.querySelector("[data-tk-items]").innerHTML = o.items.map(function (i) { return "<li><span><b>" + i.qty + "×</b> " + esc(i.name) + "</span><em>" + R(i.price * i.qty) + "</em></li>"; }).join("");
      tr.querySelector("[data-tk-total]").textContent = R(o.total) + (o.type === "delivery" && typeof o.deliveryFee !== "number" ? " + delivery" : "");
      tr.querySelector("[data-tk-pay]").textContent = (o.payment === "card" ? "Card" : "Cash") + " on " + (o.type === "delivery" ? "delivery" : "collection");
      tr.querySelector("[data-tk-where]").innerHTML = o.type === "delivery" ? "Delivering to <b>" + esc(o.address) + "</b>" : "Collect at <b>Mochachos, 254 Atlas Road</b>, on the Sasol forecourt (corner of Campo St).";
      var here = tr.querySelector("[data-tk-here]");
      here.hidden = o.type !== "pickup" || o.status === "done" || cancelled;
      here.classList.toggle("is-arrived", !!o.arrived);
      here.querySelector("[data-tk-here-state]").textContent = o.arrived ? "We know you're here" + (o.arrived.spot ? " (" + o.arrived.spot + ")" : "") + ". Your order is coming out." : "On the forecourt? Let us know and we'll bring it out.";
      here.querySelector("form").hidden = !!o.arrived;
      var thread = tr.querySelector("[data-tk-thread]");
      thread.innerHTML = o.messages.length ? o.messages.map(function (m) { return '<div class="tk-msg ' + m.from + '"><p>' + esc(m.text) + "</p><small>" + (m.from === "store" ? "Mochachos · " : "You · ") + hhmm(m.t) + "</small></div>"; }).join("") : '<p class="tk-empty">Need to change something? Message the store here.</p>';
      thread.scrollTop = thread.scrollHeight;
      tr.querySelector("[data-tk-done]").hidden = o.status !== "done";
      if (lastStatus && lastStatus !== o.status) notify(steps[idx] ? steps[idx][1] + ": " + steps[idx][2] : "Order update");
      lastStatus = o.status;
      document.title = (cancelled ? "Cancelled" : steps[idx][1]) + " · " + o.id + " | Mochachos Atlas Road";
    }
    function load() {
      return O.get(id, token).then(function (r) {
        var prevMsgs = order ? order.messages.length : 0;
        order = r.order; render();
        if (order.unreadCustomer) O.customer(id, token, { seen: true }).catch(function () {});
        if (prevMsgs && order.messages.length > prevMsgs && order.messages[order.messages.length - 1].from === "store") notify("New message from Mochachos");
      }).catch(function (e) {
        tr.innerHTML = '<div class="tk-missing"><h1>We can\'t find that order</h1><p>' + esc(e.message) + '</p><a class="btn btn-fire" href="dishes.html"><span>Start a new order</span></a></div>';
        clearInterval(poll);
      });
    }
    var poll = setInterval(function () { if (!document.hidden) load(); }, 5000);
    O.onChange(load);
    load().then(function () { if (q.get("new") && order) { tr.querySelector("[data-tk-new]").hidden = false; } });
    setInterval(function () { if (order) render(); }, 30000);

    tr.querySelector("[data-tk-here] form").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.currentTarget;
      O.customer(id, token, { arrived: { spot: f.spot.value, car: f.car.value } }).then(function (r) { order = r.order; render(); });
    });
    tr.querySelector("[data-tk-msg]").addEventListener("submit", function (e) {
      e.preventDefault();
      var inp = e.currentTarget.text, text = inp.value.trim(); if (!text) return;
      inp.value = "";
      O.customer(id, token, { message: text }).then(function (r) { order = r.order; render(); });
    });
    var nb = tr.querySelector("[data-tk-notify]");
    if (nb) {
      if (!("Notification" in window) || Notification.permission !== "default") nb.hidden = true;
      nb.addEventListener("click", function () { Notification.requestPermission().then(function () { nb.hidden = true; }); });
    }
    tr.querySelector("[data-tk-again]").addEventListener("click", function () {
      if (!order) return;
      order.items.forEach(function (i) { window.MochachosTray.add(i.name, i.price, i.qty); });
      location.href = "checkout.html";
    });
  });

  /* =================== LIVE ORDER BANNER (every page) =================== */
  var mine = O.mine()[0];
  var page = document.body.getAttribute("data-page");
  if (mine && page !== "track" && page !== "dashboard" && Date.now() - mine.t < 6 * 3600000) {
    O.get(mine.id, mine.token).then(function (r) {
      var o = r.order;
      if (o.status === "done" || o.status === "cancelled") return;
      var labels = { new: "Received", grill: "On the grill 🔥", ready: o.type === "pickup" ? "Ready for pickup" : "Packed", out: "On the way 🛵" };
      var a = document.createElement("a");
      a.className = "live-order"; a.href = "track.html?id=" + encodeURIComponent(o.id) + "&t=" + encodeURIComponent(mine.token);
      a.innerHTML = '<span class="live-dot" aria-hidden="true"></span><span>Order ' + esc(o.id) + ": <b>" + labels[o.status] + "</b></span><em>Track →</em>";
      document.body.appendChild(a);
    }).catch(function () {});
  }

  /* =================== MESSAGE US FORM =================== */
  document.querySelectorAll("[data-message-form]").forEach(function (f) {
    var out = f.querySelector("[data-message-out]");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var b = f.querySelector("button[type=submit]"); b.disabled = true;
      O.sendMessage({ name: f.name.value, phone: f.phone.value, text: f.text.value }).then(function () {
        f.reset(); out.hidden = false; out.className = "msg-out ok"; out.textContent = "Thanks! Your message is with the team. We'll get back to you soon.";
      }).catch(function (x) { out.hidden = false; out.className = "msg-out err"; out.textContent = x.message; }).then(function () { b.disabled = false; });
    });
  });
})();
