/* Home banner: featured-dish carousel over the live flames. */
(function () {
  "use strict";
  var root = document.querySelector("[data-hero-slider]");
  if (!root) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SLIDES = [
    { img: "chicken-whole.jpg", alt: "Flame-grilled butterflied chicken on chips", ghost: "FUEGO", kicker: "Pollo Pueblo · Since 1994",
      title: '<span class="fire-text">Flame-grilled</span><br>Mexican <span class="outline">chicken</span>',
      text: "Butterflied, basted in your Zee Flavour and charred over open flame, on Atlas Road, Beyers Park.",
      plabel: "1/4 chicken from", name: "1/4 Chicken", price: 49.90, id: "pollo-1-4-chicken", sticker: ["Charred", "to order"], thumb: "Chicken" },
    { img: "pine-burger.jpg", alt: "Stacked chicken burger with cheese and pineapple", ghost: "SUPREMO", kicker: "Burgers El' Supremo",
      title: '<span class="fire-text">Nacho crunch</span><br>gourmet <span class="outline">burger</span>',
      text: "Chicken fillet coated in nachos and fried, topped with feta, guacamole, sour cream, salsa and jalapeño.",
      plabel: "Single", name: "Nacho Crunch Gourmet Burger", price: 79.90, id: "burgers-nacho-crunch-gourmet-burger", sticker: ["Go big", "amigo"], thumb: "Burgers" },
    { img: "burrito.jpg", alt: "Chicken burrito with chips", ghost: "BURRITO", kicker: "Mexican Meals",
      title: '<span class="fire-text">Burrito</span><br>time, <span class="outline">amigo</span>',
      text: "Chicken or rump steak with sautéed onion, green pepper, cheddar and guacamole in a soft flour tortilla.",
      plabel: "Chicken from", name: "Burrito (Chicken)", price: 74.90, id: "mexican-burrito", sticker: ["Wrapped", "tight"], thumb: "Burritos" },
    { img: "family.jpg", alt: "Family meal with chicken, burgers and chips", ghost: "FAMILIA", kicker: "Familia Fiesta",
      title: '<span class="fire-text">Feed</span><br>the whole <span class="outline">crew</span>',
      text: "Half chicken, two chicken burgers and the beegest chips or wedges. Family boards from R249.90.",
      plabel: "Family Variety", name: "Family Variety", price: 249.90, id: "familia-family-variety", sticker: ["Feeds", "3–4"], thumb: "Family" }
  ];
  var $ = function (s) { return root.querySelector(s); };
  var stack = $("[data-hero-stack]"), thumbs = $("[data-hero-thumbs]"), bar = $("[data-hero-bar]");
  var i = 0, timer = null, DUR = 6500, paused = false, t0 = 0;

  stack.innerHTML = SLIDES.map(function (sl, k) {
    return '<img class="food-main' + (k === 0 ? " is-on" : "") + '" src="assets/img/' + sl.img + '" alt="' + sl.alt + '"' + (k ? ' loading="lazy"' : ' fetchpriority="high"') + ">";
  }).join("");
  thumbs.innerHTML = SLIDES.map(function (sl, k) {
    return '<button role="tab" aria-selected="' + (k === 0) + '" data-k="' + k + '"><img src="assets/img/' + sl.img + '" alt=""><span>' + sl.thumb + "</span></button>";
  }).join("");

  function show(k, user) {
    i = (k + SLIDES.length) % SLIDES.length;
    var sl = SLIDES[i];
    stack.querySelectorAll("img").forEach(function (im, n) { im.classList.toggle("is-on", n === i); });
    thumbs.querySelectorAll("button").forEach(function (b, n) { b.setAttribute("aria-selected", String(n === i)); });
    var swap = function (sel, html) { var el = $(sel); el.classList.remove("swap-in"); void el.offsetWidth; el.innerHTML = html; el.classList.add("swap-in"); };
    swap("[data-hero-kicker]", sl.kicker);
    swap("[data-hero-title]", sl.title);
    swap("[data-hero-text]", sl.text);
    $("[data-hero-plabel]").textContent = sl.plabel;
    swap("[data-hero-price]", "R" + sl.price.toFixed(2));
    $("[data-hero-link]").href = "dish.html?id=" + sl.id;
    $("[data-hero-ghost]").textContent = sl.ghost;
    $("[data-hero-sticker]").innerHTML = "<span>" + sl.sticker[0] + "</span><b>" + sl.sticker[1] + "</b>";
    $("[data-hero-add] span").textContent = "Add to tray";
    t0 = performance.now();
    if (user) restart();
  }
  function restart() { clearInterval(timer); if (!reduce) timer = setInterval(function () { if (!paused && !document.hidden) show(i + 1); }, DUR); t0 = performance.now(); }
  (function tick() { requestAnimationFrame(tick); if (bar && !reduce) bar.style.transform = "scaleX(" + Math.min(1, paused ? (bar._p || 0) : (bar._p = (performance.now() - t0) / DUR)) + ")"; })();

  thumbs.addEventListener("click", function (e) { var b = e.target.closest("[data-k]"); if (b) show(+b.getAttribute("data-k"), true); });
  thumbs.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { show(i + 1, true); thumbs.querySelectorAll("button")[i].focus(); }
    if (e.key === "ArrowLeft") { show(i - 1, true); thumbs.querySelectorAll("button")[i].focus(); }
  });
  root.addEventListener("pointerenter", function () { paused = true; });
  root.addEventListener("pointerleave", function () { paused = false; t0 = performance.now() - (bar._p || 0) * DUR; });
  root.addEventListener("focusin", function () { paused = true; });
  root.addEventListener("focusout", function () { paused = false; });
  $("[data-hero-add]").addEventListener("click", function (e) {
    var sl = SLIDES[i];
    if (window.MochachosTray) window.MochachosTray.add(sl.name, sl.price);
    e.currentTarget.querySelector("span").textContent = "Added ✓";
  });
  restart();
})();
