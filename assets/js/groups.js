/* Groups page: family meal cards from the menu data. */
(function () {
  "use strict";
  function go(M) {
    var el = document.querySelector("[data-family-grid]");
    if (!el) return;
    var U = window.MochachosMenuUtil;
    var fam = U.all(M).filter(function (x) { return x.cat.id === "familia"; });
    var feeds = { "Family Variety": "3–4", "Family Feast": "4", "Family Fiesta": "4–5", "Family Share Meal": "4–6", "Family Treat": "8" };
    el.innerHTML = fam.map(function (x) {
      return '<article class="family-card"><img src="assets/img/family.jpg" alt="" loading="lazy"><div><span class="feeds">Feeds ' + (feeds[x.item.n] || "4") + '</span><h3><a href="dish.html?id=' + x.id + '">' + x.item.n + '</a></h3><p>' + (x.item.d || "") + '</p><div class="dish-card-foot"><span class="dish-card-price">' + U.money(x.from) + '</span><button class="add-btn" data-fam="' + x.id + '">+ Add</button></div></div></article>';
    }).join("");
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-fam]"); if (!b) return;
      var x = fam.filter(function (f) { return f.id === b.getAttribute("data-fam"); })[0];
      window.MochachosTray.add(x.item.n, x.item.p[0][1]);
      b.textContent = "Added ✓"; setTimeout(function () { b.textContent = "+ Add"; }, 1400);
    });
  }
  if (window.MochachosMenu) go(window.MochachosMenu); else document.addEventListener("menu:ready", function () { go(window.MochachosMenu); }, { once: true });
})();
