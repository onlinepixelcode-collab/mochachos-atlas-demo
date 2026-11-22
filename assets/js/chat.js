/* "Ask Amigo" — AI helper for Mochachos Atlas Road.
   Talks to /api/chat (Claude with tools: show_items, add_to_tray). When that endpoint isn't
   available it answers from the built-in store facts and menu, and can still add to the tray.
   The conversation is kept for the browser session, so it follows the customer between pages. */
(function () {
  "use strict";
  var launch = document.querySelector(".chat-launch");
  var panel = document.getElementById("chat");
  if (!launch || !panel) return;
  var log = panel.querySelector(".chat-log");
  var form = panel.querySelector(".chat-form");
  var input = panel.querySelector("#chat-input");
  var sugg = panel.querySelector(".chat-suggest");
  var mic = panel.querySelector("[data-chat-mic]");
  var KEY = "mochachos-amigo";
  var page = document.body.getAttribute("data-page") || "index";
  var state = { msgs: [] };
  var busy = false;
  try { state = JSON.parse(sessionStorage.getItem(KEY)) || state; } catch (e) {}
  var save = function () { try { sessionStorage.setItem(KEY, JSON.stringify({ msgs: state.msgs.slice(-40) })); } catch (e) {} };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var money = function (n) { return "R" + n.toFixed(2); };
  var menuReady = function (cb) { if (window.MochachosMenu) cb(); else document.addEventListener("menu:ready", cb, { once: true }); };

  var SUGGEST = {
    index: ["Are you open now?", "What's good for 4 people?", "Add a 1/2 chicken combo", "How hot is Dynamite?"],
    menu: ["What's your cheapest meal?", "Recommend a burger", "What's in a Family Fiesta?", "Add 2 chicken burritos"],
    dishes: ["Show me veggie options", "Meals under R60?", "Most popular dish?", "Add a Nacho Crunch burger"],
    dish: ["Is this spicy?", "What goes well with it?", "Any veggie options?", "What's in my tray?"],
    order: ["What's in my tray?", "Food for 10 people?", "Do you deliver?", "Add 8 BBQ wings & chips"],
    groups: ["Food for 15 people?", "Family Treat or Family Fiesta?", "Can we book the long table?", "Add a Family Treat"],
    visit: ["Where do I park?", "Are you open now?", "Is it halaal?", "How do I order in the 3D store?"],
    about: ["When did Mochachos start?", "Is everything halaal?", "Which countries are you in?", "What's your best seller?"]
  };

  /* ---------- rendering ---------- */
  function bubble(m) {
    var d = document.createElement("div");
    d.className = "msg " + (m.role === "user" ? "user" : "bot");
    d.textContent = m.text;
    log.appendChild(d);
    if (m.cards && m.cards.length) {
      var wrap = document.createElement("div");
      wrap.className = "chat-cards";
      wrap.innerHTML = m.cards.map(function (c) {
        return '<div class="chat-card">' + (c.img ? '<img src="assets/img/' + c.img + '" alt="">' : '<span class="emoji-tile">' + (c.emoji || "🌶") + "</span>") +
          '<div><a href="dish.html?id=' + esc(c.id) + '">' + esc(c.name) + "</a><b>" + money(c.price) + '</b></div><button data-chat-add="' + esc(c.name) + "|" + c.price + '">+ Add</button></div>';
      }).join("");
      log.appendChild(wrap);
    }
    if (m.added && m.added.length) {
      var a = document.createElement("div");
      a.className = "chat-added";
      a.innerHTML = "✓ Added to tray: " + m.added.map(function (x) { return esc(x.qty + "× " + x.name); }).join(", ") + ' <button data-chat-tray>View tray</button>';
      log.appendChild(a);
    }
    log.scrollTop = log.scrollHeight;
  }
  function push(m) { state.msgs.push(m); save(); bubble(m); }
  function renderAll() { log.innerHTML = ""; state.msgs.forEach(bubble); }
  function suggestions() {
    var list = SUGGEST[page] || SUGGEST.index;
    sugg.innerHTML = list.map(function (t) { return "<button>" + esc(t) + "</button>"; }).join("");
  }

  function open() {
    panel.hidden = false;
    launch.setAttribute("aria-expanded", "true");
    if (!state.msgs.length) push({ role: "bot", text: "Ola! I'm Amigo, the AI helper for Mochachos Atlas Road. Ask me about the menu, prices, hours or halaal, or tell me what to add to your tray." });
    else renderAll();
    suggestions();
    setTimeout(function () { input.focus(); }, 50);
  }
  function close() { panel.hidden = true; launch.setAttribute("aria-expanded", "false"); launch.focus(); }
  launch.addEventListener("click", open);
  panel.querySelector(".chat-close").addEventListener("click", close);
  var clearBtn = panel.querySelector("[data-chat-clear]");
  if (clearBtn) clearBtn.addEventListener("click", function () { state.msgs = []; save(); log.innerHTML = ""; push({ role: "bot", text: "Fresh start! What can I get you, amigo?" }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) close(); });
  sugg.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) send(b.textContent); });
  form.addEventListener("submit", function (e) { e.preventDefault(); var q = input.value.trim(); if (q) send(q); });
  log.addEventListener("click", function (e) {
    var b = e.target.closest("[data-chat-add]");
    if (b) { var k = b.getAttribute("data-chat-add").split("|"); window.MochachosTray && window.MochachosTray.add(k[0], +k[1]); b.textContent = "Added ✓"; b.disabled = true; }
    if (e.target.closest("[data-chat-tray]") && window.MochachosTray) { close(); window.MochachosTray.open(); }
  });

  /* ---------- voice input ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (mic) {
    if (!SR) mic.hidden = true;
    else {
      var rec = new SR(); rec.lang = "en-ZA"; rec.interimResults = true; rec.maxAlternatives = 1;
      var listening = false;
      var stop = function () { listening = false; mic.classList.remove("is-on"); mic.setAttribute("aria-pressed", "false"); input.placeholder = "Ask, or say “add 2 burritos”…"; try { rec.stop(); } catch (e) {} };
      rec.onresult = function (e) {
        var t = ""; for (var i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
        input.value = t;
        if (e.results[e.results.length - 1].isFinal) { stop(); if (t.trim()) send(t.trim()); }
      };
      rec.onerror = rec.onend = function () { if (listening) stop(); };
      mic.addEventListener("click", function () {
        if (listening) return stop();
        listening = true; mic.classList.add("is-on"); mic.setAttribute("aria-pressed", "true"); input.value = ""; input.placeholder = "Listening…";
        try { rec.start(); } catch (e) { stop(); }
      });
    }
  }

  /* ---------- helpers that touch the menu and tray ---------- */
  function cardsFor(list) {
    var U = window.MochachosMenuUtil, M = window.MochachosMenu;
    if (!U || !M) return [];
    var seen = {};
    return list.map(function (i) { return U.find(M, i.name, i.option); }).filter(function (f) {
      if (!f || seen[f.name]) return false; seen[f.name] = 1; return true;
    }).map(function (f) { return { id: f.entry.id, name: f.name, price: f.price, img: f.entry.img, emoji: f.entry.emoji }; });
  }
  function applyAdds(list) {
    var U = window.MochachosMenuUtil, M = window.MochachosMenu, done = [];
    if (!U || !M || !window.MochachosTray) return done;
    list.forEach(function (a) {
      var f = U.find(M, a.name, a.option);
      if (!f) return;
      var q = Math.max(1, Math.min(20, a.qty || 1));
      window.MochachosTray.add(f.name, f.price, q);
      done.push({ name: f.name, qty: q, price: f.price });
    });
    return done;
  }

  /* ---------- send ---------- */
  function send(q) {
    if (busy) return;
    if (panel.hidden) open();
    busy = true;
    input.value = "";
    push({ role: "user", text: q });
    var typing = document.createElement("div");
    typing.className = "msg bot typing"; typing.innerHTML = "<i></i><i></i><i></i>"; typing.setAttribute("aria-label", "Amigo is typing");
    log.appendChild(typing); log.scrollTop = log.scrollHeight;

    var history = state.msgs.filter(function (m) { return m.text; }).slice(-12).map(function (m) { return { role: m.role === "user" ? "user" : "assistant", content: m.text }; });
    var ctrl = "AbortController" in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    var status = window.MochachosHours ? window.MochachosHours.status().long : "";
    var tray = window.MochachosTray ? window.MochachosTray.items() : [];

    fetch("api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, status: status, page: page, tray: tray }),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) {
        if (!d || (!d.reply && !(d.actions && d.actions.length) && !(d.items && d.items.length))) throw new Error("empty");
        return new Promise(function (res) { menuReady(function () {
          var added = applyAdds((d.actions || []).filter(function (a) { return a.type === "add"; }));
          var text = d.reply || (added.length ? "Done! I've added that to your tray." : "Here you go:");
          res({ role: "bot", text: text, cards: cardsFor(d.items || []), added: added });
        }); });
      })
      .catch(function () { return new Promise(function (res) { menuReady(function () { res(local(q)); }); }); })
      .then(function (m) {
        clearTimeout(timer);
        typing.remove();
        push(m);
        busy = false;
      });
  }
  window.MochachosChat = { ask: function (q) { open(); send(q); } };

  /* ---------- built-in brain (works without the server) ---------- */
  var NUM = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  function has(q, words) { return words.some(function (w) { return q.indexOf(w) > -1; }); }
  function lookup(q, max) {
    var M = window.MochachosMenu, U = window.MochachosMenuUtil;
    if (!M || !U) return [];
    var stop = { the: 1, and: 1, how: 1, much: 1, price: 1, cost: 1, for: 1, with: 1, what: 1, does: 1, you: 1, have: 1, get: 1, can: 1, should: 1, want: 1, some: 1, any: 1, your: 1, are: 1, there: 1, show: 1, tell: 1, about: 1, add: 1, order: 1, please: 1, me: 1, my: 1, tray: 1, recommend: 1, good: 1, best: 1, is: 1, it: 1, this: 1 };
    var words = q.replace(/[^a-z0-9/ ]/g, " ").split(/\s+/).filter(function (w) { return w.length > 2 && !stop[w]; }).map(function (w) { return w.replace(/s$/, ""); });
    if (!words.length) return [];
    var scored = [];
    U.all(M).forEach(function (x) {
      var name = x.item.n.toLowerCase();
      var score = words.reduce(function (s, w) {
        var re = new RegExp("(^|[^a-z])" + w.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&"));
        return s + (re.test(name) ? 2 : (re.test(x.cat.name.toLowerCase()) ? 0.6 : 0));
      }, 0);
      if (score >= 2) scored.push({ x: x, s: score - name.length / 200 });
    });
    scored.sort(function (a, b) { return b.s - a.s; });
    return scored.slice(0, max || 3).map(function (o) { return o.x; });
  }
  function toCards(list) {
    return list.map(function (x) { var p = x.item.p[0]; return { id: x.id, name: x.item.n + (p[0] ? " (" + p[0] + ")" : ""), price: p[1], img: x.img, emoji: x.emoji }; });
  }
  function byName(names) {
    var U = window.MochachosMenuUtil, M = window.MochachosMenu;
    return names.map(function (n) { var f = U.find(M, n[0], n[1]); return f && { id: f.entry.id, name: f.name, price: f.price, img: f.entry.img, emoji: f.entry.emoji }; }).filter(Boolean);
  }
  function parseAdds(q) {
    var U = window.MochachosMenuUtil, M = window.MochachosMenu;
    var body = q.replace(/^.*?\b(add|order|i'?ll have|i'?ll take|i want|get me|give me|i'?d like|can i get|can i have)\b/i, "").replace(/\b(to|in|into) (my |the )?tray\b|\bplease\b/gi, "");
    var parts = body.split(/,| and | plus /i).map(function (s) { return s.trim(); }).filter(Boolean);
    var out = [], missing = [];
    parts.forEach(function (p) {
      var m = p.match(/^(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten)\s*x?\s+(.*)$/i);
      var qty = 1, name = p;
      if (m) { qty = /^\d+$/.test(m[1]) ? +m[1] : NUM[m[1].toLowerCase()]; name = m[2]; }
      var opt = (name.match(/\b(rump steak|rump|single|double|beegest|beeger|beeg)\b/i) || [])[1];
      if (!opt && /\b(burrito|quesadilla|fajita|chimichanga|enchilada|nachos?)\b/i.test(name)) opt = /\bcheese\b/i.test(name) && /nacho/i.test(name) ? "Cheese" : /chicken/i.test(name) ? "Chicken" : null;
      if (opt && /rump/i.test(opt)) opt = "Rump steak";
      var bare = name.replace(/\b(single|double|beeg|beeger|beegest|rump steak|rump)\b/gi, "").replace(/\s+/g, " ").trim();
      if (/\b(burrito|quesadilla|fajita|chimichanga|enchilada|nachos?)\b/i.test(bare)) bare = bare.replace(/\b(chicken|cheese)\b/gi, "").trim();
      var f = U.find(M, bare, opt) || U.find(M, bare.replace(/s\b/g, ""), opt);
      if (f) out.push({ name: f.entry.item.n, option: f.label, qty: Math.min(20, qty) });
      else missing.push(name);
    });
    return { items: out, missing: missing };
  }

  function local(raw) {
    var q = raw.toLowerCase().trim();
    var st = window.MochachosHours ? window.MochachosHours.status().long + " " : "";
    var tray = window.MochachosTray ? window.MochachosTray.items() : [];

    if (/\b(add|i'?ll have|i'?ll take|get me|give me|i'?d like|can i (get|have))\b/.test(q) || /^order\b/.test(q)) {
      var r = parseAdds(q);
      if (r.items.length) {
        var added = applyAdds(r.items);
        var tot = window.MochachosTray ? window.MochachosTray.total() : 0;
        return { role: "bot", text: "Done! " + (r.missing.length ? "I couldn't find \"" + r.missing.join("\", \"") + "\", but the rest is in. " : "") + "Your tray is now " + money(tot) + ". Call 010 448 0666 or pop in to order.", added: added };
      }
    }
    if (has(q, ["my tray", "in my order", "my order", "what have i"])) {
      if (!tray.length) return { role: "bot", text: "Your tray is empty. Tell me what you feel like, or tap any price on the menu." };
      return { role: "bot", text: "In your tray: " + tray.map(function (t) { return t.qty + "× " + t.name; }).join(", ") + ". Total " + money(window.MochachosTray.total()) + ". Call 010 448 0666 to place it." };
    }
    if (page === "dish" && has(q, ["this", "it "]) && has(q, ["spicy", "go well", "goes well", "veg"])) {
      var cur = document.querySelector("[data-dish] h1");
      if (cur && has(q, ["go well", "goes well"])) return { role: "bot", text: "Great with a side and a cold drink:", cards: byName([["Loaded Chips", "Beeg"], ["Onion Rings", "x6"], ["Lemon Ice Tea", "350ml"]]) };
    }
    if (has(q, ["open", "close", "hour", "time", "today", "tonight", "late", "sunday", "friday", "saturday", "prayer", "jumu"])) {
      return { role: "bot", text: st + "Hours: Mon–Thurs & Sun 10:00–20:00, Fri–Sat 10:00–21:00. We close on Fridays from 12:15 to 13:30 for prayers." };
    }
    if (has(q, ["halaal", "halal", "pork", "muslim"])) return { role: "bot", text: "Yes, Mochachos Atlas Road is 100% halaal, the whole menu." };
    if (has(q, ["park", "where", "address", "location", "direction", "find you", "map"])) return { role: "bot", text: "254 Atlas Road, Beyers Park, Boksburg, on the Sasol forecourt at the corner of Campo St. Park right out front, but please keep the side gate clear." };
    if (has(q, ["3d", "counter", "virtual"])) return { role: "bot", text: "On the Visit page, open the 3D store, then tap the menu boards or the counter (or the \"Order here\" button) and add dishes to your tray." };
    if (has(q, ["deliver", "uber", "mr d", "mrd", "takeaway", "take away", "pick up", "pickup", "collect"])) return { role: "bot", text: "We're on Uber Eats and Mr D. For pick-up, build your tray here and call 010 448 0666; it'll be hot when you arrive." };
    if (has(q, ["phone", "call", "number", "contact", "whatsapp"])) return { role: "bot", text: "Call us on 010 448 0666." };
    if (has(q, ["1994", "start", "history", "founded", "story", "countr", "australia"])) return { role: "bot", text: "The first Mochachos opened in Pretoria in 1994 as Mochachos Steak Villages, one of the first places in SA serving Mexican food. Today there are stores in SA, Botswana, Zambia, Mauritius and Australia." };
    if (has(q, ["kid", "child", "bambino", "toy"])) return { role: "bot", text: "The Bambino Meal is R69.90 with chips, a fruit juice and a free toy:", cards: byName([["José"], ["Speedy"], ["Pedro"]]) };
    if (has(q, ["family", "group", "party", "people", "crew", "share", "feed", "long table", "book"])) {
      var n = parseInt((q.match(/\d+/) || [0])[0], 10);
      if (n >= 7) return { role: "bot", text: "For " + n + " people, start with the Family Treat (two full chickens, two beegest chips, 8 bunz, a beegest salad) and add a Family Fiesta for every extra 4. The planner on the Groups page does the maths for you.", cards: byName([["Family Treat"], ["Family Fiesta"], ["Nachos", "Cheese"]]) };
      return { role: "bot", text: "For 4 to 5 people, the Family Fiesta (R289.90) is a full chicken, beegest chips, a beegest salad and 4 bunz. Want burgers in the mix? Try the Family Variety.", cards: byName([["Family Fiesta"], ["Family Variety"], ["Family Share Meal"]]) };
    }
    if (has(q, ["spicy", "hot", "mild", "chilli", "chili", "flavour", "flavor", "lemon", "dynamite", "heat"])) return { role: "bot", text: "Pick your Zee Flavour: Lemon & Herb (no heat), Mild, Hot, Extra Hot or Dynamite, the hottest on the board. First time? Mild or Hot is the sweet spot." };
    if (has(q, ["veg", "meat-free", "meat free", "vegetarian", "vegan"])) return { role: "bot", text: "Veggie picks: the veggie schwarma, a veggie burrito or chicken burger (ask for the veggie option), and the salads.", cards: byName([["Veggie Schwarma"], ["Greek Salad", "Beeg"], ["Loaded Chips", "Beeg"]]) };
    if (has(q, ["cheap", "budget", "under r", "under ", "affordable"])) {
      var lim = parseInt((q.match(/r?\s?(\d{2,3})/) || [0, 60])[1], 10);
      var list = window.MochachosMenuUtil.all(window.MochachosMenu).filter(function (x) { return x.from <= lim && ["drinks", "sides", "desserts", "salads"].indexOf(x.cat.id) < 0 && !/^(extra|add )/i.test(x.item.n); }).sort(function (a, b) { return a.from - b.from; }).slice(0, 4);
      return list.length ? { role: "bot", text: "Meals for R" + lim + " or less:", cards: toCards(list) } : { role: "bot", text: "Our cheapest meal is the 3 Chicken Strips & Dip at R39.90." };
    }
    if (has(q, ["recommend", "best", "popular", "favourite", "favorite", "should i", "suggest", "what's good", "whats good"])) {
      var FAV = [
        [["burger"], "Our top burgers:", [["Nacho Crunch Gourmet Burger"], ["Jalapeño Cheese Burger", "Single"], ["Chicken Cheese & Pine Burger", "Single"]]],
        [["wing"], "Wing lovers go for:", [["8 Full BBQ Wings & Beeger Chips"], ["4 Full BBQ Wings & Beeg Chips"], ["4 Full BBQ Wings"]]],
        [["mexican", "burrito", "wrap", "taco"], "The Mexican favourites:", [["Burrito", "Chicken"], ["Chimichanga", "Chicken"], ["Nachos", "Chicken"], ["Quesadilla", "Chicken"]]],
        [["chicken", "pollo"], "Flame-grilled favourites:", [["1/2 Chicken, Beeg Chips & Buddy"], ["1/4 Chicken, Beeg Chips & Buddy"], ["Full Chicken"]]],
        [["drink", "shake", "dessert", "sweet"], "Something to finish:", [["Milkshake 350ml"], ["Churros (plain)", "3 churros"], ["Freezo 350ml"]]]
      ];
      for (var fi = 0; fi < FAV.length; fi++) if (has(q, FAV[fi][0])) return { role: "bot", text: FAV[fi][1], cards: byName(FAV[fi][2]) };
    }
    var hit = lookup(q, 3);
    if (hit.length) return { role: "bot", text: hit.length === 1 ? "Here it is (2026 menu price, may change):" : "Here's what I found (2026 menu prices, may change):", cards: toCards(hit) };
    if (has(q, ["menu", "eat", "food", "recommend", "best", "popular", "hungry", "first time", "seller", "favourite"])) return { role: "bot", text: "Can't go wrong with these crowd favourites:", cards: byName([["1/2 Chicken, Beeg Chips & Buddy"], ["Nacho Crunch Gourmet Burger"], ["Burrito", "Chicken"], ["Nachos", "Chicken"]]) };
    if (has(q, ["price", "cost", "how much", "special", "deal", "promo"])) return { role: "bot", text: "Every price is on the Menu and Dishes pages. Specials change, so call 010 448 0666 for today's deals." };
    if (has(q, ["thank", "shot", "cheers"])) return { role: "bot", text: "Pleasure, amigo! Enjoy the fiesta." };
    if (has(q, ["hi", "hello", "hey", "hola", "ola", "salaam", "salam", "howzit"])) return { role: "bot", text: "Ola amigo! Hungry? Ask me anything, or say something like \"add 2 chicken burritos\"." };
    return { role: "bot", text: "I'm not sure about that one. Try asking about a dish or the hours, or say \"add a 1/2 chicken combo\". For anything else, call 010 448 0666." };
  }
})();
