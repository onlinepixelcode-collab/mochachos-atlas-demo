/* Mochachos Atlas Road — "All dishes" grid (dishes.html) and the single dish page (dish.html?id=…). */
(function () {
  "use strict";
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  function whenMenu(cb) {
    if (window.MochachosMenu) cb(window.MochachosMenu);
    else document.addEventListener("menu:ready", function () { cb(window.MochachosMenu); }, { once: true });
  }
  var U = function () { return window.MochachosMenuUtil; };
  var R = function (n) { return U().money(n); };

  function thumb(x, cls, opt) { return U().thumb(x, cls, opt); }
  function card(x) {
    var it = x.item;
    return '<article class="dish-card" data-id="' + x.id + '">' +
      '<a class="dish-card-img" href="dish.html?id=' + x.id + '" tabindex="-1" aria-hidden="true">' + thumb(x) + (it.v ? '<i class="veg">V</i>' : "") + "</a>" +
      '<div class="dish-card-body"><span class="dish-card-cat">' + esc(x.cat.name) + '</span>' +
      '<h3><a href="dish.html?id=' + x.id + '">' + esc(it.n) + "</a></h3>" +
      (it.d ? "<p>" + esc(it.d) + "</p>" : "<p>" + esc(x.cat.tag) + "</p>") +
      '<div class="dish-card-foot"><span class="dish-card-price">' + (it.p.length > 1 ? "<small>from</small> " : "") + R(x.from) + "</span>" +
      '<button class="add-btn" data-quick="' + x.id + '" aria-label="Add ' + esc(it.n) + ' to tray">+ Add</button></div></div></article>';
  }
  function quickAdd(x, btn) {
    var p = x.item.p[0];
    window.MochachosTray && window.MochachosTray.add(x.item.n + (p[0] ? " (" + p[0] + ")" : ""), p[1]);
    if (btn) { btn.textContent = "Added ✓"; btn.classList.add("is-done"); setTimeout(function () { btn.textContent = "+ Add"; btn.classList.remove("is-done"); }, 1400); }
  }

  /* ---------- dishes.html ---------- */
  whenMenu(function (M) {
    var grid = document.querySelector("[data-dish-grid]");
    if (!grid) return;
    var all = U().all(M);
    var catsEl = document.querySelector("[data-dish-cats]");
    var tilesEl = document.querySelector("[data-cat-tiles]");
    var search = document.querySelector("[data-dish-search]");
    var sortEl = document.querySelector("[data-dish-sort]");
    var vegEl = document.querySelector("[data-dish-veg]");
    var countEl = document.querySelector("[data-dish-count]");
    var params = new URLSearchParams(location.search);
    var state = { cat: params.get("cat") || "all", q: params.get("q") || "", sort: "menu", veg: false };
    if (search) search.value = state.q;

    tilesEl.innerHTML = M.categories.map(function (c) {
      var bg = c.noImg ? "" : ' style="background-image:url(assets/img/' + c.img + ')"';
      return '<button class="cat-tile' + (c.noImg ? " no-img" : "") + '" data-cat="' + c.id + '"' + bg + '><span class="cat-tile-emoji" aria-hidden="true">' +
        ({ salads: "🥗", kids: "🧒", desserts: "🍩", drinks: "🥤" }[c.id] || "") + '</span><b>' + esc(c.name) + "</b><small>" + c.items.length + " items</small></button>";
    }).join("");
    catsEl.innerHTML = '<button data-cat="all">All dishes <small>' + all.length + "</small></button>" +
      M.categories.map(function (c) { return '<button data-cat="' + c.id + '">' + esc(c.name) + " <small>" + c.items.length + "</small></button>"; }).join("");

    function render() {
      var q = state.q.trim().toLowerCase();
      var list = all.filter(function (x) {
        if (state.cat !== "all" && x.cat.id !== state.cat) return false;
        if (state.veg && !x.item.v && !/salad|chips|wedges|rice|onion|churro|milkshake|freezo|tea|lemonade|ginger|water|cappy|apple|buddy|cans|litre|dip|bun|coleslaw|feta|mozzarella|cheese nachos/i.test(x.item.n + (x.item.p[0][0] || ""))) return false;
        if (q) {
          var hay = (x.item.n + " " + (x.item.d || "") + " " + x.cat.name + " " + x.item.p.map(function (p) { return p[0]; }).join(" ")).toLowerCase();
          return q.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
        }
        return true;
      });
      if (state.sort === "low") list.sort(function (a, b) { return a.from - b.from; });
      if (state.sort === "high") list.sort(function (a, b) { return b.from - a.from; });
      if (state.sort === "az") list.sort(function (a, b) { return a.item.n.localeCompare(b.item.n); });
      grid.innerHTML = list.length ? list.map(card).join("") : '<p class="dish-empty">No dishes match that. Try another word or category.</p>';
      countEl.textContent = list.length + (list.length === 1 ? " dish" : " dishes");
      catsEl.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-cat") === state.cat)); });
      tilesEl.querySelectorAll("button").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-cat") === state.cat); });
      var u = new URL(location.href);
      state.cat === "all" ? u.searchParams.delete("cat") : u.searchParams.set("cat", state.cat);
      state.q ? u.searchParams.set("q", state.q) : u.searchParams.delete("q");
      history.replaceState(null, "", u);
    }
    function pickCat(id, scroll) {
      state.cat = id; render();
      if (scroll) document.querySelector("[data-dish-cats]").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    catsEl.addEventListener("click", function (e) { var b = e.target.closest("[data-cat]"); if (b) pickCat(b.getAttribute("data-cat")); });
    tilesEl.addEventListener("click", function (e) { var b = e.target.closest("[data-cat]"); if (b) pickCat(b.getAttribute("data-cat"), true); });
    if (search) search.addEventListener("input", function () { state.q = search.value; render(); });
    if (sortEl) sortEl.addEventListener("change", function () { state.sort = sortEl.value; render(); });
    if (vegEl) vegEl.addEventListener("change", function () { state.veg = vegEl.checked; render(); });
    grid.addEventListener("click", function (e) {
      var b = e.target.closest("[data-quick]"); if (!b) return;
      quickAdd(all.filter(function (x) { return x.id === b.getAttribute("data-quick"); })[0], b);
    });
    render();
  });

  /* ---------- mood effects: fizz bubbles (cold), sugar sparkle (sweet), drifting herbs (fresh) ---------- */
  function moodFx(cv, mood) {
    if (!cv) return;
    var g = cv.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2), parts = [];
    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    function size() { var w = cv.clientWidth * dpr, h = cv.clientHeight * dpr; if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } }
    function spawn(initial) {
      var w = cv.width, h = cv.height;
      if (mood === "cold") parts.push({ x: Math.random() * w, y: initial ? Math.random() * h : h + 20, r: (2 + Math.random() * 7) * dpr, vy: -(0.4 + Math.random() * 1.4) * dpr, ph: Math.random() * 6.28 });
      else if (mood === "sweet") parts.push({ x: Math.random() * w, y: initial ? Math.random() * h : -10, r: (0.8 + Math.random() * 2.2) * dpr, vy: (0.2 + Math.random() * 0.6) * dpr, ph: Math.random() * 6.28 });
      else parts.push({ x: Math.random() * w, y: initial ? Math.random() * h : -20, r: (6 + Math.random() * 8) * dpr, vy: (0.3 + Math.random() * 0.7) * dpr, ph: Math.random() * 6.28, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.03 });
    }
    function draw(t) {
      size();
      var w = cv.width, h = cv.height, target = mood === "cold" ? 70 : mood === "sweet" ? 90 : 22;
      if (!parts.length) for (var i = 0; i < target; i++) spawn(true);
      while (parts.length < target) spawn(false);
      g.clearRect(0, 0, w, h);
      for (var j = parts.length - 1; j >= 0; j--) {
        var p = parts[j];
        p.y += p.vy; p.ph += 0.03;
        var sx = p.x + Math.sin(p.ph) * (mood === "cold" ? 3 : 10) * dpr;
        if (mood === "cold") {
          g.beginPath(); g.arc(sx, p.y, p.r, 0, 6.283); g.strokeStyle = "rgba(220,248,255,.55)"; g.lineWidth = 1.2 * dpr; g.stroke();
          g.fillStyle = "rgba(200,240,255,.10)"; g.fill();
          g.beginPath(); g.arc(sx - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.25, 0, 6.283); g.fillStyle = "rgba(255,255,255,.75)"; g.fill();
          if (p.y < -20) parts.splice(j, 1);
        } else if (mood === "sweet") {
          var tw = 0.5 + 0.5 * Math.sin(p.ph * 3);
          g.fillStyle = "rgba(255," + (220 + 30 * tw | 0) + ",170," + (0.35 + 0.5 * tw) + ")";
          g.beginPath(); g.arc(sx, p.y, p.r, 0, 6.283); g.fill();
          if (p.y > h + 10) parts.splice(j, 1);
        } else {
          p.rot += p.vr;
          g.save(); g.translate(sx, p.y); g.rotate(p.rot);
          g.fillStyle = "rgba(140,205,90,.55)"; g.beginPath(); g.ellipse(0, 0, p.r, p.r * 0.45, 0, 0, 6.283); g.fill();
          g.strokeStyle = "rgba(60,120,40,.55)"; g.lineWidth = 1 * dpr; g.beginPath(); g.moveTo(-p.r, 0); g.lineTo(p.r, 0); g.stroke();
          g.restore();
          if (p.y > h + 20) parts.splice(j, 1);
        }
      }
      if (!reduce) requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* ---------- dish.html ---------- */
  whenMenu(function (M) {
    var root = document.querySelector("[data-dish]");
    if (!root) return;
    var all = U().all(M);
    var id = new URLSearchParams(location.search).get("id");
    var x = all.filter(function (d) { return d.id === id; })[0];
    if (!x) {
      root.innerHTML = '<div class="dish-missing"><h1>Dish not found</h1><p>That dish isn\'t on the menu any more.</p><a class="btn btn-fire" href="dishes.html"><span>See all dishes</span></a></div>';
      return;
    }
    var it = x.item, c = x.cat, mood = x.mood || "grill";
    document.title = it.n + " | " + c.name + " | Mochachos Atlas Road";
    document.body.setAttribute("data-mood", mood);
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", it.n + " from R" + x.from.toFixed(2) + " at Mochachos Atlas Road, Boksburg. " + (it.d || c.blurb));
    // what this item's page should say, by mood
    var MOOD = {
      cold: { kicker: "Ice-cold", meta: ["Served ice-cold", "100% halaal", "Perfect with any meal"], add: "Add to tray", fx: '<canvas class="mood-fx" data-mood-fx="cold" aria-hidden="true"></canvas>', ask: "What goes well with the " + it.n + "?" },
      sweet: { kicker: "Something sweet", meta: ["Made fresh", "100% halaal", "The perfect finish"], add: "Add to tray", fx: '<canvas class="mood-fx" data-mood-fx="sweet" aria-hidden="true"></canvas>', ask: "What goes well with the " + it.n + "?" },
      fresh: { kicker: "Fresh & crisp", meta: ["Made fresh daily", "100% halaal", "Great on the side"], add: "Add to tray", fx: '<canvas class="mood-fx" data-mood-fx="fresh" aria-hidden="true"></canvas>', ask: "What goes well with the " + it.n + "?" },
      grill: { kicker: c.tag, meta: ["100% halaal", "Made to order", "Pick-up, Uber Eats & Mr D"], add: "Add to tray", fx: '<canvas class="fire-layer" data-fire data-res="0.4" data-smoke="0.6" aria-hidden="true"></canvas>', ask: "Tell me about the " + it.n + ". Is it spicy, and what goes well with it?" }
    }[mood];
    var flavoured = c.id === "pollo" || /1\/4 chicken|1\/2 chicken|amigo combo|family (feast|fiesta|treat|variety)/i.test(it.n);
    var flavours = M.flavours.map(function (f, i) { return '<label><input type="radio" name="flav" value="' + esc(f.name) + '"' + (i === 1 ? " checked" : "") + '><span><i class="heat-dots" data-heat="' + f.heat + '" aria-hidden="true"></i>' + esc(f.name) + "</span></label>"; }).join("");
    var opts = it.p.map(function (p, i) { return '<label><input type="radio" name="opt" value="' + i + '"' + (i === 0 ? " checked" : "") + "><span>" + (p[0] ? esc(p[0]) : "Regular") + " <b>" + R(p[1]) + "</b></span></label>"; }).join("");
    var choiceLabel = /milkshake|freezo|dipz/i.test(it.n) ? "Flavour" : /water/i.test(it.n) ? "Still or sparkling" : "Choose";
    var SW = { chocolate: "#6b3e26", strawberry: "#f47ca0", banana: "#f4d35e", bubblegum: "#7ec8f0", lime: "#8fd14f", coffee: "#8b5a3c", "toffee caramel": "#c98a3c", "white chocolate": "#efe3cf", still: "#d6f1fb", sparkling: "#9fd8ec", appletiser: "#7cc243", grapetiser: "#9b3c74", salsa: "#e2442f", guacamole: "#7cb342", "peri-mayo": "#f2a65a", "sweet chilli": "#ff6b3d", "sour cream": "#fffaf0" };
    var choices = (it.choices || []).map(function (ch, i) { return '<label><input type="radio" name="choice" value="' + esc(ch) + '"' + (i === 0 ? " checked" : "") + '><span><i class="swatch" style="background:' + (SW[ch.toLowerCase()] || "#ccc") + '" aria-hidden="true"></i>' + esc(ch) + "</span></label>"; }).join("");
    var idx = all.indexOf(x), prev = all[(idx - 1 + all.length) % all.length], next = all[(idx + 1) % all.length];
    // "goes well with": drinks and desserts suggest food, food suggests a drink and a side
    var pick = function (names) { return names.map(function (n) { return all.filter(function (d) { return d.item.n === n; })[0]; }).filter(Boolean); };
    var related = mood === "cold" || mood === "sweet"
      ? pick(["1/2 Chicken, Beeg Chips & Buddy", "Nacho Crunch Gourmet Burger", "Burrito", mood === "cold" ? "Churros (plain)" : "Milkshake 350ml"])
      : all.filter(function (d) { return d.cat.id === c.id && d.id !== x.id; }).slice(0, 2).concat(pick(["Loaded Chips", "Lemon Ice Tea"]));
    related = related.filter(function (d) { return d.id !== x.id; }).slice(0, 4);

    root.innerHTML =
      '<section class="dish-hero mood-' + mood + '">' + MOOD.fx +
        '<div class="wrap dish-grid">' +
          '<div class="dish-visual">' + thumb(x, "dish-photo") + '<div class="food-glow" aria-hidden="true"></div></div>' +
          '<div class="dish-info">' +
            '<nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><a href="dishes.html">Dishes</a><span aria-hidden="true">/</span><a href="dishes.html?cat=' + c.id + '">' + esc(c.name) + '</a></nav>' +
            '<p class="eyebrow">' + esc(MOOD.kicker) + "</p>" +
            "<h1>" + esc(it.n) + (it.v ? ' <i class="veg" title="Vegetarian or veggie option">V</i>' : "") + "</h1>" +
            '<p class="lede">' + esc(it.d || c.blurb) + "</p>" +
            (it.p.length > 1 ? '<fieldset class="dish-opts"><legend>Choose</legend>' + opts + "</fieldset>" : "") +
            (choices ? '<fieldset class="dish-opts dish-choice"><legend>' + choiceLabel + "</legend>" + choices + "</fieldset>" : "") +
            (flavoured ? '<fieldset class="dish-opts dish-flav"><legend>Zee Flavour</legend>' + flavours + "</fieldset>" : "") +
            '<div class="dish-buy"><div class="qty big"><button type="button" data-q="-1" aria-label="One less">−</button><b data-qty>1</b><button type="button" data-q="1" aria-label="One more">+</button></div>' +
            '<button class="btn btn-fire" data-add><span>' + MOOD.add + ' · <b data-total>' + R(it.p[0][1]) + "</b></span></button></div>" +
            '<div class="dish-meta">' + MOOD.meta.map(function (m) { return "<span>✓ " + esc(m) + "</span>"; }).join("") + "</div>" +
            '<button class="link-btn" data-ask>Ask Amigo about this</button>' +
          "</div>" +
        "</div>" +
      "</section>" +
      '<section class="section dish-more"><div class="wrap">' +
        '<div class="row-head"><div><p class="eyebrow red">Goes well with</p><h2 class="h-section">' + (mood === "cold" ? "Pair it with" : mood === "sweet" ? "Before dessert" : "Complete the meal") + '</h2></div>' +
        '<div class="dish-pager"><a class="car-btn" href="dish.html?id=' + prev.id + '" aria-label="Previous dish: ' + esc(prev.item.n) + '">←</a><a class="car-btn car-btn-red" href="dish.html?id=' + next.id + '" aria-label="Next dish: ' + esc(next.item.n) + '">→</a></div></div>' +
        '<div class="dish-grid-cards">' + related.map(card).join("") + "</div>" +
      "</div></section>";

    var qty = 1;
    var price = function () { var o = root.querySelector('input[name="opt"]:checked'); return it.p[o ? +o.value : 0]; };
    var choice = function () { var ch = root.querySelector('input[name="choice"]:checked'); return ch ? ch.value : ""; };
    var paint = function () {
      root.querySelector("[data-qty]").textContent = qty; root.querySelector("[data-total]").textContent = R(price()[1] * qty);
      // the illustration follows the chosen flavour (e.g. a strawberry milkshake turns pink)
      var tile = root.querySelector(".dish-visual .art-tile");
      if (tile && x.art && window.MochachosArt) tile.innerHTML = window.MochachosArt.svg(x.art, choice(), it.n);
    };
    root.addEventListener("change", paint);
    root.addEventListener("click", function (e) {
      var q = e.target.closest("[data-q]");
      if (q) { qty = Math.max(1, Math.min(20, qty + +q.getAttribute("data-q"))); paint(); }
      if (e.target.closest("[data-add]")) {
        var p = price(), f = root.querySelector('input[name="flav"]:checked'), ch = choice();
        var name = it.n + (p[0] ? " (" + p[0] + ")" : "") + (ch ? " · " + ch : f ? " · " + f.value : "");
        window.MochachosTray && window.MochachosTray.add(name, p[1], qty);
        var b = e.target.closest("[data-add]"); b.querySelector("span").innerHTML = "Added ✓";
        setTimeout(function () { b.querySelector("span").innerHTML = MOOD.add + ' · <b data-total>' + R(p[1] * qty) + "</b>"; }, 1500);
      }
      var qb = e.target.closest("[data-quick]");
      if (qb) quickAdd(all.filter(function (d) { return d.id === qb.getAttribute("data-quick"); })[0], qb);
      if (e.target.closest("[data-ask]") && window.MochachosChat) window.MochachosChat.ask(MOOD.ask);
    });
    paint();
    if (mood === "grill") window.MochachosFire && window.MochachosFire.scan();
    else moodFx(root.querySelector("[data-mood-fx]"), mood);
  });
})();
