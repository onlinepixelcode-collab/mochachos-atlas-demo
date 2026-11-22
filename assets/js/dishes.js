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

  function thumb(x, cls) {
    return x.img
      ? '<img class="' + (cls || "") + '" src="assets/img/' + x.img + '" alt="" loading="lazy">'
      : '<span class="' + (cls || "") + ' emoji-tile" aria-hidden="true">' + x.emoji + "</span>";
  }
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
    var it = x.item, c = x.cat;
    document.title = it.n + " | " + c.name + " | Mochachos Atlas Road";
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", it.n + " from R" + x.from.toFixed(2) + " at Mochachos Atlas Road, Boksburg. " + (it.d || c.blurb));
    var flavoured = c.id === "pollo" || /1\/4 chicken|1\/2 chicken|amigo combo|family (feast|fiesta|treat|variety)/i.test(it.n);
    var flavours = M.flavours.map(function (f, i) { return '<label><input type="radio" name="flav" value="' + esc(f.name) + '"' + (i === 1 ? " checked" : "") + "><span>" + "🌶".repeat(f.heat) + " " + esc(f.name) + "</span></label>"; }).join("");
    var opts = it.p.map(function (p, i) { return '<label><input type="radio" name="opt" value="' + i + '"' + (i === 0 ? " checked" : "") + "><span>" + (p[0] ? esc(p[0]) : "Regular") + " <b>" + R(p[1]) + "</b></span></label>"; }).join("");
    var idx = all.indexOf(x), prev = all[(idx - 1 + all.length) % all.length], next = all[(idx + 1) % all.length];
    var related = all.filter(function (d) { return d.cat.id === c.id && d.id !== x.id; }).slice(0, 4);
    if (related.length < 4) related = related.concat(all.filter(function (d) { return d.cat.id !== c.id && d.img; }).slice(0, 4 - related.length));

    root.innerHTML =
      '<section class="dish-hero">' +
        '<canvas class="fire-layer" data-fire data-res="0.4" data-smoke="0.6" aria-hidden="true"></canvas>' +
        '<div class="wrap dish-grid">' +
          '<div class="dish-visual">' + thumb(x, "dish-photo") + '<div class="food-glow" aria-hidden="true"></div></div>' +
          '<div class="dish-info">' +
            '<nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><a href="dishes.html">Dishes</a><span aria-hidden="true">/</span><a href="dishes.html?cat=' + c.id + '">' + esc(c.name) + '</a></nav>' +
            '<p class="eyebrow">' + esc(c.tag) + "</p>" +
            "<h1>" + esc(it.n) + (it.v ? ' <i class="veg" title="Vegetarian or veggie option">V</i>' : "") + "</h1>" +
            '<p class="lede">' + esc(it.d || c.blurb) + "</p>" +
            (it.p.length > 1 ? '<fieldset class="dish-opts"><legend>Choose</legend>' + opts + "</fieldset>" : "") +
            (flavoured ? '<fieldset class="dish-opts dish-flav"><legend>Zee Flavour</legend>' + flavours + "</fieldset>" : "") +
            '<div class="dish-buy"><div class="qty big"><button type="button" data-q="-1" aria-label="One less">−</button><b data-qty>1</b><button type="button" data-q="1" aria-label="One more">+</button></div>' +
            '<button class="btn btn-fire" data-add><span>Add to tray · <b data-total>' + R(it.p[0][1]) + "</b></span></button></div>" +
            '<div class="dish-meta"><span>✓ 100% halaal</span><span>✓ Made to order</span><span>✓ Pick-up, Uber Eats &amp; Mr D</span></div>' +
            '<button class="link-btn" data-ask>Ask Amigo about this dish</button>' +
          "</div>" +
        "</div>" +
      "</section>" +
      '<section class="section dish-more"><div class="wrap">' +
        '<div class="row-head"><div><p class="eyebrow red">Goes well with</p><h2 class="h-section">More from ' + esc(c.name) + '</h2></div>' +
        '<div class="dish-pager"><a class="car-btn" href="dish.html?id=' + prev.id + '" aria-label="Previous dish: ' + esc(prev.item.n) + '">←</a><a class="car-btn car-btn-red" href="dish.html?id=' + next.id + '" aria-label="Next dish: ' + esc(next.item.n) + '">→</a></div></div>' +
        '<div class="dish-grid-cards">' + related.map(card).join("") + "</div>" +
      "</div></section>";

    var qty = 1;
    var price = function () { var o = root.querySelector('input[name="opt"]:checked'); return it.p[o ? +o.value : 0]; };
    var paint = function () { root.querySelector("[data-qty]").textContent = qty; root.querySelector("[data-total]").textContent = R(price()[1] * qty); };
    root.addEventListener("change", paint);
    root.addEventListener("click", function (e) {
      var q = e.target.closest("[data-q]");
      if (q) { qty = Math.max(1, Math.min(20, qty + +q.getAttribute("data-q"))); paint(); }
      if (e.target.closest("[data-add]")) {
        var p = price(), f = root.querySelector('input[name="flav"]:checked');
        var name = it.n + (p[0] ? " (" + p[0] + ")" : "") + (f ? " · " + f.value : "");
        window.MochachosTray && window.MochachosTray.add(name, p[1], qty);
        var b = e.target.closest("[data-add]"); b.querySelector("span").innerHTML = "Added ✓";
        setTimeout(function () { b.querySelector("span").innerHTML = 'Add to tray · <b data-total>' + R(p[1] * qty) + "</b>"; }, 1500);
      }
      var qb = e.target.closest("[data-quick]");
      if (qb) quickAdd(all.filter(function (d) { return d.id === qb.getAttribute("data-quick"); })[0], qb);
      if (e.target.closest("[data-ask]") && window.MochachosChat) window.MochachosChat.ask("Tell me about the " + it.n + ". Is it spicy, and what goes well with it?");
    });
    // start the flames for the injected hero
    window.MochachosFire && window.MochachosFire.scan();
  });
})();
