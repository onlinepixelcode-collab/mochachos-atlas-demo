/* Mochachos Atlas Road — real-time flames.
   <canvas data-fire>    : WebGL fbm flame + smoke shader (screen-blended over dark sections)
   <canvas data-embers>  : rising embers; on desktop the cursor throws sparks
   The flame height follows the Zee Flavours heat level (window "heat" event, 1–5). */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // heat level 1–5 is shared across the site (header heat dial, Zee Flavours meter)
  var level = 2;
  try { level = Math.min(5, Math.max(1, parseInt(localStorage.getItem("mochachos-heat"), 10) || 2)); } catch (e) {}
  var toHeat = function (l) { return 0.25 + (l - 1) * 0.17; };
  var heatTarget = toHeat(level), heat = heatTarget;
  window.addEventListener("heat", function (e) { level = e.detail; heatTarget = toHeat(level); });

  /* ---------- WebGL flames ---------- */
  var VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var FRAG = [
    "precision mediump float;",
    "uniform vec2 r;uniform float t;uniform float heat;uniform float smoke;",
    "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);",
    " return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}",
    "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}",
    "void main(){",
    " vec2 uv=gl_FragCoord.xy/r;float asp=r.x/r.y;",
    " vec2 p=vec2(uv.x*asp*2.6,uv.y*2.2);",
    " float q=fbm(p*vec2(1.,.9)-vec2(0.,t*1.25));",
    " float w=fbm(p*vec2(2.2,1.6)+vec2(q*1.7,-t*2.1));",
    " float tongues=.55+.45*sin(uv.x*asp*9.+q*6.+t*.8);",
    " float height=mix(.22,.78,heat)*(.75+.5*tongues);",
    " float f=1.-uv.y/height+(w-.5)*1.25;",
    " f=clamp(f,0.,1.);f=pow(f,1.5);",
    " vec3 col=vec3(1.,.32,.04)*f*1.7+vec3(1.,.78,.25)*pow(f,3.)*1.4+vec3(1.,.95,.8)*pow(f,7.)*.9;",
    " col*=smoothstep(0.,.18,f+.05);",
    " float s=fbm(p*.65+vec2(t*.05,-t*.35))*smoothstep(.15,.95,uv.y)*smoothstep(1.05,.55,uv.y);",
    " col+=vec3(.55,.5,.48)*s*smoke;",
    " gl_FragColor=vec4(col,1.);",
    "}"
  ].join("\n");

  function fireCanvas(cv) {
    var gl = cv.getContext("webgl", { antialias: false, premultipliedAlpha: false, alpha: false });
    if (!gl) { cv.remove(); return null; }
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.remove(); return null; }
    gl.useProgram(pr);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uR = gl.getUniformLocation(pr, "r"), uT = gl.getUniformLocation(pr, "t"), uH = gl.getUniformLocation(pr, "heat"), uS = gl.getUniformLocation(pr, "smoke");
    var scale = parseFloat(cv.getAttribute("data-res") || "0.5");
    var boost = parseFloat(cv.getAttribute("data-heat-boost") || "0");
    var minLevel = parseInt(cv.getAttribute("data-fire-min") || "0", 10);
    var smoke = parseFloat(cv.getAttribute("data-smoke") || "1");
    function size() {
      var w = Math.max(1, Math.round(cv.clientWidth * scale)), h = Math.max(1, Math.round(cv.clientHeight * scale));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
    }
    return {
      el: cv,
      min: minLevel,
      draw: function (time) {
        size();
        gl.uniform2f(uR, cv.width, cv.height);
        gl.uniform1f(uT, time);
        var live = cv.getAttribute("data-heat-live");
        gl.uniform1f(uH, Math.min(1, live !== null ? +live : heat + boost));
        gl.uniform1f(uS, smoke);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    };
  }

  /* ---------- embers ---------- */
  function emberCanvas(cv) {
    var g = cv.getContext("2d");
    var parts = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var finePointer = matchMedia("(pointer: fine)").matches;
    var host = cv.parentElement;
    function size() {
      var w = cv.clientWidth * dpr, h = cv.clientHeight * dpr;
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    }
    function spawn(x, y, burst) {
      parts.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * (burst ? 2.4 : 0.6) * dpr,
        vy: -(0.6 + Math.random() * (burst ? 2.6 : 1.6)) * dpr,
        life: 0, max: 60 + Math.random() * 110,
        r: (0.6 + Math.random() * 1.8) * dpr,
        hue: 18 + Math.random() * 32
      });
    }
    if (finePointer && !reduce) {
      var last = 0;
      host.addEventListener("pointermove", function (e) {
        var now = performance.now(); if (now - last < 16) return; last = now;
        var b = cv.getBoundingClientRect();
        for (var i = 0; i < 2; i++) spawn((e.clientX - b.left) * dpr, (e.clientY - b.top) * dpr, true);
      });
    }
    return {
      el: cv,
      min: parseInt(cv.getAttribute("data-fire-min") || "0", 10),
      draw: function () {
        size();
        var w = cv.width, h = cv.height;
        var rate = 1 + heat * 3;
        for (var i = 0; i < rate; i++) if (Math.random() < 0.7) spawn(Math.random() * w, h + 5, false);
        g.clearRect(0, 0, w, h);
        g.globalCompositeOperation = "lighter";
        for (var j = parts.length - 1; j >= 0; j--) {
          var p = parts[j];
          p.life++;
          p.vx += (Math.random() - 0.5) * 0.08 * dpr;
          p.x += p.vx; p.y += p.vy; p.vy *= 0.995;
          var a = 1 - p.life / p.max;
          if (a <= 0 || p.y < -10) { parts.splice(j, 1); continue; }
          g.fillStyle = "hsla(" + p.hue + ",100%," + (55 + a * 20) + "%," + a + ")";
          g.beginPath(); g.arc(p.x, p.y, p.r * (0.6 + a * 0.6), 0, 6.283); g.fill();
          g.fillStyle = "hsla(" + p.hue + ",100%,50%," + a * 0.15 + ")";
          g.beginPath(); g.arc(p.x, p.y, p.r * 4, 0, 6.283); g.fill();
        }
        if (parts.length > 500) parts.splice(0, parts.length - 500);
        g.globalCompositeOperation = "source-over";
      }
    };
  }

  /* ---------- loop: only draw what's on screen ---------- */
  var layers = [], onScreen = new Map(), started = false, io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (es) { es.forEach(function (e) { onScreen.set(e.target, e.isIntersecting); }); }, { rootMargin: "100px" });
  }
  function track(l) { if (!l) return; layers.push(l); onScreen.set(l.el, true); if (io) io.observe(l.el); }
  function scan() {
    document.querySelectorAll("canvas[data-fire]:not([data-fire-on])").forEach(function (cv) { cv.setAttribute("data-fire-on", ""); track(fireCanvas(cv)); });
    document.querySelectorAll("canvas[data-embers]:not([data-fire-on])").forEach(function (cv) { cv.setAttribute("data-fire-on", ""); track(emberCanvas(cv)); });
    if (layers.length && !started) { started = true; requestAnimationFrame(frame); }
  }
  var t0 = performance.now();
  function frame(now) {
    if (!reduce) requestAnimationFrame(frame);
    if (document.hidden) return;
    heat += (heatTarget - heat) * 0.04;
    var t = (now - t0) / 1000;
    layers.forEach(function (l) { if (onScreen.get(l.el) && (!l.min || level >= l.min)) l.draw(t); });
  }
  window.MochachosFire = { scan: scan };
  scan();
})();
