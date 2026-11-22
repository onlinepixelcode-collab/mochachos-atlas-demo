/* Mochachos Atlas Road — full menu, order tray and Zee Flavours meter.
   Data: assets/data/menu.json (transcribed from the 2026 Mochachos SA menu). */
(function () {
  "use strict";

  var listEl = document.querySelector("[data-menu-list]");
  var catsEl = document.querySelector("[data-menu-cats]");
  var searchEl = document.querySelector("[data-menu-search]");
  var emptyEl = document.querySelector("[data-menu-empty]");
  var MENU = null;

  var rand = function (n) { return "R" + n.toFixed(2); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  fetch("assets/data/menu.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      MENU = data;
      window.MochachosMenu = data;
      renderMenu();
      renderFlavours();
      // cards and promos open the right category (on this page or the Menu page)
      document.querySelectorAll("[data-goto-tab]").forEach(function (a) {
        var id = a.getAttribute("data-goto-tab");
        a.setAttribute("href", (document.getElementById("cat-" + id) ? "" : "menu.html") + "#cat-" + id);
      });
      // the menu renders after load, so honour a #cat-… link once it exists
      if (/^#cat-/.test(location.hash)) {
        var target = document.querySelector(location.hash);
        if (target) {
          var go = function () { target.scrollIntoView(); };
          setTimeout(go, 60);
          document.addEventListener("book:ready", function () { setTimeout(go, 30); }, { once: true });
          window.addEventListener("load", function () { setTimeout(go, 30); }, { once: true });
        }
      }
      document.dispatchEvent(new CustomEvent("menu:ready"));
    })
    .catch(function () {
      if (listEl) listEl.innerHTML = '<p class="menu-loading">The menu could not load. Call 010 448 0666 and we\'ll talk you through it.</p>';
    });


  /* ---------- shared helpers (used by dishes, dish, 3D counter and Amigo) ---------- */
  var slug = function (s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };
  var EMOJI = { salads: "🥗", kids: "🧒", desserts: "🍩", drinks: "🥤", sides: "🍟" };
  function imgFor(c, it) {
    var n = it.n.toLowerCase();
    if (/wing/.test(n)) return "wings.jpg";
    if (/pine/.test(n)) return "pine-burger.jpg";
    if (/schwarma/.test(n)) return "schwarma.jpg";
    if (/quesadilla/.test(n)) return "quesadilla.jpg";
    if (/enchilada|chimichanga/.test(n)) return "enchilada.jpg";
    if (/fajita/.test(n)) return "fajita.jpg";
    if (/nacho/.test(n) && !/burger/.test(n)) return "nachos.jpg";
    if (/burrito/.test(n)) return "burrito.jpg";
    if (/family|amigo combo/.test(n)) return "family.jpg";
    if (/burger/.test(n) && /chips|buddy/.test(n)) return "burger-combo.jpg";
    if (/burger/.test(n)) return "jalapeno-burger.jpg";
    if (/chicken|liver|fillet/.test(n) && c.id !== "salads") return "chicken-whole.jpg";
    if (/chips|wedges/.test(n)) return "chips.jpg";
    return c.noImg ? null : c.img;
  }
  function allItems(M) {
    var out = [];
    M.categories.forEach(function (c) {
      c.items.forEach(function (it, i) {
        out.push({ id: c.id + "-" + slug(it.n), cat: c, item: it, index: i, img: imgFor(c, it), emoji: EMOJI[c.id] || "🌶",
          from: Math.min.apply(null, it.p.map(function (p) { return p[1]; })) });
      });
    });
    return out;
  }
  function findByName(M, name, option) {
    var q = slug(name || ""), best = null, bestScore = 0;
    allItems(M).forEach(function (x) {
      var s = slug(x.item.n);
      var score = s === q ? 100 : (s.indexOf(q) > -1 || q.indexOf(s) > -1) ? 60 - Math.abs(s.length - q.length) / 4 : 0;
      if (!score) {
        var qw = q.split("-"), sw = s.split("-");
        var hits = qw.filter(function (w) { return w.length > 2 && sw.indexOf(w) > -1; }).length;
        score = hits ? hits * 12 - sw.length : 0;
      }
      if (score > bestScore) { bestScore = score; best = x; }
    });
    if (!best || bestScore < 10) return null;
    var p = best.item.p[0];
    if (option) {
      var o = slug(option);
      p = best.item.p.filter(function (pp) { return slug(pp[0]) === o || slug(pp[0]).indexOf(o) > -1; })[0] || p;
    }
    return { entry: best, label: p[0], price: p[1], name: best.item.n + (p[0] ? " (" + p[0] + ")" : "") };
  }
  window.MochachosMenuUtil = { slug: slug, imgFor: imgFor, all: allItems, find: findByName,
    money: function (n) { return "R" + n.toFixed(2); } };

  /* ---------- Menu ---------- */
  function renderMenu() {
    if (!listEl) return;
    var cats = "", html = "";
    MENU.categories.forEach(function (c) {
      cats += '<a href="#cat-' + c.id + '" data-cat="' + c.id + '">' + esc(c.name) + "</a>";
      html += '<section class="cat" id="cat-' + c.id + '" data-cat-block="' + c.id + '">';
      html += '<header class="cat-head' + (c.noImg ? " no-img" : "") + '">';
      if (!c.noImg) html += '<img src="assets/img/' + c.img + '" alt="" loading="lazy">';
      html += '<div class="cat-title"><span class="cat-tag">' + esc(c.tag) + "</span><h3>" + esc(c.name) + "</h3><p>" + esc(c.blurb) + "</p></div></header>";
      var lastGroup = -1;
      html += '<div class="items">';
      c.items.forEach(function (it, i) {
        if (c.groups && it.g !== lastGroup) {
          lastGroup = it.g;
          html += '<h4 class="group">' + esc(c.groups[it.g]) + "</h4>";
        }
        var search = (c.name + " " + it.n + " " + (it.d || "") + " " + it.p.map(function (p) { return p[0]; }).join(" ")).toLowerCase();
        html += '<article class="item" data-search="' + esc(search) + '">';
        html += '<div class="item-text"><h5>' + esc(it.n) + (it.v ? ' <i class="veg" title="Vegetarian or veggie option">V</i>' : "") + "</h5>";
        if (it.d) html += "<p>" + esc(it.d) + "</p>";
        html += '</div><div class="prices">';
        it.p.forEach(function (p, j) {
          var label = p[0] ? '<small>' + esc(p[0]) + "</small>" : "";
          html += '<button class="price" data-add="' + c.id + "|" + i + "|" + j + '" aria-label="Add ' + esc(it.n + (p[0] ? " (" + p[0] + ")" : "")) + " for " + rand(p[1]) + ' to tray">' + label + "<b>" + rand(p[1]) + '</b><span class="plus" aria-hidden="true">+</span></button>';
        });
        html += "</div></article>";
      });
      html += "</div></section>";
    });
    catsEl.innerHTML = cats;
    listEl.innerHTML = html;

    listEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-add]");
      if (!b) return;
      var k = b.getAttribute("data-add").split("|");
      var c = MENU.categories.filter(function (x) { return x.id === k[0]; })[0];
      var it = c.items[+k[1]], p = it.p[+k[2]];
      addToTray(it.n + (p[0] ? " (" + p[0] + ")" : ""), p[1]);
      b.classList.remove("is-added"); void b.offsetWidth; b.classList.add("is-added");
    });

    // active category chip while scrolling
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          var id = en.target.getAttribute("data-cat-block");
          catsEl.querySelectorAll("a").forEach(function (a) {
            var on = a.getAttribute("data-cat") === id;
            a.classList.toggle("is-on", on);
            if (on && catsEl.scrollWidth > catsEl.clientWidth) catsEl.scrollTo({ left: a.offsetLeft - 16, behavior: "smooth" });
          });
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      listEl.querySelectorAll("[data-cat-block]").forEach(function (s) { io.observe(s); });
    }


    if (searchEl) searchEl.addEventListener("input", filter);
  }

  function filter() {
    var q = searchEl.value.trim().toLowerCase();
    var any = false;
    listEl.querySelectorAll("[data-cat-block]").forEach(function (sec) {
      var shown = 0;
      sec.querySelectorAll(".item").forEach(function (it) {
        var ok = !q || q.split(/\s+/).every(function (w) { return it.getAttribute("data-search").indexOf(w) > -1; });
        it.hidden = !ok;
        if (ok) shown++;
      });
      sec.querySelectorAll(".group").forEach(function (g) { g.hidden = !!q; });
      sec.hidden = shown === 0;
      if (shown) any = true;
    });
    if (emptyEl) emptyEl.hidden = any;
  }

  /* ---------- Order tray ---------- */
  var KEY = "mochachos-atlas-tray";
  var tray = [];
  try { tray = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { tray = []; }
  var trayBtn = document.querySelector(".tray-launch");
  var trayPanel = document.getElementById("tray");
  var trayList = document.querySelector("[data-tray-list]");

  function save() { try { localStorage.setItem(KEY, JSON.stringify(tray)); } catch (e) {} document.dispatchEvent(new CustomEvent("tray:change")); }
  window.addEventListener("storage", function (e) { if (e.key === KEY) { try { tray = JSON.parse(e.newValue) || []; } catch (x) { tray = []; } paintTray(); document.dispatchEvent(new CustomEvent("tray:change")); } });
  function total() { return tray.reduce(function (s, t) { return s + t.price * t.qty; }, 0); }
  function count() { return tray.reduce(function (s, t) { return s + t.qty; }, 0); }

  function addToTray(name, price, qty) {
    var hit = tray.filter(function (t) { return t.name === name; })[0];
    if (hit) hit.qty += qty || 1; else tray.push({ name: name, price: price, qty: qty || 1 });
    save(); paintTray(true);
  }
  window.MochachosTray = { add: addToTray, open: function () { if (trayBtn && count()) openTray(); }, items: function () { return tray.map(function (t) { return { name: t.name, price: t.price, qty: t.qty }; }); }, total: function () { return total(); },
    setQty: function (name, q) { var t = tray.filter(function (x) { return x.name === name; })[0]; if (!t) return; t.qty = q; if (t.qty <= 0) tray.splice(tray.indexOf(t), 1); save(); paintTray(); },
    clear: function () { tray = []; save(); paintTray(); } };
  function paintTray(bump) {
    if (!trayBtn) return;
    var n = count();
    trayBtn.hidden = n === 0;
    document.querySelectorAll("[data-tray-count]").forEach(function (e) { e.textContent = n; });
    document.querySelectorAll("[data-tray-total]").forEach(function (e) { e.textContent = rand(total()); });
    if (bump) { trayBtn.classList.remove("bump"); void trayBtn.offsetWidth; trayBtn.classList.add("bump"); }
    trayList.innerHTML = tray.length ? tray.map(function (t, i) {
      return '<li><div><strong>' + esc(t.name) + "</strong><span>" + rand(t.price) + ' each</span></div><div class="qty"><button data-q="' + i + '|-1" aria-label="One less ' + esc(t.name) + '">−</button><b>' + t.qty + '</b><button data-q="' + i + '|1" aria-label="One more ' + esc(t.name) + '">+</button></div></li>';
    }).join("") : '<li class="tray-empty">Your tray is empty. Tap any price on the menu to add it.</li>';
    if (n === 0 && trayPanel && !trayPanel.hidden) closeTray();
  }
  function openTray() { trayPanel.hidden = false; trayBtn.setAttribute("aria-expanded", "true"); }
  function closeTray() { trayPanel.hidden = true; trayBtn.setAttribute("aria-expanded", "false"); }

  if (trayBtn && trayPanel) {
    trayBtn.addEventListener("click", openTray);
    trayPanel.querySelector(".tray-close").addEventListener("click", closeTray);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !trayPanel.hidden) closeTray(); });
    trayList.addEventListener("click", function (e) {
      var b = e.target.closest("[data-q]"); if (!b) return;
      var k = b.getAttribute("data-q").split("|");
      var t = tray[+k[0]]; t.qty += +k[1];
      if (t.qty <= 0) tray.splice(+k[0], 1);
      save(); paintTray();
    });
    trayPanel.querySelector("[data-tray-clear]").addEventListener("click", function () { tray = []; save(); paintTray(); });
    var copyBtn = trayPanel.querySelector("[data-tray-copy]");
    copyBtn.addEventListener("click", function () {
      var text = "Mochachos Atlas Road order\n" + tray.map(function (t) { return t.qty + " x " + t.name + " — " + rand(t.price * t.qty); }).join("\n") + "\nTotal: " + rand(total());
      var done = function () { copyBtn.textContent = "Copied ✓"; setTimeout(function () { copyBtn.textContent = "Copy order"; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { window.prompt("Copy your order:", text); });
      else window.prompt("Copy your order:", text);
    });
    paintTray();
  }

  /* ---------- Zee Flavours meter ---------- */
  function renderFlavours() {
    var picks = document.querySelector("[data-flav-picks]");
    if (!picks || !MENU.flavours) return;
    var scale = document.querySelector("[data-thermo-scale]");
    var fill = document.querySelector("[data-thermo-fill]");
    var nameEl = document.querySelector("[data-flav-name]");
    var noteEl = document.querySelector("[data-flav-note]");
    var section = document.getElementById("flavours");
    var colours = ["#9bd36a", "#f5c000", "#f39a1e", "#e4542a", "#db342e"];
    picks.innerHTML = MENU.flavours.map(function (f, i) {
      return '<button role="radio" aria-checked="false" data-flav="' + i + '" style="--c:' + colours[i] + '"><span>' + "🌶".repeat(f.heat) + "</span>" + esc(f.name) + "</button>";
    }).join("");
    scale.innerHTML = MENU.flavours.slice().reverse().map(function (f) { return "<li>" + esc(f.name) + "</li>"; }).join("");
    function pick(i, fromOutside) {
      var f = MENU.flavours[i];
      picks.querySelectorAll("button").forEach(function (b, j) { b.setAttribute("aria-checked", String(i === j)); b.tabIndex = i === j ? 0 : -1; });
      fill.style.height = (f.heat / 5) * 100 + "%";
      fill.style.background = "linear-gradient(0deg, #9bd36a, " + colours[i] + ")";
      section.style.setProperty("--heat", colours[i]);
      section.setAttribute("data-heat", f.heat);
      nameEl.textContent = f.name;
      noteEl.textContent = f.note;
      if (!fromOutside) { if (window.MochachosHeat) window.MochachosHeat.set(f.heat); else window.dispatchEvent(new CustomEvent("heat", { detail: f.heat })); }
    }
    picks.addEventListener("click", function (e) { var b = e.target.closest("[data-flav]"); if (b) pick(+b.getAttribute("data-flav")); });
    picks.addEventListener("keydown", function (e) {
      var cur = +(picks.querySelector('[aria-checked="true"]') || { getAttribute: function () { return 0; } }).getAttribute("data-flav");
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); pick(Math.min(4, cur + 1)); picks.querySelectorAll("button")[Math.min(4, cur + 1)].focus(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); pick(Math.max(0, cur - 1)); picks.querySelectorAll("button")[Math.max(0, cur - 1)].focus(); }
    });
    var saved = 2; try { saved = parseInt(localStorage.getItem("mochachos-heat"), 10) || 2; } catch (e) {}
    pick(Math.min(4, Math.max(0, saved - 1)));
    window.addEventListener("heat", function (e) { var cur = picks.querySelector('[aria-checked="true"]'); if (!cur || +cur.getAttribute("data-flav") !== e.detail - 1) pick(e.detail - 1, true); });
  }
})();
