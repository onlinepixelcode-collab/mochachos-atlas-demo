/* Home: "Right now at Atlas Road" — meal picks that change with the time of day (SA time). */
(function () {
  "use strict";
  var root = document.querySelector("[data-now]");
  if (!root) return;
  var $ = function (s) { return root.querySelector(s); };
  var PERIODS = [
    { key: "morning", from: 600, to: 690, emoji: "☀️", title: "Morning fuel", text: "Just opened and the grill is hot. Something light to start the day.",
      picks: [["Toasted Mexican Chicken Mayo"], ["Mexican Chicken Pieces with Rice"], ["3 Chicken Strips & Dip"], ["Lemon Ice Tea", "350ml"]] },
    { key: "lunch", from: 690, to: 870, emoji: "🌮", title: "Lunch rush", text: "Combos with chips and a Buddy, quick to grab on your break.",
      picks: [["1/4 Chicken, Beeg Chips & Buddy"], ["Chicken Burger, Beeg Chips & Buddy"], ["Chicken Schwarma, Beeg Chips & Buddy"], ["Chicken Burrito, Beeg Chips & Buddy"]] },
    { key: "afternoon", from: 870, to: 1020, emoji: "🍟", title: "Snack attack", text: "That 3 o'clock craving. Wings, loaded chips and something cold.",
      picks: [["4 Full BBQ Wings & Beeg Chips"], ["Loaded Chips", "Beeger"], ["Milkshake 350ml"], ["Churros (plain)", "3 churros"]] },
    { key: "dinner", from: 1020, to: 1140, emoji: "🔥", title: "Dinner on the grill", text: "Feed the family tonight. Full chickens and boards for the table.",
      picks: [["Family Fiesta"], ["1/2 Chicken, Beeg Chips & Buddy"], ["Family Variety"], ["Nachos", "Chicken"]] },
    { key: "late", from: 1140, to: 1260, emoji: "🌙", title: "Late cravings", text: "Last orders before we close. Grab something hot on the way home.",
      picks: [["Nacho Crunch Gourmet Burger"], ["Chimichanga", "Chicken"], ["8 Full BBQ Wings & Beeger Chips"], ["Freezo 350ml"]] }
  ];
  var CLOSED = { key: "closed", emoji: "💤", title: "The grill is resting", text: "We're closed right now. Line up tomorrow's lunch and schedule it for pickup.",
    picks: [["1/2 Chicken, Beeg Chips & Buddy"], ["Family Fiesta"], ["Nacho Crunch Gourmet Burger"], ["Burrito", "Chicken"]] };
  var PRAYER = { key: "prayer", emoji: "🕌", title: "Back after prayers", text: "We close on Fridays from 12:15 to 13:30. Order now and schedule it for 13:30.",
    picks: [["1/4 Chicken, Beeg Chips & Buddy"], ["Chicken Burger, Beeg Chips & Buddy"], ["Burrito", "Chicken"], ["Family Variety"]] };
  var fmt = function (m) { return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
  var lastKey = null;

  function current() {
    var H = window.MochachosHours, n = H.now(), st = H.status();
    if (n.day === 5 && n.mins >= 735 && n.mins < 810) return { p: PRAYER, n: n, st: st };
    if (!st.open) return { p: CLOSED, n: n, st: st };
    var p = PERIODS.filter(function (x) { return n.mins >= x.from && n.mins < x.to; })[0] || PERIODS[PERIODS.length - 1];
    return { p: p, n: n, st: st };
  }
  function render(force) {
    if (!window.MochachosMenu || !window.MochachosHours) return;
    var c = current(), p = c.p, U = window.MochachosMenuUtil, M = window.MochachosMenu;
    $("[data-now-clock]").textContent = fmt(c.n.mins);
    $("[data-now-day]").innerHTML = PERIODS.map(function (x) { return '<li class="' + (x.key === p.key ? "on" : "") + '"><span>' + x.emoji + "</span>" + x.title + "<small>" + fmt(x.from) + "</small></li>"; }).join("");
    var next = PERIODS.filter(function (x) { return x.from > c.n.mins; })[0];
    $("[data-now-next]").textContent = p.key === "closed" ? c.st.long : p.key === "prayer" ? "We reopen at 13:30." : next ? "Next up at " + fmt(next.from) + ": " + next.title + " " + next.emoji : c.st.long;
    if (p.key === lastKey && !force) return;
    lastKey = p.key;
    root.setAttribute("data-period", p.key);
    $("[data-now-emoji]").textContent = p.emoji;
    $("[data-now-title]").innerHTML = '<span class="fire-text">' + p.title.split(" ")[0] + "</span> " + p.title.split(" ").slice(1).join(" ");
    $("[data-now-text]").textContent = p.text;
    var cards = p.picks.map(function (x) { return U.find(M, x[0], x[1]); }).filter(Boolean);
    $("[data-now-grid]").innerHTML = cards.map(function (f, i) {
      return '<article class="now-card" style="--i:' + i + '">' + U.thumb(f.entry, "") +
        '<div><a href="dish.html?id=' + f.entry.id + '">' + f.name + "</a><b>" + U.money(f.price) + '</b></div><button class="add-btn" data-now-add="' + f.name + "|" + f.price + '">+ Add</button></article>';
    }).join("") + '<a class="now-card now-cta" href="checkout.html"><span>' + (p.key === "closed" || p.key === "prayer" ? "Schedule an order →" : "Order for pickup →") + "</span></a>";
  }
  root.addEventListener("click", function (e) {
    var b = e.target.closest("[data-now-add]"); if (!b) return;
    var k = b.getAttribute("data-now-add").split("|");
    window.MochachosTray.add(k[0], +k[1]);
    b.textContent = "Added ✓"; b.classList.add("is-done"); setTimeout(function () { b.textContent = "+ Add"; b.classList.remove("is-done"); }, 1400);
  });
  if (window.MochachosMenu) render(true); else document.addEventListener("menu:ready", function () { render(true); }, { once: true });
  setInterval(render, 30000);
})();
