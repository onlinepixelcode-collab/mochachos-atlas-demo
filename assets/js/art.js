/* Mochachos Atlas Road — item illustrations.
   Flat, brand-coloured SVG artwork for menu items that don't have a real photo, so every dish shows
   something that actually looks like it (a milkshake glass, a can, onion rings…) instead of an emoji
   or the wrong photo. Also decides each item's "mood": cold, sweet, fresh or grill. */
(function () {
  "use strict";
  var C = { red: "#db342e", redD: "#b7201b", yel: "#f5c000", teal: "#00a7b5", cob: "#2f78c4", ink: "#2e1c0d", cream: "#fbf6ec", white: "#ffffff", gold: "#e9a23b", goldD: "#c97c1e", brown: "#7a4a25", green: "#4caf50", greenD: "#2e7d32", leaf: "#7cc243" };
  var SHAKE = { chocolate: ["#6b3e26", "#8a5434"], strawberry: ["#f47ca0", "#ff9fbb"], banana: ["#f4d35e", "#ffe48a"], bubblegum: ["#7ec8f0", "#ff9fd2"], lime: ["#8fd14f", "#b6e57a"] };
  var FREEZO = { coffee: ["#8b5a3c", "#b07a52"], "toffee caramel": ["#c98a3c", "#e0a95a"], "white chocolate": ["#efe3cf", "#fff6e6"] };
  var DIP = { salsa: "#e2442f", guacamole: "#7cb342", "peri-mayo": "#f2a65a", "sweet chilli": "#ff6b3d", "sour cream": "#fffaf0", chocolate: "#5a3220", caramel: "#d08a2c" };
  var shadow = '<ellipse cx="100" cy="146" rx="62" ry="7" fill="#000" opacity=".12"/>';
  var ice = function (x, y) { return '<rect x="' + x + '" y="' + y + '" width="16" height="14" rx="3" fill="#fff" opacity=".75" transform="rotate(12 ' + (x + 8) + " " + (y + 7) + ')"/>'; };
  var bubbles = function (x0, x1, y0, y1, n) { var s = ""; for (var i = 0; i < n; i++) { var x = x0 + ((i * 37) % (x1 - x0)), y = y0 + ((i * 53) % (y1 - y0)), r = 1.5 + (i % 3); s += '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff" opacity=".6"/>'; } return s; };
  var drops = '<circle cx="74" cy="78" r="3" fill="#fff" opacity=".7"/><circle cx="80" cy="96" r="2" fill="#fff" opacity=".6"/><circle cx="122" cy="88" r="2.5" fill="#fff" opacity=".6"/>';
  var glass = function (fill, top, extra) {
    return shadow + '<path d="M66 40h68l-8 100H74z" fill="#e8f6fb" opacity=".55" stroke="#bfe3ee" stroke-width="2"/>' +
      '<path d="M69 ' + top + 'h62l-6.4 ' + (140 - top - 4) + 'H75.4z" fill="' + fill + '"/>' + (extra || "") +
      '<path d="M74 46l6 88" stroke="#fff" stroke-width="4" opacity=".45" stroke-linecap="round"/>' + drops;
  };
  var straw = function (col) { return '<path d="M112 14l-8 60" stroke="' + (col || C.red) + '" stroke-width="7" stroke-linecap="round"/><path d="M112 14l-8 60" stroke="#fff" stroke-width="7" stroke-dasharray="6 6" stroke-linecap="round" opacity=".7"/>'; };
  var ART = {
    can: function () { return shadow + '<rect x="72" y="34" width="56" height="106" rx="10" fill="' + C.red + '"/><rect x="72" y="34" width="56" height="14" rx="7" fill="#d9dde2"/><rect x="72" y="126" width="56" height="14" rx="7" fill="#c7ccd2"/><path d="M80 70c14-10 26 10 40 0v26c-14 10-26-10-40 0z" fill="#fff"/><rect x="80" y="52" width="6" height="66" rx="3" fill="#fff" opacity=".35"/>' + bubbles(78, 124, 40, 136, 6); },
    bottle: function (big) { var s = big ? 1.18 : 1; return shadow + '<g transform="translate(100 140) scale(' + s + ') translate(-100 -140)"><path d="M90 20h20v14c0 8 14 14 14 32v66a8 8 0 0 1-8 8H84a8 8 0 0 1-8-8V66c0-18 14-24 14-32z" fill="#3a1d12"/><rect x="88" y="12" width="24" height="12" rx="3" fill="' + C.red + '"/><rect x="76" y="78" width="48" height="30" fill="' + C.red + '"/><path d="M80 94c10-6 20 6 40 0" stroke="#fff" stroke-width="4" fill="none"/><rect x="82" y="40" width="5" height="90" rx="2.5" fill="#fff" opacity=".25"/></g>'; },
    water: function (o) { var sp = o && /sparkling/i.test(o); return shadow + '<path d="M90 22h20v12c0 6 12 12 12 26v72a8 8 0 0 1-8 8H86a8 8 0 0 1-8-8V60c0-14 12-20 12-26z" fill="#d6f1fb" stroke="#9fd8ec" stroke-width="2"/><rect x="88" y="12" width="24" height="12" rx="3" fill="' + C.cob + '"/><rect x="78" y="78" width="44" height="26" fill="' + C.cob + '"/><path d="M90 91h20" stroke="#fff" stroke-width="3"/>' + (sp ? bubbles(84, 116, 40, 132, 9) : "") + '<rect x="84" y="40" width="5" height="88" rx="2.5" fill="#fff" opacity=".6"/>'; },
    appletiser: function (o) { var g = o && /grape/i.test(o); var c = g ? "#7b2d5b" : "#3f8f3a"; return shadow + '<path d="M92 18h16v16c0 8 12 12 12 28v70a8 8 0 0 1-8 8H88a8 8 0 0 1-8-8V62c0-16 12-20 12-28z" fill="' + c + '"/><rect x="90" y="10" width="20" height="12" rx="3" fill="' + C.yel + '"/><rect x="80" y="76" width="40" height="28" fill="#f3efe2"/><circle cx="100" cy="90" r="8" fill="' + (g ? "#9b3c74" : "#7cc243") + '"/>' + bubbles(84, 116, 40, 70, 4); },
    juicebox: function () { return shadow + '<path d="M70 50l20-12 40 0v102H70z" fill="' + C.yel + '"/><path d="M90 38h40l-20 12H70z" fill="#ffd84d"/><rect x="70" y="50" width="40" height="90" fill="#f0a500"/><circle cx="90" cy="92" r="14" fill="#ff8a00"/><path d="M84 88c4-6 10-6 12 0" stroke="#fff" stroke-width="3" fill="none"/><path d="M118 38l6-22" stroke="' + C.red + '" stroke-width="5" stroke-linecap="round"/>'; },
    icedtea: function (o, name) { var peach = /peach/i.test(name || ""); return glass(peach ? "#f0a35a" : "#d98a2b", 56, ice(80, 60) + ice(102, 70) + ice(90, 86) + bubbles(78, 122, 96, 134, 5) + '<circle cx="124" cy="46" r="15" fill="' + (peach ? "#ffb27a" : "#f6e05e") + '" stroke="' + (peach ? "#f08a4b" : "#e0c23a") + '" stroke-width="3"/><path d="M124 34v24M112 46h24" stroke="#fff" stroke-width="2" opacity=".8"/>') + straw(C.teal); },
    gingerbeer: function () { return glass("#c88a3a", 52, '<rect x="69" y="50" width="62" height="10" fill="#fff4dc" opacity=".9"/>' + bubbles(78, 122, 64, 136, 12) + ice(84, 70) + ice(104, 84)); },
    lemonade: function () { return glass("#f6e88a", 54, ice(80, 62) + ice(104, 72) + ice(90, 90) + bubbles(78, 122, 96, 136, 8) + '<circle cx="124" cy="44" r="15" fill="#f6e05e" stroke="#e0c23a" stroke-width="3"/><path d="M124 32v24M112 44h24M116 36l16 16M132 36l-16 16" stroke="#fff" stroke-width="1.6" opacity=".8"/>') + straw(C.yel); },
    milkshake: function (o) { var k = (o || "strawberry").toLowerCase(), c = SHAKE[k] || SHAKE.strawberry; return shadow + '<path d="M70 52h60l-8 88H78z" fill="' + c[0] + '"/><path d="M72 62h56" stroke="' + c[1] + '" stroke-width="6" opacity=".7"/><path d="M64 52c0-12 10-14 16-14 2-10 12-14 20-12 8-6 22-2 24 8 8 0 14 8 12 18z" fill="#fffaf2"/><circle cx="100" cy="24" r="8" fill="' + C.red + '"/><path d="M100 16c2-6 6-8 10-8" stroke="' + C.greenD + '" stroke-width="2.5" fill="none"/>' + straw(C.teal) + '<path d="M78 60l5 74" stroke="#fff" stroke-width="4" opacity=".35" stroke-linecap="round"/>'; },
    freezo: function (o) { var k = (o || "coffee").toLowerCase(), c = FREEZO[k] || FREEZO.coffee; return shadow + '<path d="M72 54h56l-7 86H79z" fill="#eaf6fb" opacity=".7" stroke="#bfe3ee" stroke-width="2"/><path d="M74 62h52l-6 74H80z" fill="' + c[0] + '"/><path d="M76 80h48M78 104h44" stroke="' + c[1] + '" stroke-width="4" opacity=".7"/><path d="M68 54c0-10 10-12 16-12 2-8 12-12 18-10 8-4 20 0 22 8 6 0 12 6 10 14z" fill="#fffaf2"/><path d="M84 40c6 4 12 4 18 0s12-4 18 0" stroke="' + c[0] + '" stroke-width="3" fill="none"/><path d="M110 12l-6 50" stroke="' + C.cob + '" stroke-width="7" stroke-linecap="round"/>'; },
    churros: function () { var s = shadow + '<ellipse cx="100" cy="126" rx="58" ry="14" fill="#fff" stroke="#e6d6bf" stroke-width="2"/>'; [[64, -24], [82, -12], [100, 0], [118, 12]].forEach(function (p, i) { s += '<g transform="rotate(' + p[1] + ' ' + p[0] + ' 120)"><rect x="' + (p[0] - 8) + '" y="34" width="16" height="88" rx="8" fill="' + C.gold + '"/><path d="M' + (p[0] - 4) + ' 40v76M' + p[0] + ' 40v76M' + (p[0] + 4) + ' 40v76" stroke="' + C.goldD + '" stroke-width="1.6"/>' + bubbles(p[0] - 6, p[0] + 6, 42, 110, 4) + "</g>"; }); return s + '<ellipse cx="146" cy="116" rx="18" ry="7" fill="#5a3220"/><path d="M128 116v12c0 6 36 6 36 0v-12" fill="#fff" stroke="#e6d6bf" stroke-width="2"/>'; },
    dip: function (o, name) { var k = /caramel/i.test(name || "") ? "caramel" : /chocolate/i.test(name || "") ? "chocolate" : (o || "salsa").toLowerCase(); var c = DIP[k] || DIP.salsa; return shadow + '<ellipse cx="100" cy="74" rx="44" ry="14" fill="' + c + '"/><path d="M56 74v40c0 14 88 14 88 0V74" fill="#fff" stroke="#e6d6bf" stroke-width="2"/><ellipse cx="100" cy="74" rx="44" ry="14" fill="none" stroke="#e6d6bf" stroke-width="2"/><path d="M80 72c8-6 20-6 30 0" stroke="#fff" stroke-width="3" opacity=".5" fill="none"/>'; },
    dipz: function () { var s = shadow; [["#e2442f", 58], ["#7cb342", 100], ["#f2a65a", 142]].forEach(function (d) { s += '<ellipse cx="' + d[1] + '" cy="96" rx="20" ry="7" fill="' + d[0] + '"/><path d="M' + (d[1] - 20) + ' 96v22c0 8 40 8 40 0V96" fill="#fff" stroke="#e6d6bf" stroke-width="2"/>'; }); return s; },
    salad: function (o, name) { var n = (name || "").toLowerCase(), slaw = /coleslaw/.test(n), greek = /greek/.test(n), chick = /chicken/.test(n); var s = shadow + '<path d="M34 80h132c0 40-30 62-66 62S34 120 34 80z" fill="#fff" stroke="#e6d6bf" stroke-width="2"/>'; if (slaw) { for (var i = 0; i < 16; i++) s += '<path d="M' + (50 + i * 6) + ' ' + (78 - (i % 3) * 4) + 'q8 -10 16 0" stroke="' + (i % 3 ? "#f5f1e6" : "#f39c43") + '" stroke-width="4" fill="none" stroke-linecap="round"/>'; s += '<path d="M44 80h112" stroke="#f5f1e6" stroke-width="6"/>'; return s; } s += '<path d="M40 82c6-22 22-30 34-22 6-14 26-16 34-4 12-8 30-2 32 12 12 0 22 8 20 14z" fill="' + C.leaf + '"/><path d="M52 78c10-10 22-12 30-6M96 66c8-6 18-6 26 2" stroke="' + C.greenD + '" stroke-width="3" fill="none"/>'; s += '<circle cx="78" cy="70" r="8" fill="' + C.red + '"/><circle cx="124" cy="72" r="7" fill="' + C.red + '"/>'; if (greek) s += '<rect x="96" y="62" width="12" height="12" rx="2" fill="#fff"/><rect x="62" y="64" width="10" height="10" rx="2" fill="#fff"/><circle cx="110" cy="80" r="5" fill="#2b2b2b"/><circle cx="90" cy="76" r="4.5" fill="#2b2b2b"/>'; if (chick) s += '<path d="M88 58l26 6-4 12-26-6z" fill="#c9783a"/><path d="M92 62l18 4" stroke="#7a3f18" stroke-width="2.5"/>'; return s; },
    onionrings: function () { var s = shadow; [[78, 112], [118, 108], [98, 82], [100, 54]].forEach(function (p) { s += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="30" ry="14" fill="none" stroke="' + C.gold + '" stroke-width="12"/><ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="30" ry="14" fill="none" stroke="' + C.goldD + '" stroke-width="2" stroke-dasharray="3 5"/>'; }); return s; },
    rice: function (o, name) { var chick = /chicken/i.test(name || ""); var s = shadow + '<path d="M38 84h124c0 34-26 56-62 56S38 118 38 84z" fill="#fff" stroke="#e6d6bf" stroke-width="2"/><path d="M42 86c4-20 30-28 58-26s52 8 58 26z" fill="#f2c94c"/>'; for (var i = 0; i < 22; i++) s += '<ellipse cx="' + (52 + (i * 41) % 96) + '" cy="' + (70 + (i * 17) % 14) + '" rx="3.5" ry="1.6" fill="#fff6c7"/>'; s += '<circle cx="76" cy="74" r="3" fill="' + C.red + '"/><circle cx="118" cy="76" r="3" fill="' + C.greenD + '"/>'; if (chick) s += '<path d="M84 60l20-4 6 10-20 6z" fill="#c9783a"/><path d="M106 58l18 2 0 10-18-2z" fill="#b8692e"/>'; return s; },
    pap: function () { return shadow + '<ellipse cx="100" cy="112" rx="70" ry="24" fill="#fff" stroke="#e6d6bf" stroke-width="2"/><path d="M52 108c0-30 22-44 48-44s48 14 48 44z" fill="#fbf8ef"/><path d="M60 108c10-8 34-12 50-6 12 4 24 4 36 0-6 14-28 20-48 18s-34-6-38-12z" fill="' + C.red + '"/><circle cx="92" cy="106" r="3" fill="#ffb199"/>'; },
    sauce: function () { return shadow + '<path d="M86 30h28l6 10v92a8 8 0 0 1-8 8H88a8 8 0 0 1-8-8V40z" fill="' + C.red + '"/><path d="M94 14h12l2 16H92z" fill="' + C.yel + '"/><rect x="82" y="70" width="36" height="30" rx="4" fill="#fff"/><path d="M90 86c4-6 8-6 10 0s8 6 10 0" stroke="' + C.red + '" stroke-width="3" fill="none"/>'; },
    bun: function () { return shadow + '<path d="M44 104c0-34 26-52 56-52s56 18 56 52z" fill="#e8a64e"/><rect x="44" y="104" width="112" height="22" rx="10" fill="#d48f3a"/>' + (function () { var s = ""; for (var i = 0; i < 14; i++) s += '<ellipse cx="' + (62 + (i * 29) % 76) + '" cy="' + (66 + (i * 13) % 30) + '" rx="3" ry="1.6" fill="#fff4dc"/>'; return s; })(); },
    extra: function (o, name) { var feta = /feta/i.test(name || ""); if (feta) return shadow + '<rect x="58" y="70" width="34" height="34" rx="4" fill="#fffdf6" stroke="#e6d6bf" stroke-width="2"/><rect x="100" y="78" width="30" height="30" rx="4" fill="#fffdf6" stroke="#e6d6bf" stroke-width="2"/><rect x="82" y="104" width="28" height="28" rx="4" fill="#fffdf6" stroke="#e6d6bf" stroke-width="2"/>'; return shadow + '<path d="M40 64h70l-8 64H32z" fill="#ffc93c"/><circle cx="56" cy="88" r="6" fill="#f0b020"/><circle cx="84" cy="108" r="5" fill="#f0b020"/><circle cx="142" cy="100" r="30" fill="#ffd84d" stroke="#e8b400" stroke-width="5"/><circle cx="142" cy="100" r="9" fill="#fff4cc"/>'; },
    wedges: function () { var s = shadow + '<path d="M66 64h68l-12 76H78z" fill="' + C.red + '"/><path d="M70 80h60" stroke="#fff" stroke-width="4"/>'; [[80, -16], [94, -6], [108, 6], [120, 16]].forEach(function (p) { s += '<path d="M' + p[0] + ' 72l8-46 10 4-6 44z" fill="' + C.gold + '" stroke="' + C.goldD + '" stroke-width="2" transform="rotate(' + p[1] + ' ' + p[0] + ' 72)"/>'; }); return s; },
    loadedchips: function () { var s = shadow + '<ellipse cx="100" cy="120" rx="66" ry="18" fill="#fff" stroke="#e6d6bf" stroke-width="2"/>'; for (var i = 0; i < 14; i++) s += '<rect x="' + (50 + (i * 23) % 96) + '" y="' + (80 + (i * 11) % 30) + '" width="10" height="38" rx="3" fill="#f4c542" transform="rotate(' + ((i * 37) % 70 - 35) + ' ' + (55 + (i * 23) % 96) + ' 110)"/>'; s += '<path d="M54 98c12-12 26 6 40-4s30 8 52-2c-4 14-30 20-50 18s-36-4-42-12z" fill="#ffcf3f" opacity=".95"/><circle cx="76" cy="96" r="6" fill="' + C.green + '"/><circle cx="76" cy="96" r="2.5" fill="#cdeab0"/><circle cx="118" cy="94" r="6" fill="' + C.green + '"/><circle cx="118" cy="94" r="2.5" fill="#cdeab0"/>'; return s; },
    strips: function () { var s = shadow + '<ellipse cx="100" cy="120" rx="68" ry="18" fill="#fff" stroke="#e6d6bf" stroke-width="2"/>'; [[62, -20], [86, -8], [110, 6], [132, 18]].forEach(function (p) { s += '<path d="M' + (p[0] - 10) + ' 116c-2-30 2-56 10-66 8 10 12 36 10 66z" fill="#d98a2b" transform="rotate(' + p[1] + ' ' + p[0] + ' 116)"/>' + '<path d="M' + (p[0] - 4) + ' 100l6-4M' + (p[0] - 3) + ' 84l6-4M' + (p[0] - 2) + ' 68l5-3" stroke="#b8681a" stroke-width="2" transform="rotate(' + p[1] + ' ' + p[0] + ' 116)"/>'; }); return s + '<ellipse cx="150" cy="112" rx="14" ry="5" fill="#f2a65a"/><path d="M136 112v8c0 5 28 5 28 0v-8" fill="#fff" stroke="#e6d6bf" stroke-width="2"/>'; },
    nuggets: function () { var s = shadow + '<ellipse cx="100" cy="122" rx="66" ry="16" fill="#fff" stroke="#e6d6bf" stroke-width="2"/>'; [[70, 104], [100, 98], [130, 104], [86, 82], [116, 82]].forEach(function (p) { s += '<path d="M' + (p[0] - 18) + ' ' + p[1] + 'c0-14 8-20 18-20s18 6 18 18c0 10-8 14-18 14s-18-4-18-12z" fill="#d98a2b"/><circle cx="' + (p[0] - 4) + '" cy="' + (p[1] - 4) + '" r="2.5" fill="' + C.red + '"/><circle cx="' + (p[0] + 6) + '" cy="' + (p[1] + 2) + '" r="2" fill="' + C.green + '"/>'; }); return s; },
    mozz: function () { var s = shadow + '<ellipse cx="100" cy="122" rx="66" ry="16" fill="#fff" stroke="#e6d6bf" stroke-width="2"/>'; [[72, -14], [100, 0], [128, 14]].forEach(function (p) { s += '<g transform="rotate(' + p[1] + ' ' + p[0] + ' 116)"><rect x="' + (p[0] - 10) + '" y="48" width="20" height="68" rx="9" fill="#e09a3a"/><rect x="' + (p[0] - 6) + '" y="36" width="12" height="16" rx="5" fill="#fff6d8"/><path d="M' + p[0] + ' 36c-6-10 6-14 0-24" stroke="#fff6d8" stroke-width="5" fill="none" stroke-linecap="round"/></g>'; }); return s; },
    livers: function () { return shadow + '<ellipse cx="96" cy="114" rx="60" ry="22" fill="#2e2e2e"/><ellipse cx="96" cy="110" rx="54" ry="18" fill="#7a2f1d"/><path d="M60 108c8-10 20-10 26 0M86 104c8-8 20-8 26 2M110 110c6-8 16-8 20 2" stroke="#a5452a" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M40 112h-24" stroke="#2e2e2e" stroke-width="8" stroke-linecap="round"/><path d="M136 66c0-18 12-28 26-28s26 10 26 28z" fill="#e8a64e"/><rect x="136" y="66" width="52" height="12" rx="5" fill="#d48f3a"/>'; },
    toastie: function () { return shadow + '<path d="M40 120l60-80 60 80z" fill="#e2a24b"/><path d="M52 116l48-64 48 64z" fill="#f6d9a3"/><path d="M58 112l42-56 42 56z" fill="#f3e9d2"/><path d="M62 108c12-8 26-6 38 0s26 8 38 0" stroke="' + C.leaf + '" stroke-width="7" fill="none"/><path d="M70 100c10 4 20 4 30 0s20-4 30 0" stroke="#d98a2b" stroke-width="6" fill="none"/><path d="M60 88l80 0" stroke="#c97c1e" stroke-width="3" opacity=".5"/>'; },
    fillets: function () { var s = shadow + '<ellipse cx="100" cy="118" rx="70" ry="20" fill="#fff" stroke="#e6d6bf" stroke-width="2"/>'; [[76, -8], [122, 10]].forEach(function (p) { s += '<g transform="rotate(' + p[1] + ' ' + p[0] + ' 100)"><path d="M' + (p[0] - 30) + ' 100c0-22 14-34 30-34s30 12 30 30c0 14-14 18-30 18s-30-4-30-14z" fill="#c9783a"/><path d="M' + (p[0] - 20) + ' 84l36 12M' + (p[0] - 22) + ' 96l40 12M' + (p[0] - 12) + ' 74l30 10" stroke="#5a2a10" stroke-width="4" stroke-linecap="round"/></g>'; }); return s; },
    beefburger: function (o, name) { var lamb = /lamb/i.test(name || ""); return shadow + '<path d="M50 70c0-26 22-40 50-40s50 14 50 40z" fill="#e8a64e"/><rect x="46" y="70" width="108" height="10" rx="4" fill="' + C.leaf + '"/><rect x="48" y="80" width="104" height="10" rx="3" fill="' + C.red + '"/><rect x="46" y="90" width="108" height="22" rx="10" fill="' + (lamb ? "#6b3a26" : "#4a2a1a") + '"/><path d="M56 96h88" stroke="#2e170c" stroke-width="2" opacity=".5"/>' + (/cheese|gourmet|jalap/i.test(name || "") ? '<path d="M50 90h100l-10 10-14-6-14 8-14-8-14 6-14-6z" fill="#ffc93c"/>' : "") + '<path d="M48 112h104v10a10 10 0 0 1-10 10H58a10 10 0 0 1-10-10z" fill="#d48f3a"/>' + (function () { var s = ""; for (var i = 0; i < 10; i++) s += '<ellipse cx="' + (64 + (i * 29) % 72) + '" cy="' + (44 + (i * 13) % 20) + '" rx="3" ry="1.6" fill="#fff4dc"/>'; return s; })(); },
    kidsbox: function (o, name) { var strips = /speedy/i.test(name || ""); return shadow + '<path d="M54 64h92l-8 76H62z" fill="' + C.red + '"/><path d="M54 64l14-14h64l14 14z" fill="' + C.redD + '"/><path d="M84 50c0-16 32-16 32 0" stroke="' + C.yel + '" stroke-width="6" fill="none"/><path d="M100 82l6 12 13 2-10 9 3 13-12-7-12 7 3-13-10-9 13-2z" fill="' + C.yel + '"/>' + (strips ? '<path d="M70 66c-2-18 2-30 8-34 6 6 8 18 6 34z" fill="#d98a2b"/><path d="M122 66c-2-18 2-30 8-34 6 6 8 18 6 34z" fill="#d98a2b"/>' : '<path d="M118 64c0-12 8-18 18-18s18 6 18 18z" fill="#e8a64e"/><rect x="118" y="62" width="36" height="6" rx="3" fill="#6b3a26"/>') + '<rect x="62" y="122" width="76" height="8" rx="4" fill="#fff" opacity=".35"/>'; }
  };

  function typeFor(c, it) {
    var n = it.n.toLowerCase(), id = c.id;
    if (id === "drinks" || /milkshake|freezo/.test(n)) {
      if (/milkshake/.test(n)) return "milkshake";
      if (/freezo/.test(n)) return "freezo";
      if (/^cans/.test(n)) return "can";
      if (/buddy/.test(n)) return "bottle";
      if (/1\.5/.test(n)) return "bottle-big";
      if (/water/.test(n)) return "water";
      if (/appletiser|grapetiser/.test(n)) return "appletiser";
      if (/cappy/.test(n)) return "juicebox";
      if (/ice tea/.test(n)) return "icedtea";
      if (/ginger/.test(n)) return "gingerbeer";
      if (/lemonade/.test(n)) return "lemonade";
      return "can";
    }
    if (/churro/.test(n)) return "churros";
    if (/dip$/.test(n) && id === "desserts") return "dip";
    if (id === "salads") return /feta/.test(n) ? "extra" : "salad";
    if (id === "kids") return "kidsbox";
    if (/onion ring/.test(n)) return "onionrings";
    if (/mexican rice|pieces with rice/.test(n)) return "rice";
    if (/pap & mexican sauce$/.test(n) && id === "sides") return "pap";
    if (/mochachos sauces/.test(n)) return "sauce";
    if (/^dipz/.test(n)) return "dipz";
    if (/^bun$/.test(n)) return "bun";
    if (/extra slice/.test(n)) return "extra";
    if (/wedges/.test(n)) return "wedges";
    if (/loaded chips/.test(n)) return "loadedchips";
    if (/strip/.test(n) && !/burger/.test(n)) return "strips";
    if (/nugget/.test(n)) return "nuggets";
    if (/mozzarella/.test(n)) return "mozz";
    if (/liver/.test(n)) return "livers";
    if (/toasted/.test(n)) return "toastie";
    if (/fillets & a side/.test(n)) return "fillets";
    if (/beef burger|lamb burger/.test(n)) return "beefburger";
    return null;
  }
  // which feeling an item's page should have
  function moodFor(c, it) {
    var n = it.n.toLowerCase();
    if (c.id === "drinks" || /milkshake|freezo/.test(n)) return "cold";
    if (c.id === "desserts") return "sweet";
    if (c.id === "salads" || /coleslaw|salad/.test(n)) return "fresh";
    return "grill";
  }
  function svg(type, opt, name, cls) {
    var key = type === "bottle-big" ? "bottle" : type;
    var f = ART[key]; if (!f) return "";
    var body = type === "bottle-big" ? f(true) : f(opt, name);
    return '<svg class="art ' + (cls || "") + '" viewBox="0 0 200 160" role="img" aria-label="' + (name || type).replace(/"/g, "") + '" xmlns="http://www.w3.org/2000/svg">' + body + "</svg>";
  }
  window.MochachosArt = { svg: svg, typeFor: typeFor, moodFor: moodFor, shakeColors: SHAKE };
})();
