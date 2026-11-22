/* Mochachos Atlas Road — page behaviour */
(function () {
  "use strict";

  /* ---------- Trading hours (South African time) ----------
     day: 0 = Sunday … 6 = Saturday. Times in minutes after midnight. */
  var HOURS = {
    0: [[600, 1200]],
    1: [[600, 1200]],
    2: [[600, 1200]],
    3: [[600, 1200]],
    4: [[600, 1200]],
    5: [[600, 735], [810, 1260]], // Friday: closed 12:15–13:30 for prayers
    6: [[600, 1260]]
  };
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function saNow() {
    var parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Johannesburg", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date());
    var map = {};
    parts.forEach(function (p) { map[p.type] = p.value; });
    var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(map.weekday);
    return { day: day, mins: (parseInt(map.hour, 10) % 24) * 60 + parseInt(map.minute, 10) };
  }
  function fmt(m) {
    var h = Math.floor(m / 60), mm = m % 60;
    return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm;
  }

  function storeStatus() {
    var now = saNow();
    var today = HOURS[now.day];
    for (var i = 0; i < today.length; i++) {
      var s = today[i];
      if (now.mins >= s[0] && now.mins < s[1]) {
        return { open: true, short: "Open until " + fmt(s[1]),
          long: s[1] - now.mins <= 45 ? "Open now, closing soon at " + fmt(s[1]) + "." : "Open now until " + fmt(s[1]) + "." };
      }
      if (now.mins < s[0]) {
        var reason = i > 0 ? " (back from prayers)" : "";
        return { open: false, short: "Opens " + fmt(s[0]), long: "Closed right now. We open at " + fmt(s[0]) + " today" + reason + "." };
      }
    }
    var nd = (now.day + 1) % 7;
    return { open: false, short: "Opens tomorrow " + fmt(HOURS[nd][0][0]),
      long: "Closed for today. We open " + DAY_NAMES[nd] + " at " + fmt(HOURS[nd][0][0]) + "." };
  }
  window.MochachosHours = { status: storeStatus, now: saNow, DAY_NAMES: DAY_NAMES, slots: function (d) { return HOURS[d]; } };

  function paintStatus() {
    var st = storeStatus();
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.classList.toggle("is-open", st.open);
      el.classList.toggle("is-closed", !st.open);
      var t = el.querySelector("[data-status-text]");
      if (t) t.textContent = st.short;
    });
    document.querySelectorAll("[data-status-long]").forEach(function (el) { el.textContent = st.long; });
    var day = saNow().day;
    document.querySelectorAll(".hours tr[data-days]").forEach(function (tr) {
      tr.classList.toggle("is-today", tr.getAttribute("data-days").split(",").indexOf(String(day)) > -1);
    });
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var mnav = document.getElementById("mobile-nav");
  if (toggle && mnav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      mnav.hidden = open;
    });
    mnav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { mnav.hidden = true; toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- Menu tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tabs [role=tab]"));
  function selectTab(btn, focus) {
    tabs.forEach(function (b) {
      var on = b === btn;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
      var panel = document.querySelector('[data-panel="' + b.dataset.tab + '"]');
      if (panel) { panel.hidden = !on; panel.classList.toggle("is-active", on); }
    });
    if (focus) btn.focus();
  }
  tabs.forEach(function (b, i) {
    b.tabIndex = b.getAttribute("aria-selected") === "true" ? 0 : -1;
    b.addEventListener("click", function () { selectTab(b); });
    b.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") selectTab(tabs[(i + 1) % tabs.length], true);
      if (e.key === "ArrowLeft") selectTab(tabs[(i - 1 + tabs.length) % tabs.length], true);
    });
  });

  /* ---------- Popular carousel ---------- */
  var car = document.querySelector("[data-carousel]");
  document.querySelectorAll("[data-car]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!car) return;
      var card = car.querySelector(".pop-card");
      var step = card ? card.getBoundingClientRect().width + 22 : 300;
      var dir = parseInt(btn.getAttribute("data-car"), 10);
      var atEnd = car.scrollLeft + car.clientWidth >= car.scrollWidth - 4;
      if (dir > 0 && atEnd) car.scrollTo({ left: 0, behavior: "smooth" });
      else car.scrollBy({ left: dir * step, behavior: "smooth" });
    });
  });

  /* Cards and promos that open a menu category */
  document.querySelectorAll("[data-goto-tab]").forEach(function (a) {
    a.addEventListener("click", function () {
      var t = document.querySelector('.tabs [data-tab="' + a.getAttribute("data-goto-tab") + '"]');
      if (t) selectTab(t);
    });
  });

  /* ---------- This or that vote (stored on this device only) ---------- */
  var vote = document.querySelector("[data-vote]");
  if (vote) {
    var KEY = "mochachos-vote";
    var state = { mine: null };
    try { var saved = JSON.parse(localStorage.getItem(KEY)); if (saved) state = saved; } catch (e) {}
    var paintVote = function () {
      ["q", "e"].forEach(function (k) {
        var el = vote.querySelector('[data-pct="' + k + '"]');
        if (el) el.textContent = state.mine === k ? "Your pick ✓" : "";
        var b = vote.querySelector('[data-pick="' + k + '"]');
        if (b) { b.classList.toggle("is-picked", state.mine === k); b.setAttribute("aria-pressed", String(state.mine === k)); }
      });
    };
    vote.querySelectorAll("[data-pick]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-pick");
        if (state.mine === k) return;
        state.mine = k;
        try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
        paintVote();
      });
    });
    paintVote();
  }

  /* ---------- Reveal on load / scroll ---------- */
  var reveals = document.querySelectorAll(".reveal:not(.hero .reveal)");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (el, i) { el.style.transitionDelay = (i % 6) * 70 + "ms"; io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
