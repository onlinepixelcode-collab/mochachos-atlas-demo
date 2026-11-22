/* Mochachos Atlas Road — site-wide fire effects.
   - Heat dial (top bar): Lemon & Herb → Dynamite, saved for the whole site; drives every flame.
   - Dynamite mode (level 5): flames along the bottom of the screen, embers, heat haze, red glow.
   - Fire sound: a crackle made live with Web Audio (off by default).
   - Burning page transitions between pages. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NAMES = ["Lemon & Herb", "Mild", "Hot", "Extra Hot", "Dynamite"];
  var KEY = "mochachos-heat", SKEY = "mochachos-sound";
  var get = function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
  var put = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var level = Math.min(5, Math.max(1, parseInt(get(KEY, "2"), 10) || 2));
  var root = document.documentElement;
  // cold drinks and shakes get ice, never fire (decided from the address, so it works before the menu loads)
  var isCold = function (u) { return /dish\.html$/.test(u.pathname) && /[?&]id=(drinks-|[^&]*(milkshake|freezo))/.test(u.search); };
  var hereCold = isCold(location);

  /* ---------- screen-edge fire (shown from Extra Hot up) ---------- */
  var edge = document.createElement("div");
  edge.className = "edge-fire";
  edge.setAttribute("aria-hidden", "true");
  edge.innerHTML = '<canvas class="fire-layer" data-fire data-fire-min="4" data-res="0.3" data-smoke="0.3"></canvas><canvas class="ember-layer" data-embers data-fire-min="4"></canvas>';
  document.body.appendChild(edge);
  var glow = document.createElement("div");
  glow.className = "dynamite-glow"; glow.setAttribute("aria-hidden", "true");
  document.body.appendChild(glow);
  if (window.MochachosFire) window.MochachosFire.scan();

  /* ---------- heat haze filter (SVG), used by the hero food and Dynamite headings ---------- */
  if (!document.getElementById("haze")) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "0"); svg.setAttribute("height", "0"); svg.setAttribute("aria-hidden", "true");
    svg.style.position = "absolute";
    svg.innerHTML = '<filter id="haze" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.010 0.045" numOctaves="2" seed="4" result="n">' +
      (reduce ? "" : '<animate attributeName="baseFrequency" dur="5s" values="0.010 0.045;0.014 0.07;0.010 0.045" repeatCount="indefinite"/>') +
      '</feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/></filter>';
    document.body.appendChild(svg);
  }

  /* ---------- heat dial ---------- */
  var host = document.querySelector(".topbar-right");
  var dial = document.createElement("div");
  dial.className = "heat-dial";
  dial.innerHTML = '<button class="heat-btn" aria-expanded="false" aria-haspopup="true"><span class="heat-chillies" aria-hidden="true"></span><span class="heat-name"></span><span class="sr-only"> heat level, change</span></button>' +
    '<div class="heat-pop" hidden><p class="heat-title">Turn up the heat</p><p class="heat-sub">Sets the flames across the whole site.</p>' +
    '<div class="heat-levels" role="radiogroup" aria-label="Heat level">' +
    NAMES.map(function (n, i) { return '<button role="radio" data-level="' + (i + 1) + '"><span>' + MIcon.repeat("chilli", i + 1) + "</span>" + n + "</button>"; }).join("") +
    '</div><label class="toggle heat-sound"><input type="checkbox" data-sound><span></span> Fire sound</label></div>';
  if (host) host.insertBefore(dial, host.firstChild);
  var btn = dial.querySelector(".heat-btn"), pop = dial.querySelector(".heat-pop");
  btn.addEventListener("click", function (e) { e.stopPropagation(); var o = pop.hidden; pop.hidden = !o; btn.setAttribute("aria-expanded", String(o)); });
  document.addEventListener("click", function (e) { if (!dial.contains(e.target)) { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); } });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !pop.hidden) { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); btn.focus(); } });
  dial.querySelector(".heat-levels").addEventListener("click", function (e) { var b = e.target.closest("[data-level]"); if (b) { set(+b.getAttribute("data-level")); pop.hidden = true; btn.setAttribute("aria-expanded", "false"); } });

  var toastShown = false;
  function paint() {
    root.setAttribute("data-heat", level);
    dial.querySelector(".heat-chillies").innerHTML = MIcon.repeat("chilli", level);
    dial.querySelector(".heat-name").textContent = NAMES[level - 1];
    dial.querySelectorAll("[data-level]").forEach(function (b) { b.setAttribute("aria-checked", String(+b.getAttribute("data-level") === level)); });
  }
  function set(l, quiet) {
    var prev = level;
    level = Math.min(5, Math.max(1, l));
    put(KEY, level);
    paint();
    window.dispatchEvent(new CustomEvent("heat", { detail: level }));
    if (level === 5 && prev !== 5 && !quiet && !toastShown) { toastShown = true; toast("Dynamite mode! The whole site is on fire. Turn the heat down any time from the chilli dial at the top."); }
    sound.level(level);
  }
  window.MochachosHeat = { set: set, get: function () { return level; } };

  function toast(msg) {
    var t = document.createElement("div");
    t.className = "fx-toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add("out"); }, 3800);
    setTimeout(function () { t.remove(); }, 4400);
  }

  /* ---------- fire sound (Web Audio, generated live) ---------- */
  var sound = (function () {
    var ctx = null, master = null, rumble = null, on = false, timer = null, lvl = level;
    function start() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      if (!ctx) {
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
        var len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0), last = 0;
        for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
        var src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 600;
        rumble = ctx.createGain(); rumble.gain.value = 0.5;
        src.connect(lp); lp.connect(rumble); rumble.connect(master); src.start();
      }
      ctx.resume();
      on = true;
      master.gain.setTargetAtTime(0.1 + lvl * 0.06, ctx.currentTime, 0.4);
      crackle();
      return true;
    }
    function crackle() {
      if (!on) return;
      var n = 1 + Math.floor(Math.random() * (lvl + 1));
      for (var k = 0; k < n; k++) pop(ctx.currentTime + Math.random() * 0.15);
      timer = setTimeout(crackle, 60 + Math.random() * (520 - lvl * 80));
    }
    function pop(t) {
      var len = 0.004 + Math.random() * 0.02;
      var b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
      var s = ctx.createBufferSource(); s.buffer = b;
      var hp = ctx.createBiquadFilter(); hp.type = "bandpass"; hp.frequency.value = 1200 + Math.random() * 3500; hp.Q.value = 0.8;
      var g = ctx.createGain(); g.gain.value = 0.25 + Math.random() * 0.6;
      s.connect(hp); hp.connect(g); g.connect(master); s.start(t);
    }
    function stop() { on = false; clearTimeout(timer); if (master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.2); }
    return {
      toggle: function (v) { if (v) return start(); stop(); return true; },
      level: function (l) { lvl = l; if (on && master) master.gain.setTargetAtTime(0.1 + lvl * 0.06, ctx.currentTime, 0.4); },
      isOn: function () { return on; }
    };
  })();
  var sbox = dial.querySelector("[data-sound]");
  sbox.addEventListener("change", function () {
    var ok = hereCold ? true : sound.toggle(sbox.checked); // drink pages stay quiet: no crackle next to a cold drink
    if (!ok) { sbox.checked = false; sbox.disabled = true; }
    put(SKEY, sbox.checked ? "1" : "0");
  });
  // browsers only allow sound after a tap, so a saved "on" resumes on the first interaction
  if (get(SKEY, "0") === "1") {
    sbox.checked = true;
    if (hereCold) sbox.dataset.cold = "1";
    var resume = function () { if (!hereCold) sound.toggle(true); document.removeEventListener("pointerdown", resume); document.removeEventListener("keydown", resume); };
    document.addEventListener("pointerdown", resume); document.addEventListener("keydown", resume);
  }
  document.addEventListener("visibilitychange", function () { if (document.hidden && sound.isOn()) { sound.toggle(false); sbox.dataset.paused = "1"; } else if (!document.hidden && sbox.dataset.paused) { delete sbox.dataset.paused; if (sbox.checked) sound.toggle(true); } });

  paint();
  window.dispatchEvent(new CustomEvent("heat", { detail: level }));

  /* ---------- burning page transitions ----------
     Leaving: a wall of live (WebGL) flames surges up and engulfs the screen.
     Arriving: the new page burns through the char like paper, with glowing edges.
     Falls back to the CSS flame wall when WebGL isn't available. */
  var burn = document.createElement("div");
  var BASE = function () { return "burn" + (hereCold ? " ice" : ""); };
  burn.className = BASE(); burn.setAttribute("aria-hidden", "true");
  burn.innerHTML = '<div class="burn-wall"></div><canvas class="burn-gl"></canvas><img class="burn-logo" src="assets/img/logo-horizontal.png" alt="">';
  document.body.appendChild(burn);
  var bcv = burn.querySelector(".burn-gl"), logo = burn.querySelector(".burn-logo");
  var BV = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var BF = [
    "precision mediump float;",
    "uniform vec2 r;uniform float t;uniform float prog;uniform float mode;uniform float ice;",
    "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}",
    "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}",
    "vec3 hot(float f){return vec3(1.,.3,.03)*f*1.45+vec3(1.,.68,.16)*pow(f,2.6)*.95+vec3(1.,.93,.7)*pow(f,9.)*.55;}",
    "vec3 frost(float f){return vec3(.1,.5,.85)*f*1.3+vec3(.55,.88,1.)*pow(f,2.6)*.95+vec3(1.)*pow(f,9.)*.7;}",
    "vec3 fire(float f){return mix(hot(f),frost(f),ice);}",
    "void main(){",
    " vec2 uv=gl_FragCoord.xy/r;float asp=r.x/r.y;vec2 p=vec2(uv.x*asp,uv.y);",
    " float cn=pow(fbm(p*7.+vec2(0.,t*.6)),3.)*1.4;",
    " vec3 ch=mix(vec3(.075,.035,.02)+vec3(.22,.05,0.)*cn,vec3(.03,.08,.14)+vec3(.06,.2,.32)*cn,ice);",
    " vec3 spk=mix(vec3(1.,.7,.3),vec3(.85,.95,1.),ice);",
    " float sp=0.;vec2 g=floor(vec2(p.x*38.,p.y*24.-t*9.));float hh=h(g);",
    " if(hh>.982){vec2 fp=fract(vec2(p.x*38.,p.y*24.-t*9.))-.5;sp=smoothstep(.22,0.,length(fp))*(.6+.4*sin(t*20.+hh*40.));}",
    " if(mode<.5){",
    "  float wob=(fbm(vec2(p.x*2.6,t*1.4))-.5)*.32;",
    "  float front=prog*1.55-.3+wob;",
    "  float d=uv.y-front;",
    "  float q=fbm(vec2(p.x*3.4,p.y*2.4-t*2.6));",
    "  float w=fbm(vec2(p.x*7.,p.y*5.-t*4.)+q);",
    "  float f=clamp(1.-d*3.2+(w-.5)*1.6,0.,1.);f=pow(f,1.4)*step(-.02,d);",
    "  float under=1.-smoothstep(-.06,0.,d);",
    "  float glow=1.-smoothstep(0.,.16,-d);",
    "  vec3 c=mix(fire(f),ch+fire(.5)*glow*.28,under);",
    "  float a=max(under,clamp(f*1.4,0.,1.));",
    "  c+=spk*sp*step(0.,d)*(1.-smoothstep(0.,.5,d));a=max(a,sp*step(0.,d)*.9);",
    "  gl_FragColor=vec4(c,a);",
    " }else{",
    "  float m=fbm(p*2.4+vec2(0.,t*.12))*.85+uv.y*.6+(fbm(p*9.)-.5)*.12;",
    "  float th=prog*1.85-.35;",
    "  float e=m-th;",
    "  if(e<0.){gl_FragColor=vec4(0.);return;}",
    "  float band=1.-smoothstep(0.,.06,e);",
    "  float crisp=1.-smoothstep(0.,.025,e);",
    "  vec3 c=ch+fire(.6)*(1.-smoothstep(0.,.12,e))*.3;",
    "  c=mix(c,fire(.5+.5*band),band);c=mix(c,mix(vec3(1.,.9,.6),vec3(.9,.97,1.),ice),crisp*.6);",
    "  c+=spk*sp*(1.-smoothstep(0.,.3,e));",
    "  gl_FragColor=vec4(c,1.);",
    " }",
    "}"
  ].join("\n");
  var bgl = null, uR, uT, uP, uM, uI, iceMode = hereCold ? 1 : 0;
  function setupGL() {
    try {
      bgl = bcv.getContext("webgl", { premultipliedAlpha: false, alpha: true, antialias: false });
      if (!bgl) return false;
      var sh = function (type, src) { var x = bgl.createShader(type); bgl.shaderSource(x, src); bgl.compileShader(x); return x; };
      var pr = bgl.createProgram();
      bgl.attachShader(pr, sh(bgl.VERTEX_SHADER, BV)); bgl.attachShader(pr, sh(bgl.FRAGMENT_SHADER, BF)); bgl.linkProgram(pr);
      if (!bgl.getProgramParameter(pr, bgl.LINK_STATUS)) { bgl = null; return false; }
      bgl.useProgram(pr);
      var buf = bgl.createBuffer(); bgl.bindBuffer(bgl.ARRAY_BUFFER, buf);
      bgl.bufferData(bgl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), bgl.STATIC_DRAW);
      var loc = bgl.getAttribLocation(pr, "p"); bgl.enableVertexAttribArray(loc); bgl.vertexAttribPointer(loc, 2, bgl.FLOAT, false, 0, 0);
      uR = bgl.getUniformLocation(pr, "r"); uT = bgl.getUniformLocation(pr, "t"); uP = bgl.getUniformLocation(pr, "prog"); uM = bgl.getUniformLocation(pr, "mode"); uI = bgl.getUniformLocation(pr, "ice");
      bgl.enable(bgl.BLEND); bgl.blendFunc(bgl.SRC_ALPHA, bgl.ONE_MINUS_SRC_ALPHA);
      return true;
    } catch (e) { bgl = null; return false; }
  }
  function drawBurn(mode, prog, time) {
    var sc = Math.min(window.devicePixelRatio || 1, 2) * 0.55;
    var w = Math.max(1, Math.round(innerWidth * sc)), hgt = Math.max(1, Math.round(innerHeight * sc));
    if (bcv.width !== w || bcv.height !== hgt) { bcv.width = w; bcv.height = hgt; }
    bgl.viewport(0, 0, w, hgt);
    bgl.clearColor(0, 0, 0, 0); bgl.clear(bgl.COLOR_BUFFER_BIT);
    bgl.uniform2f(uR, w, hgt); bgl.uniform1f(uT, time); bgl.uniform1f(uP, prog); bgl.uniform1f(uM, mode); bgl.uniform1f(uI, iceMode);
    bgl.drawArrays(bgl.TRIANGLE_STRIP, 0, 4);
  }
  // runs the animation; timers back it up so it always finishes, even in a background tab
  function play(mode, dur, done) {
    var t0 = performance.now(), finished = false;
    var ease = mode === 0 ? function (x) { return x * x * (3 - 2 * x); } : function (x) { return 1 - Math.pow(1 - x, 2.2); };
    function step(now) {
      if (finished) return;
      var k = Math.min(1, (now - t0) / dur);
      drawBurn(mode, ease(k), now / 1000);
      if (k < 1) requestAnimationFrame(step); else { finished = true; done && done(); }
    }
    requestAnimationFrame(step);
    setTimeout(function () { if (!finished) { finished = true; drawBurn(mode, 1, performance.now() / 1000); done && done(); } }, dur + 400);
  }
  var hasGL = !reduce && setupGL();
  burn.classList.toggle("gl", !!hasGL); burn.classList.toggle("ice", hereCold);
  if (/[?&]debug\b/.test(location.search)) window.__burn = { draw: drawBurn, el: burn, gl: function () { return !!hasGL; } };

  var arrived = false;
  try { arrived = sessionStorage.getItem("mochachos-burn") === "1"; sessionStorage.removeItem("mochachos-burn"); } catch (e) {}
  var clearCover = function () { root.classList.remove("burn-in", "burn-ice"); };
  if (arrived && !reduce) {
    if (hasGL) {
      burn.classList.add("active", "arriving");
      drawBurn(1, 0, performance.now() / 1000);
      clearCover();
      setTimeout(function () { burn.classList.add("logo-out"); }, 260);
      play(1, 1050, function () { burn.className = BASE() + " gl"; });
    } else {
      burn.classList.add("cover"); clearCover();
      setTimeout(function () { burn.classList.remove("cover"); burn.classList.add("reveal"); }, 40);
      setTimeout(function () { burn.className = BASE(); }, 1250);
    }
  } else clearCover();
  window.addEventListener("pageshow", function (e) { if (e.persisted) { burn.className = BASE() + (hasGL ? " gl" : ""); clearCover(); } });

  document.addEventListener("click", function (e) {
    if (reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.search === location.search) return; // same page (hash links)
    e.preventDefault();
    try { sessionStorage.setItem("mochachos-burn", "1"); } catch (err) {}
    var go = function () { location.href = url.href; };
    if (hasGL) {
      burn.classList.add("active", "leaving");
      setTimeout(function () { burn.classList.add("logo-in"); }, 380);
      play(0, 680, go);
    } else {
      burn.classList.add("ignite");
      setTimeout(go, 520);
    }
  });
})();
