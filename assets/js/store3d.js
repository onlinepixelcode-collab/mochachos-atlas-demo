/* Mochachos Atlas Road — interactive 3D model of the Atlas Road branch (Three.js).
   Modelled from photos of the store: standalone building with roof-mounted "Mochachos" letters
   and chief logo, black laser-cut fascia, red patterned pillars, folding glass doors, dark deck
   with steel rails, hedges, bollards and umbrellas, Aztec sun mural on the grey side wall,
   the pine-tree cell mast next door. Inside: timber-beam ceiling, patchwork tile wall,
   black patterned counter, red Aztec wall symbol, teal door and booth, cage pendants.
   No people. Units are metres; the shopfront faces +z (Atlas Road). */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const host = document.getElementById("store3d");
if (host) {
  const start = () => { try { init(); } catch (err) { fail(err); } };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); start(); }
    }, { rootMargin: "300px" });
    io.observe(host);
  } else start();
}

function fail(err) {
  console.error(err);
  const l = host.querySelector("[data-store-loading]");
  if (l) l.innerHTML = "<span>The 3D store needs WebGL, which this browser has turned off.</span>";
}

function init() {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmall = host.clientWidth < 700;
  const C = { red: 0xdb342e, teal: 0x00a7b5, yellow: 0xf5c000, black: 0x151517, wood: 0xd2a868, grey: 0x8d9094 };

  /* ---------- renderer / scene ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 220);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.autoRotateSpeed = 0.35;

  /* ---------- helpers ---------- */
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...o });
  const box = (w, h, d, mat, x, y, z, parent = scene, shadow = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = shadow; m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const plane = (w, h, mat, x, y, z, ry = 0, rx = 0, parent = scene) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.receiveShadow = true;
    parent.add(m); return m;
  };
  const cyl = (rt, rb, h, mat, x, y, z, seg = 14) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m;
  };
  const tex = (w, h, draw, repeat) => {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  };
  const noise = (g, w, h, n, a, light) => {
    for (let i = 0; i < n; i++) {
      g.fillStyle = Math.random() > 0.5 ? `rgba(0,0,0,${Math.random() * a})` : `rgba(255,255,255,${Math.random() * a * (light || 1)})`;
      g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3);
    }
  };

  /* ---------- textures ---------- */
  const sky = tex(16, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "#3d78c2"); gr.addColorStop(0.45, "#8fb6dc"); gr.addColorStop(0.75, "#f4c98d"); gr.addColorStop(1, "#f0a866");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  scene.background = sky;
  scene.fog = new THREE.Fog(0xe9c79a, 70, 170);

  // black laser-cut panel (fascia + counter front)
  const laserTex = (bg, fg, rep) => tex(256, 128, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg;
    for (let x = 0; x < w; x += 64) for (let y = 0; y < h; y += 64) {
      const cx = x + 32, cy = y + 32;
      g.beginPath(); g.moveTo(cx, cy - 26); g.lineTo(cx + 26, cy); g.lineTo(cx, cy + 26); g.lineTo(cx - 26, cy); g.closePath(); g.fill();
      g.fillStyle = bg;
      g.beginPath(); g.moveTo(cx, cy - 14); g.lineTo(cx + 14, cy); g.lineTo(cx, cy + 14); g.lineTo(cx - 14, cy); g.closePath(); g.fill();
      g.fillStyle = fg;
      g.fillRect(cx - 4, cy - 4, 8, 8);
      g.fillRect(x, cy - 2, 6, 4); g.fillRect(x + 58, cy - 2, 6, 4);
    }
  }, rep);
  const fasciaTex = laserTex("#141416", "#4a4c52", [10, 1]);
  const counterFrontTex = laserTex("#121214", "#3c3e44", [5, 1]);

  // red laser-cut pillars
  const pillarTex = tex(128, 512, (g, w, h) => {
    g.fillStyle = "#db342e"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#e8e2dc";
    g.fillRect(8, 0, 6, h); g.fillRect(w - 14, 0, 6, h);
    g.fillStyle = "#7d0f16";
    for (let y = 20; y < h; y += 56) {
      g.beginPath(); g.moveTo(w / 2, y); g.lineTo(w - 26, y + 22); g.lineTo(w / 2, y + 44); g.lineTo(26, y + 22); g.closePath(); g.fill();
      g.fillStyle = "#db342e"; g.fillRect(w / 2 - 8, y + 14, 16, 16); g.fillStyle = "#7d0f16";
      g.fillRect(24, y + 48, 14, 6); g.fillRect(w - 38, y + 48, 14, 6);
    }
  }, [1, 1]);

  const fasciaTextTex = tex(2048, 160, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.font = "900 112px Anton, Impact, 'Arial Black', sans-serif";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.lineWidth = 10; g.strokeStyle = "#f3ece6"; g.strokeText("MEXICAN CHICKEN FIESTA", w / 2, h / 2 + 4);
    g.fillStyle = "#db342e"; g.fillText("MEXICAN CHICKEN FIESTA", w / 2, h / 2 + 4);
  });

  const plasterTex = tex(512, 512, (g, w, h) => { g.fillStyle = "#b9ad98"; g.fillRect(0, 0, w, h); noise(g, w, h, 9000, 0.12); }, [3, 1]);
  const extWallTex = tex(256, 256, (g, w, h) => { g.fillStyle = "#8b8f95"; g.fillRect(0, 0, w, h); noise(g, w, h, 3000, 0.08); }, [4, 1]);

  const patchworkTex = tex(768, 768, (g, w) => {
    const n = 6, s = w / n;
    const pal = ["#2a5aa8", "#e2a72e", "#c4352f", "#1b1b1d", "#3f8fa3", "#7a9a3a", "#d36a2a"];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = i * s, y = j * s, cx = x + s / 2, cy = y + s / 2;
      const a = pal[(i * 3 + j * 5) % pal.length], b = pal[(i + j * 2 + 3) % pal.length];
      g.fillStyle = (i + j) % 3 === 0 ? "#efe6d3" : "#f7f2e8"; g.fillRect(x, y, s, s);
      const kind = (i * 7 + j * 3) % 5;
      g.fillStyle = a; g.strokeStyle = a; g.lineWidth = 6;
      if (kind === 0) { for (let k = 0; k < 8; k++) { g.save(); g.translate(cx, cy); g.rotate((k * Math.PI) / 4); g.beginPath(); g.ellipse(0, -s * 0.24, s * 0.07, s * 0.16, 0, 0, 7); g.fill(); g.restore(); } g.fillStyle = b; g.beginPath(); g.arc(cx, cy, s * 0.1, 0, 7); g.fill(); }
      else if (kind === 1) { g.beginPath(); g.moveTo(cx, y + 6); g.lineTo(x + s - 6, cy); g.lineTo(cx, y + s - 6); g.lineTo(x + 6, cy); g.closePath(); g.fill(); g.fillStyle = b; g.beginPath(); g.moveTo(cx, y + s * 0.3); g.lineTo(x + s * 0.7, cy); g.lineTo(cx, y + s * 0.7); g.lineTo(x + s * 0.3, cy); g.closePath(); g.fill(); }
      else if (kind === 2) { for (let r = s * 0.42; r > 6; r -= 14) { g.strokeStyle = r % 28 < 14 ? a : b; g.beginPath(); g.arc(x, y + s, r, -Math.PI / 2, 0); g.stroke(); } }
      else if (kind === 3) { for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? a : b; g.fillRect(x + (k * s) / 6, y, s / 12, s); } }
      else { g.beginPath(); for (let k = 0; k < 8; k++) { const ang = (k * Math.PI) / 4; const r = k % 2 ? s * 0.18 : s * 0.4; g.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r); } g.closePath(); g.fill(); g.fillStyle = "#f7f2e8"; g.beginPath(); g.arc(cx, cy, s * 0.08, 0, 7); g.fill(); }
      g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = 2; g.strokeRect(x, y, s, s);
    }
  }, [1, 1]);

  const floorTex = tex(512, 512, (g, w) => {
    g.fillStyle = "#a9a7a2"; g.fillRect(0, 0, w, w);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const v = 190 + Math.floor(Math.random() * 14); g.fillStyle = `rgb(${v},${v - 2},${v - 6})`; g.fillRect(i * 256 + 3, j * 256 + 3, 250, 250); }
    noise(g, w, w, 2000, 0.05);
  }, [6, 4]);
  const rugTex = tex(512, 256, (g, w, h) => {
    const s = 64, pal = ["#2a5aa8", "#c49a3a", "#7d6a5a", "#3f8fa3"];
    for (let x = 0; x < w; x += s) for (let y = 0; y < h; y += s) {
      g.fillStyle = "#ebe4d6"; g.fillRect(x, y, s, s);
      g.fillStyle = pal[((x + y) / s) % 4];
      for (let k = 0; k < 4; k++) { g.save(); g.translate(x + s / 2, y + s / 2); g.rotate((k * Math.PI) / 2); g.beginPath(); g.ellipse(0, -16, 7, 13, 0, 0, 7); g.fill(); g.restore(); }
      g.fillStyle = "#2a2a2a"; g.beginPath(); g.arc(x + s / 2, y + s / 2, 6, 0, 7); g.fill();
      g.strokeStyle = "rgba(0,0,0,.15)"; g.strokeRect(x, y, s, s);
    }
  }, [1, 1]);

  const deckTex = tex(512, 512, (g, w, h) => {
    for (let i = 0; i < 16; i++) { const v = 52 + Math.floor(Math.random() * 10); g.fillStyle = `rgb(${v},${v},${v + 3})`; g.fillRect(0, (i * h) / 16, w, h / 16 - 3); g.fillStyle = "#1c1c1e"; g.fillRect(0, ((i + 1) * h) / 16 - 3, w, 3); }
    noise(g, w, h, 1500, 0.06);
  }, [1, 2]);
  const paverTex = tex(512, 512, (g, w, h) => {
    g.fillStyle = "#6f6d6a"; g.fillRect(0, 0, w, h);
    const bw = 64, bh = 32;
    for (let y = 0; y < h; y += bh) for (let x = -bw; x < w; x += bw) {
      const off = (y / bh) % 2 ? bw / 2 : 0; const v = 140 + Math.floor(Math.random() * 30);
      g.fillStyle = `rgb(${v},${v - 4},${v - 10})`; g.fillRect(x + off + 2, y + 2, bw - 4, bh - 4);
    }
  }, [18, 18]);
  const brickTex = tex(256, 256, (g, w, h) => {
    g.fillStyle = "#8a7a6a"; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = -32; x < w; x += 32) {
      const off = (y / 16) % 2 ? 16 : 0; const r = 120 + Math.random() * 40;
      g.fillStyle = `rgb(${r},${r * 0.55},${r * 0.38})`; g.fillRect(x + off + 1, y + 1, 30, 14);
    }
  }, [8, 3]);
  const hedgeTex = tex(256, 256, (g, w, h) => {
    g.fillStyle = "#3d6b2a"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = Math.random(); g.fillStyle = v > 0.6 ? "#5c8f3a" : v > 0.3 ? "#2c5220" : "#77a84a"; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 0, 7); g.fill(); }
  }, [6, 1]);
  const marbleTex = tex(256, 256, (g, w, h) => {
    g.fillStyle = "#cfc6b6"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(110,95,80,.35)"; g.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) { g.beginPath(); let y = Math.random() * h; g.moveTo(0, y); for (let x = 0; x <= w; x += 16) { y += (Math.random() - 0.5) * 12; g.lineTo(x, y); } g.stroke(); }
  });

  const muralTex = tex(1024, 1024, (g, w) => {
    const c = w / 2;
    g.fillStyle = "#f2efe8";
    for (let i = 0; i < 30; i++) { g.save(); g.translate(c, c); g.rotate((i / 30) * Math.PI * 2); g.beginPath(); g.moveTo(-30, -400); g.quadraticCurveTo(0, -500, 30, -400); g.lineTo(16, -385); g.lineTo(-16, -385); g.fill(); g.restore(); }
    g.strokeStyle = "#f2efe8"; g.lineWidth = 24; g.beginPath(); g.arc(c, c, 370, 0, 7); g.stroke();
    g.strokeStyle = "#1e1e20"; g.lineWidth = 12; g.beginPath(); g.arc(c, c, 345, 0, 7); g.stroke();
    g.fillStyle = "#2b8fd6";
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.2; g.save(); g.translate(c + Math.cos(a) * 150, c + Math.sin(a) * 150); g.rotate(a + Math.PI / 2); g.fillRect(-15, -90, 30, 90); g.restore(); }
    g.beginPath(); g.arc(c, c - 60, 110, Math.PI, 0); g.fill();
    g.lineCap = "round";
    g.strokeStyle = "#db342e"; g.lineWidth = 30;
    g.beginPath(); g.moveTo(c - 230, c + 20); g.bezierCurveTo(c - 120, c - 40, c + 40, c + 220, c + 160, c + 90); g.bezierCurveTo(c + 230, c + 20, c + 120, c - 40, c + 60, c + 30); g.stroke();
    g.beginPath(); g.arc(c - 150, c + 60, 60, 0, Math.PI * 1.6); g.stroke();
    g.strokeStyle = "#f5c000"; g.lineWidth = 24;
    g.beginPath(); g.moveTo(c - 240, c - 60); g.bezierCurveTo(c - 80, c - 120, c + 120, c - 60, c + 220, c + 10); g.stroke();
    g.beginPath(); g.arc(c + 40, c - 10, 42, Math.PI, Math.PI * 2.7); g.stroke();
    g.fillStyle = "#1e1e20"; g.beginPath(); g.arc(c - 30, c - 20, 26, 0, 7); g.fill();
  });

  const aztecRedTex = tex(512, 512, (g, w) => {
    const c = w / 2;
    g.clearRect(0, 0, w, w);
    g.fillStyle = "#db342e";
    g.beginPath(); g.arc(c, c, 240, Math.PI * 0.5, Math.PI * 1.5); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(c, c - 240); g.lineTo(c + 40, c - 240); g.lineTo(c + 40, c + 240); g.lineTo(c, c + 240); g.fill();
    g.fillStyle = "#b9ad98";
    g.beginPath(); g.arc(c - 120, c - 40, 54, 0, 7); g.fill();
    g.fillStyle = "#db342e"; g.beginPath(); g.arc(c - 120, c - 40, 26, 0, 7); g.fill();
    g.fillStyle = "#b9ad98";
    g.fillRect(c - 200, c + 40, 180, 34); g.fillRect(c - 60, c - 150, 34, 120); g.fillRect(c - 130, c + 110, 34, 90);
    g.save(); g.translate(c + 60, c + 160); g.rotate(-0.6); g.fillStyle = "#db342e"; g.fillRect(0, 0, 200, 34); g.restore();
  });

  const signBoardTex = (txt, bg, fg) => tex(512, 128, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = fg; g.font = "800 56px Manrope, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(txt, w / 2, h / 2 + 2);
  });

  /* ---------- ground, roads, neighbours ---------- */
  const ground = plane(160, 160, std(0xffffff, { map: paverTex, roughness: 0.95 }), 0, 0, 0, 0, -Math.PI / 2);
  ground.receiveShadow = true;
  const ROADZ = 26;
  const road = plane(160, 11, std(0x3a3b3e, { roughness: 0.95 }), 0, 0.01, ROADZ, 0, -Math.PI / 2);
  for (let x = -70; x < 70; x += 6) plane(3, 0.18, new THREE.MeshBasicMaterial({ color: 0xf2f2f2 }), x, 0.02, ROADZ, 0, -Math.PI / 2);
  plane(160, 0.4, std(0x9a958c), 0, 0.02, ROADZ - 5.7, 0, -Math.PI / 2); // kerb
  plane(160, 2.6, std(0x7d8a4a, { roughness: 1 }), 0, 0.015, ROADZ - 7.2, 0, -Math.PI / 2); // grass verge
  const pyrGeo = new THREE.ConeGeometry(0.42, 0.62, 4); const pyrMat = std(0xa8865a, { roughness: 1 });
  for (let x = -40; x <= 14; x += 2.2) { if (x > -2 && x < 3) continue; const py = new THREE.Mesh(pyrGeo, pyrMat); py.position.set(x, 0.31, ROADZ - 7.6); py.rotation.y = Math.PI / 4; py.castShadow = true; scene.add(py); }
  // yellow parking lines on the pavers (from the photos)
  for (let i = 0; i < 4; i++) plane(0.14, 4.5, new THREE.MeshBasicMaterial({ color: 0xe0b52a }), 8.5 + i * 2.6, 0.015, 7.5, 0.3, -Math.PI / 2);

  // brick house behind the shop (its tiled roof shows above the fascia)
  box(14, 3.4, 6, std(0xffffff, { map: brickTex }), 0, 1.7, -8.6);
  const roofGeo = new THREE.ConeGeometry(7.4, 1.9, 4, 1);
  const roof = new THREE.Mesh(roofGeo, std(0x6a6d73, { roughness: 0.95 }));
  roof.rotation.y = Math.PI / 4; roof.scale.set(1.0, 1, 0.46); roof.position.set(0, 4.35, -8.6); roof.castShadow = true; scene.add(roof);
  cyl(0.28, 0.28, 1.6, std(0x5a5d63, { metalness: 0.3 }), -2.6, 4.2, -5.8);
  cyl(0.24, 0.24, 1.3, std(0x5a5d63, { metalness: 0.3 }), -1.2, 4.0, -5.8);
  cyl(0.45, 0.45, 0.12, std(0x5a5d63), -2.6, 5.05, -5.8);

  // palisade fence + gate on the right
  const fenceMat = std(0x26282b, { metalness: 0.4, roughness: 0.5 });
  for (let z = -6; z <= 3; z += 0.3) box(0.05, 2.4, 0.05, fenceMat, 9.5, 1.2, z, scene, false);
  box(0.06, 0.08, 9.2, fenceMat, 9.5, 2.2, -1.5, scene, false);
  box(0.06, 0.08, 9.2, fenceMat, 9.5, 0.4, -1.5, scene, false);
  const banner = plane(3.6, 1.3, std(0xffffff, { map: signBoardTex("NO PARKING IN FRONT OF THIS GATE", "#db342e", "#ffffff") }), 9.42, 1.3, 0.2, -Math.PI / 2);
  banner.material.side = THREE.DoubleSide;

  // the pine-tree cell mast next door
  cyl(0.22, 0.3, 15, std(0x5b4a3a), 13, 7.5, -3);
  for (let i = 0; i < 9; i++) {
    const r = 2.6 - i * 0.24, y = 6.5 + i * 0.95;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, 1.5, 9), std(0x2e4a2a, { roughness: 1 }));
    cone.position.set(13, y, -3); cone.castShadow = true; scene.add(cone);
  }

  // Atlas Road street sign
  cyl(0.04, 0.04, 2.8, std(0x9a9da2, { metalness: 0.6 }), 9.5, 1.4, ROADZ - 6.4);
  const ss = plane(1.7, 0.42, std(0xffffff, { map: signBoardTex("ATLAS ROAD", "#ffffff", "#1d1d1f") }), 9.5, 2.65, ROADZ - 6.37);
  const ssBack = ss.clone(); ssBack.rotation.y = Math.PI; ssBack.position.z = ROADZ - 6.43; scene.add(ssBack);
  const num = plane(0.7, 0.42, std(0xffffff, { map: signBoardTex("254", "#db342e", "#ffffff") }), 9.5, 2.15, ROADZ - 6.37);

  /* ---------- the building ---------- */
  const W = 12, D = 9, H = 3.3, FZ = 4, BZ = FZ - D; // front z=4, back z=-5
  const extWall = std(0xffffff, { map: extWallTex, roughness: 0.9 });
  // side + back exterior walls (boxes so they read from both sides)
  box(0.25, H, D, extWall, -W / 2, H / 2, FZ - D / 2);
  box(0.25, H, D, extWall, W / 2, H / 2, FZ - D / 2);
  box(W, H, 0.25, extWall, 0, H / 2, BZ);
  // roof slab + red trim
  box(W + 0.5, 0.3, D + 0.4, std(0x232427), 0, H + 0.15, FZ - D / 2);
  // fascia band (front + right side)
  const fasciaMat = std(0xffffff, { map: fasciaTex, roughness: 0.6 });
  box(W + 0.6, 0.95, 0.18, fasciaMat, 0, H + 0.45, FZ + 0.15);
  const sideFascia = fasciaTex.clone(); sideFascia.repeat.set(7, 1); sideFascia.needsUpdate = true;
  box(0.18, 0.95, D + 0.3, std(0xffffff, { map: sideFascia, roughness: 0.6 }), W / 2 + 0.2, H + 0.45, FZ - D / 2);
  const redTrim = std(C.red, { roughness: 0.5 });
  box(W + 0.7, 0.07, 0.24, redTrim, 0, H + 0.95, FZ + 0.16);
  box(W + 0.7, 0.07, 0.24, redTrim, 0, H - 0.04, FZ + 0.16);
  box(0.24, 0.07, D + 0.4, redTrim, W / 2 + 0.22, H + 0.95, FZ - D / 2);
  box(0.24, 0.07, D + 0.4, redTrim, W / 2 + 0.22, H - 0.04, FZ - D / 2);
  plane(8.4, 0.62, new THREE.MeshStandardMaterial({ map: fasciaTextTex, transparent: true, roughness: 0.5 }), 0, H + 0.46, FZ + 0.25);

  // roof sign: red "Mochachos" letters + chief logo on posts
  const loader = new THREE.TextureLoader();
  const word = new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.45, side: THREE.DoubleSide, alphaTest: 0.05 });
  const head = new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.6, side: THREE.DoubleSide, alphaTest: 0.05 });
  loader.load("assets/img/logo-horizontal.png", (t) => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
    const tw = t.clone(); tw.repeat.set(1300 / 1763, 300 / 442); tw.offset.set(0, 142 / 442); tw.needsUpdate = true;
    const th = t.clone(); th.repeat.set(420 / 1763, 1); th.offset.set(1320 / 1763, 0); th.needsUpdate = true;
    word.map = tw; head.map = th; word.needsUpdate = head.needsUpdate = true;
  });
  const signY = H + 1.0 + 0.95;
  const wordMesh = plane(8.6, 2.0, word, -0.9, signY + 0.25, FZ + 0.05); wordMesh.castShadow = true;
  const headMesh = plane(2.2, 2.3, head, 4.6, signY + 0.4, FZ + 0.05); headMesh.castShadow = true;
  const postMat = std(0x3a3b3f, { metalness: 0.5, roughness: 0.4 });
  for (let x = -4.8; x <= 5.2; x += 0.9) box(0.06, 0.95, 0.06, postMat, x, H + 1.45, FZ + 0.02, scene, false);
  // flood lights on the fascia
  [-5.6, -1.2, 3.2, 5.9].forEach((x) => { box(0.42, 0.3, 0.14, std(0x2a2b2e, { metalness: 0.4 }), x, H + 1.12, FZ + 0.3, scene, false); plane(0.34, 0.22, new THREE.MeshBasicMaterial({ color: 0xfff7d6 }), x, H + 1.12, FZ + 0.38); });

  // front: red pillars, glass, open folding doors
  const pillarMat = std(0xffffff, { map: pillarTex, roughness: 0.6 });
  [-5.85, -1.75, 1.75, 5.85].forEach((x) => box(0.5, H, 0.32, pillarMat, x, H / 2, FZ));
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xcfe6ee, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.3, side: THREE.DoubleSide, depthWrite: false });
  const frameMat = std(0xd9dadc, { metalness: 0.6, roughness: 0.3 });
  [[-3.8, 3.6], [3.8, 3.6]].forEach(([x, w]) => {
    plane(w, H - 0.2, glassMat, x, (H - 0.2) / 2 + 0.05, FZ);
    for (let i = 0; i <= 4; i++) box(0.05, H - 0.2, 0.06, frameMat, x - w / 2 + (i * w) / 4, (H - 0.2) / 2 + 0.05, FZ, scene, false);
    box(w, 0.06, 0.07, frameMat, x, H - 0.15, FZ, scene, false);
  });
  // open door leaves (with red patterned strip, like the real doors)
  [[-1.5, 1], [1.5, -1]].forEach(([x, s]) => {
    const g = new THREE.Group();
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(1.2, H - 0.25), glassMat); leaf.position.x = s * 0.6; g.add(leaf);
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.35, H - 0.5), new THREE.MeshStandardMaterial({ map: pillarTex, side: THREE.DoubleSide })); strip.position.set(s * 0.6, 0, 0.01); g.add(strip);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(1.2, H - 0.25, 0.04), new THREE.MeshStandardMaterial({ color: 0xe8e8ea, transparent: true, opacity: 0.0 })); fr.position.x = s * 0.6; g.add(fr);
    [-1, 1].forEach((e) => { const f = new THREE.Mesh(new THREE.BoxGeometry(0.05, H - 0.25, 0.06), frameMat); f.position.x = s * 0.6 + e * 0.6; g.add(f); });
    g.position.set(x, (H - 0.25) / 2 + 0.05, FZ + 0.05);
    g.rotation.y = s * -1.25;
    scene.add(g);
  });
  box(3.2, 0.05, 0.28, std(0x1d1d1f), 0, 0.27, FZ, scene, false); // threshold

  // side wall Aztec sun mural + window
  plane(3.4, 3.4, new THREE.MeshStandardMaterial({ map: muralTex, transparent: true, roughness: 0.9 }), W / 2 + 0.13, 1.65, -2.2, Math.PI / 2);
  plane(2.6, 2.3, new THREE.MeshStandardMaterial({ color: 0x2d3a44, roughness: 0.1, metalness: 0.6 }), W / 2 + 0.13, 1.45, 1.7, Math.PI / 2);
  box(0.08, 2.4, 0.06, frameMat, W / 2 + 0.15, 1.45, 1.7, scene, false);
  box(0.08, 0.06, 2.7, frameMat, W / 2 + 0.15, 1.45, 1.7, scene, false);
  box(0.3, H, 0.5, pillarMat, W / 2 + 0.1, H / 2, 3.75); // red corner pillar on the side

  /* ---------- front deck ---------- */
  const deckMat = std(0xffffff, { map: deckTex, roughness: 0.85 });
  box(W + 1, 0.26, 3.2, deckMat, 0, 0.13, FZ + 1.6);
  box(2.4, 0.13, 0.5, deckMat, 0, 0.065, FZ + 3.45); // step
  const steel = std(0xd0d3d6, { metalness: 0.85, roughness: 0.25 });
  const railRun = (x0, x1, z) => {
    const len = Math.abs(x1 - x0), cx = (x0 + x1) / 2;
    for (let i = 0; i <= Math.round(len / 1.2); i++) cyl(0.025, 0.025, 1.0, steel, x0 + Math.sign(x1 - x0) * i * (len / Math.round(len / 1.2)), 0.76, z, 8);
    [1.24, 0.95, 0.7, 0.45].forEach((y, k) => { const r = new THREE.Mesh(new THREE.CylinderGeometry(k ? 0.012 : 0.022, k ? 0.012 : 0.022, len, 8), steel); r.rotation.z = Math.PI / 2; r.position.set(cx, y, z); scene.add(r); });
  };
  railRun(-6.3, -1.3, FZ + 3.1);
  railRun(1.3, 6.3, FZ + 3.1);
  // hedge planters + concrete bollards
  const planterMat = std(0x3b2b22, { roughness: 0.9 });
  const hedgeMat = std(0xffffff, { map: hedgeTex, roughness: 1 });
  [[-4, 4.6], [4, 4.6]].forEach(([x, w]) => {
    box(w, 0.4, 0.75, planterMat, x, 0.2, FZ + 3.75);
    box(w - 0.1, 0.6, 0.7, hedgeMat, x, 0.7, FZ + 3.75);
  });
  const concrete = std(0x9c9a95, { roughness: 1 });
  [-6.6, -4.1, -1.6, 1.6, 4.1, 6.6].forEach((x) => cyl(0.24, 0.26, 0.8, concrete, x, 0.4, FZ + 4.5, 16));
  // traffic cones
  const coneMat = std(0xf06a1d, { roughness: 0.6 });
  [[-7.2, FZ + 5.3], [7.2, FZ + 5.3]].forEach(([x, z]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.6, 16), coneMat); c.position.set(x, 0.3, z); c.castShadow = true; scene.add(c); box(0.42, 0.04, 0.42, std(0x222222), x, 0.02, z, scene, false); });

  // black umbrellas + outdoor tables with red mesh chairs
  const umbMat = std(0x161618, { roughness: 0.7, side: THREE.DoubleSide });
  const redMesh = std(0xc72a2a, { roughness: 0.55 });
  const greyMesh = std(0x5d6066, { roughness: 0.55 });
  function meshChair(x, z, ry, mat) {
    const g = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.44), mat); seat.position.y = 0.46; g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.05), mat); back.position.set(0, 0.68, 0.22); back.rotation.x = -0.15; g.add(back);
    [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]].forEach(([lx, lz]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.46, 0.04), mat); l.position.set(lx, 0.23, lz); g.add(l); });
    g.traverse((o) => { o.castShadow = true; });
    g.position.set(x, 0.26, z); g.rotation.y = ry; scene.add(g);
  }
  function outdoorTable(x, z) {
    const g = new THREE.Group();
    box(0.9, 0.04, 0.9, std(0xffffff, { map: marbleTex, roughness: 0.4 }), 0, 0.74, 0, g);
    box(0.06, 0.72, 0.06, std(0x1a1a1a, { metalness: 0.5 }), 0, 0.37, 0, g);
    g.position.set(x, 0.26, z); scene.add(g);
  }
  [[-4, FZ + 1.7], [4, FZ + 1.7]].forEach(([x, z], i) => {
    outdoorTable(x, z);
    meshChair(x - 0.75, z, Math.PI / 2, redMesh);
    meshChair(x + 0.75, z, -Math.PI / 2, i ? greyMesh : redMesh);
    meshChair(x, z + 0.75, Math.PI, redMesh);
    cyl(0.03, 0.03, 2.4, std(0x333333, { metalness: 0.6 }), x, 0.26 + 1.2, z);
    const u = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.5, 8, 1, true), umbMat); u.position.set(x, 0.26 + 2.3, z); u.castShadow = true; scene.add(u);
  });

  /* ---------- interior ---------- */
  const IN = new THREE.Group(); scene.add(IN);
  plane(W - 0.3, D - 0.3, std(0xffffff, { map: floorTex, roughness: 0.6 }), 0, 0.27, FZ - D / 2, 0, -Math.PI / 2, IN);
  box(W - 0.3, 0.27, D - 0.3, std(0x777777), 0, 0.135, FZ - D / 2, IN, false); // raised slab to deck height
  plane(5.2, 1.6, std(0xffffff, { map: rugTex, roughness: 0.5 }), -1.2, 0.275, -1.2, 0, -Math.PI / 2, IN); // patterned floor tiles at the counter

  // interior wall finishes
  plane(D - 0.3, H - 0.3, std(0xffffff, { map: plasterTex, roughness: 0.95 }), -W / 2 + 0.14, H / 2 + 0.1, FZ - D / 2, Math.PI / 2, 0, IN);
  plane(D - 0.3, H - 0.3, std(0xffffff, { map: plasterTex, roughness: 0.95 }), W / 2 - 0.14, H / 2 + 0.1, FZ - D / 2, -Math.PI / 2, 0, IN);

  // timber beam ceiling
  plane(W - 0.3, D - 0.3, std(0x3b3127, { roughness: 1 }), 0, H - 0.01, FZ - D / 2, 0, Math.PI / 2, IN);
  const beamMat = std(0x6e4a2c, { roughness: 0.8 });
  for (let z = FZ - 0.6; z > BZ + 0.3; z -= 0.75) box(W - 0.3, 0.16, 0.12, beamMat, 0, H - 0.12, z, IN, false);
  box(0.16, 0.22, D - 0.4, beamMat, -2, H - 0.25, FZ - D / 2, IN, false);
  box(0.16, 0.22, D - 0.4, beamMat, 2.6, H - 0.25, FZ - D / 2, IN, false);

  // kitchen wall behind the counter + menu screens
  const kitchenZ = -2.6;
  box(8.3, H, 0.2, std(0xe9e6df), -1.75, H / 2 + 0.1, kitchenZ - 0.9, IN);
  box(8.3, 0.7, 0.9, std(0x2a2015, { roughness: 0.8 }), -1.75, H - 0.35, kitchenZ - 0.35, IN, false); // bulkhead
  const screens = ["chicken-whole", "burger-combo", "family", "burrito"];
  screens.forEach((name, i) => {
    const x = -4.6 + i * 1.6;
    box(1.5, 0.82, 0.05, std(C.black), x, 2.35, kitchenZ - 0.75, IN, false);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.6 });
    loader.load(`assets/img/${name}.jpg`, (t) => { t.colorSpace = THREE.SRGBColorSpace; mat.map = t; mat.emissiveMap = t; mat.needsUpdate = true; });
    const scr = plane(1.4, 0.74, mat, x, 2.35, kitchenZ - 0.72, 0, 0, IN);
    scr.userData.order = { chicken_whole: "pollo", burger_combo: "combo", family: "familia", burrito: "mexican" }[name.replace("-", "_")];
  });
  // counter: black laser-cut front, concrete base, red kick strip
  box(6.2, 0.55, 0.7, std(0xffffff, { map: counterFrontTex, roughness: 0.5 }), -1.6, 1.0, kitchenZ + 0.35, IN).userData.order = "all";
  box(6.2, 0.62, 0.7, new THREE.MeshBasicMaterial({ visible: false }), -1.6, 0.58, kitchenZ + 0.35, IN, false).userData.order = "all";
  box(6.2, 0.62, 0.7, std(0xb8b4ad, { roughness: 0.95 }), -1.6, 0.58, kitchenZ + 0.35, IN);
  box(6.25, 0.1, 0.72, std(C.red), -1.6, 0.32, kitchenZ + 0.36, IN, false);
  box(6.3, 0.05, 0.8, std(0x2b2b2d, { roughness: 0.3 }), -1.6, 1.3, kitchenZ + 0.35, IN);
  // till screens + hanging signs
  [-3.6, -0.6].forEach((x) => { box(0.36, 0.26, 0.04, std(0x111111), x, 1.5, kitchenZ + 0.25, IN, false); });
  [["COLLECT ORDER HERE", -3.6], ["DELIVERIES", 0.9], ["PLACE ORDER HERE", -5.0]].forEach(([t, x]) => {
    const p = plane(0.9, 0.24, new THREE.MeshStandardMaterial({ map: signBoardTex(t, "#ffffff", "#2a5aa8"), side: THREE.DoubleSide }), x, 2.75, kitchenZ + 0.45, 0, 0, IN);
    box(0.01, 0.35, 0.01, std(0x222222), x - 0.3, 3.0, kitchenZ + 0.45, IN, false);
    box(0.01, 0.35, 0.01, std(0x222222), x + 0.3, 3.0, kitchenZ + 0.45, IN, false);
  });
  // drinks fridge on the left
  box(0.8, 2, 0.65, std(0x1d1d1f), -5.4, 1.27, -0.8, IN);
  plane(0.62, 1.7, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdff4ff, emissiveIntensity: 0.85 }), -5.0, 1.3, -0.8, Math.PI / 2, 0, IN);

  // patchwork tile wall with TV (between counter and toilet door)
  const tileMat = std(0xffffff, { map: patchworkTex, roughness: 0.35 });
  box(0.3, H - 0.3, 2.4, tileMat, 3.0, (H - 0.3) / 2 + 0.27, -2.2, IN);
  box(1.4, H - 0.3, 0.3, tileMat, 3.65, (H - 0.3) / 2 + 0.27, -1.0, IN);
  box(1.2, 0.7, 0.06, std(0x0d0d0f, { roughness: 0.2 }), 3.65, 2.5, -0.82, IN, false);
  plane(1.1, 0.6, new THREE.MeshBasicMaterial({ color: 0x2a4f7a }), 3.65, 2.5, -0.785, 0, 0, IN);

  // teal toilet door + red Aztec symbol on the plaster wall
  box(0.9, 2.05, 0.06, std(C.teal, { roughness: 0.5 }), 4.9, 1.3, -1.2, IN);
  box(1.06, 2.15, 0.04, std(0x8a6a48), 4.9, 1.32, -1.24, IN, false);
  plane(2.6, 2.6, new THREE.MeshStandardMaterial({ map: aztecRedTex, transparent: true, roughness: 0.8 }), W / 2 - 0.16, 1.9, 0.6, -Math.PI / 2, 0, IN);

  // teal booth along the right-hand front window
  const tealMat = std(C.teal, { roughness: 0.55 });
  box(0.6, 0.45, 2.8, tealMat, 5.4, 0.5, 2.3, IN);
  box(0.2, 0.6, 2.8, tealMat, 5.75, 1.0, 2.3, IN);

  // wooden chairs with teal cushions + marble-look tables
  const woodMat = std(C.wood, { roughness: 0.55 });
  const cushMat = std(0x1b8ea0, { roughness: 0.9 });
  const slatMat = std(0x8fc3e0, { roughness: 0.6 });
  const marbleMat = std(0xffffff, { map: marbleTex, roughness: 0.35 });
  function woodChair(x, z, ry) {
    const g = new THREE.Group();
    [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]].forEach(([lx, lz]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.46, 0.045), woodMat); l.position.set(lx, 0.23, lz); g.add(l); });
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.44), woodMat); s.position.y = 0.47; g.add(s);
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.4), cushMat); c.position.y = 0.52; g.add(c);
    [-0.2, 0.2].forEach((px) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.5, 0.045), woodMat); p.position.set(px, 0.72, 0.2); g.add(p); });
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.09, 0.03), woodMat); top.position.set(0, 0.93, 0.2); g.add(top);
    const sl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.025), slatMat); sl.position.set(0, 0.72, 0.2); g.add(sl);
    g.traverse((o) => { o.castShadow = true; });
    g.position.set(x, 0.27, z); g.rotation.y = ry; IN.add(g);
  }
  function inTable(x, z, w = 1.1, d = 0.7) {
    const g = new THREE.Group();
    box(w, 0.05, d, marbleMat, 0, 0.76, 0, g);
    box(0.07, 0.72, 0.07, std(0x1a1a1a, { metalness: 0.4 }), 0, 0.37, 0, g);
    box(0.5, 0.03, 0.5, std(0x1a1a1a, { metalness: 0.4 }), 0, 0.015, 0, g);
    box(0.14, 0.12, 0.08, std(0x111111), 0.25, 0.84, 0, g); // condiment caddy
    g.position.set(x, 0.27, z); IN.add(g);
  }
  [[4.4, 1.6], [4.4, 3.0]].forEach(([x, z]) => { inTable(x, z, 0.9, 0.8); woodChair(x - 0.7, z, Math.PI / 2); });
  [[-4.2, 1.2], [-4.2, 2.8], [-2.2, 2.0], [1.0, 1.4]].forEach(([x, z]) => {
    inTable(x, z);
    woodChair(x - 0.3, z + 0.65, Math.PI); woodChair(x + 0.3, z + 0.65, Math.PI);
    woodChair(x - 0.3, z - 0.65, 0); woodChair(x + 0.3, z - 0.65, 0);
  });

  // pendant lamps: gold wire cages + a black dome, by the right window
  const cageMat = new THREE.MeshBasicMaterial({ color: 0xc9a24a, wireframe: true });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfff1c4 });
  const cordMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const lathe = []; for (let i = 0; i <= 10; i++) { const t = i / 10; lathe.push(new THREE.Vector2(0.04 + Math.sin(t * Math.PI) * 0.2, -t * 0.5)); }
  const cageGeo = new THREE.LatheGeometry(lathe, 12);
  function pendant(x, z, drop, kind, lit) {
    const g = new THREE.Group();
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, drop, 5), cordMat); cord.position.y = -drop / 2; g.add(cord);
    if (kind === "cage") { const cg = new THREE.Mesh(cageGeo, cageMat); cg.position.y = -drop; g.add(cg); }
    else { const sh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(0x151517, { side: THREE.DoubleSide, roughness: 0.4 })); sh.position.y = -drop - 0.15; g.add(sh); }
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), bulbMat); b.position.y = -drop - 0.26; g.add(b);
    if (lit) { const pl = new THREE.PointLight(0xffd48a, 1.6, 5, 2); pl.position.y = -drop - 0.3; g.add(pl); }
    g.position.set(x, H - 0.05, z); IN.add(g);
  }
  pendant(4.2, 1.6, 0.9, "cage"); pendant(4.6, 2.4, 1.1, "dome", true); pendant(4.2, 3.2, 0.8, "cage");
  pendant(-3.2, 2.0, 1.0, "cage"); pendant(-0.6, 1.7, 1.0, "cage");

  // downlights over the counter
  for (let x = -4.4; x <= 1.2; x += 1.4) plane(0.16, 0.16, new THREE.MeshBasicMaterial({ color: 0xfff6e0 }), x, H - 0.71, kitchenZ - 0.1, 0, Math.PI / 2, IN);
  const counterLight = new THREE.PointLight(0xffffff, 2.2, 7, 2); counterLight.position.set(-1.6, 2.4, kitchenZ + 0.8); IN.add(counterLight);

  // balloon bunch by the door
  const balloonCols = [0xff8a2a, 0x7cc242, 0x2f6fe0, 0x9b59d0, 0xf0f0f0];
  const bGeo = new THREE.SphereGeometry(0.15, 16, 12);
  cyl(0.02, 0.02, 1.6, std(0xdb342e), -2.3, 1.07, 3.2);
  for (let row = 0; row < 7; row++) for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + row * 0.7;
    const b = new THREE.Mesh(bGeo, std(balloonCols[(row + k) % 5], { roughness: 0.25 }));
    b.position.set(-2.3 + Math.cos(a) * 0.19, 1.1 + row * 0.24, 3.2 + Math.sin(a) * 0.19); b.scale.y = 1.12; b.castShadow = true; IN.add(b);
  }


  /* ---------- Sasol Atlas Road: the garage next door ----------
     Shop row joins Mochachos on its south side (-x) along the same frontage;
     the blue canopy and pumps sit in the forecourt between the shop and Atlas Road. */
  const SAS = { blue: 0x1f5fc8, navy: 0x1a2340, yellow: 0xf0b323, white: 0xf2f4f7 };
  const sasolLogoTex = (bg) => tex(512, 160, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = "#1f5fc8"; g.font = "700 92px Manrope, Arial, sans-serif"; g.textBaseline = "middle";
    g.fillText("sasol", 40, h / 2 + 4);
    [[400, 60, 22], [452, 44, 15], [446, 104, 17], [392, 116, 13], [430, 76, 11]].forEach(([x, y, r], i) => { g.fillStyle = i === 0 ? "#2a8ee8" : "#1f5fc8"; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
    g.strokeStyle = "#1f5fc8"; g.lineWidth = 6; g.beginPath(); g.moveTo(400, 60); g.lineTo(452, 44); g.moveTo(400, 60); g.lineTo(446, 104); g.moveTo(400, 60); g.lineTo(392, 116); g.stroke();
  });
  const delightTex = tex(1024, 160, (g, w, h) => {
    g.fillStyle = "#f0b323"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#1f5fc8"; g.textBaseline = "middle";
    g.font = "italic 600 54px Manrope, Arial, sans-serif"; g.fillText("sasol", 60, h / 2 - 14);
    g.font = "italic 800 92px Manrope, Arial, sans-serif"; g.fillText("delight", 210, h / 2 + 10);
    g.fillStyle = "#db342e"; g.fillText("!", 560, h / 2 + 10);
  });
  const louvreTex = tex(256, 64, (g, w, h) => {
    g.fillStyle = "#1a2340"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#3b5bb0"; for (let y = 6; y < h; y += 14) g.fillRect(0, y, w, 5);
    g.fillStyle = "#c9ced8"; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 3, h);
  }, [8, 1]);
  const tilePanelTex = tex(256, 256, (g, w, h) => {
    g.fillStyle = "#e3c76a"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(90,70,20,.35)"; g.lineWidth = 3;
    for (let x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y <= h; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  }, [3, 1]);

  // shop building
  const SX0 = -W / 2 - 0.15, SX1 = -26, SW = SX0 - SX1, SCX = (SX0 + SX1) / 2, SH = 3.4;
  box(SW, SH, D, std(0x2a2f3a, { roughness: 0.8 }), SCX, SH / 2, FZ - D / 2);
  box(SW + 0.3, 0.25, D + 0.3, std(0x222429), SCX, SH + 0.12, FZ - D / 2);
  // yellow fascia band wrapping the front and the far end
  box(SW + 0.3, 0.85, 0.22, std(SAS.yellow, { roughness: 0.5 }), SCX, SH + 0.42, FZ + 0.12);
  box(0.22, 0.85, D + 0.3, std(SAS.yellow, { roughness: 0.5 }), SX1 - 0.12, SH + 0.42, FZ - D / 2);
  plane(5.2, 0.8, new THREE.MeshStandardMaterial({ map: delightTex, roughness: 0.5 }), SX0 - 4.4, SH + 0.42, FZ + 0.24);
  // blue louvre strip under the fascia
  box(SW - 6, 0.75, 0.12, std(0xffffff, { map: louvreTex, roughness: 0.6 }), SX1 + (SW - 6) / 2, SH - 0.38, FZ + 0.07);
  // glass shopfront with lit shelves
  const shopGlow = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4dc, emissiveIntensity: 0.55, roughness: 0.2 });
  const shelfTex = tex(512, 256, (g, w, h) => {
    g.fillStyle = "#f6f1e6"; g.fillRect(0, 0, w, h);
    const cols = ["#db342e", "#1f5fc8", "#f0b323", "#2ba24a", "#7a3bb5", "#ff7a1a"];
    for (let r = 0; r < 4; r++) { g.fillStyle = "#b9b4aa"; g.fillRect(0, 40 + r * 54, w, 5); for (let x = 6; x < w; x += 14) { g.fillStyle = cols[(x + r * 7) % 6]; g.fillRect(x, 12 + r * 54, 10, 26); } }
  });
  shopGlow.map = shelfTex; shopGlow.emissiveMap = shelfTex;
  plane(6.4, 2.5, shopGlow, SX0 - 3.6, 1.35, FZ + 0.03);
  for (let i = 0; i <= 4; i++) box(0.06, 2.6, 0.08, frameMat, SX0 - 0.4 - i * 1.6, 1.35, FZ + 0.06, scene, false);
  // round night-service window
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.08, 10, 40), std(0xc9a24a, { metalness: 0.5, roughness: 0.4 }));
  ring.position.set(SX0 - 9.2, 1.45, FZ + 0.06); scene.add(ring);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.72, 40), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe39a, emissiveIntensity: 0.5 }));
  disc.position.set(SX0 - 9.2, 1.45, FZ + 0.04); scene.add(disc);
  // cream tiled panels + service door on the far end of the frontage
  plane(9, 2.7, std(0xffffff, { map: tilePanelTex, roughness: 0.6 }), SX1 + 4.6, 1.35, FZ + 0.03);
  plane(1.2, 1.0, std(0x1a1a1a), SX1 + 5.2, 0.9, FZ + 0.05);
  plane(0.5, 0.6, std(0xdb342e), SX1 + 2.6, 0.9, FZ + 0.05);

  // forecourt canopy
  const CX = -17, CZ = 12.5, CW = 17, CD = 9.5, CH = 5.0;
  const canopy = new THREE.Group(); scene.add(canopy);
  box(CW, 0.18, CD, std(0xeef0f3, { roughness: 0.6 }), 0, CH, 0, canopy); // white soffit
  box(CW + 0.6, 0.85, 0.4, std(SAS.blue, { roughness: 0.35 }), 0, CH + 0.45, CD / 2 + 0.2, canopy);
  box(CW + 0.6, 0.85, 0.4, std(SAS.blue, { roughness: 0.35 }), 0, CH + 0.45, -CD / 2 - 0.2, canopy);
  box(0.4, 0.85, CD + 0.8, std(SAS.blue, { roughness: 0.35 }), CW / 2 + 0.3, CH + 0.45, 0, canopy);
  box(0.4, 0.85, CD + 0.8, std(SAS.blue, { roughness: 0.35 }), -CW / 2 - 0.3, CH + 0.45, 0, canopy);
  box(CW + 0.4, 0.2, CD + 0.4, std(0x163f8a), 0, CH + 0.95, 0, canopy); // roof
  const led = new THREE.MeshBasicMaterial({ color: 0x5fb4ff });
  box(CW + 0.62, 0.06, 0.42, led, 0, CH + 0.1, CD / 2 + 0.21, canopy, false);
  box(0.42, 0.06, CD + 0.82, led, CW / 2 + 0.31, CH + 0.1, 0, canopy, false);
  // sasol sign panels on the canopy fascia (road side + Campo St side)
  const logoMat = new THREE.MeshStandardMaterial({ map: sasolLogoTex("#f2f4f7"), roughness: 0.4 });
  plane(4.2, 1.0, logoMat, 0, CH + 0.48, CD / 2 + 0.42, 0, 0, canopy);
  plane(3.2, 0.78, logoMat, CW / 2 + 0.52, CH + 0.48, 0, Math.PI / 2, 0, canopy);
  // downlights
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) plane(0.5, 0.5, new THREE.MeshBasicMaterial({ color: 0xffffff }), -CW / 2 + 2.2 + i * 4.2, CH - 0.1, -CD / 2 + 1.7 + j * 3, 0, Math.PI / 2, canopy);
  canopy.position.set(CX, 0, CZ);
  // columns, pump islands, dispensers, bollards and bins
  const colMat = std(SAS.white, { roughness: 0.4, metalness: 0.2 });
  const colBand = std(SAS.blue, { roughness: 0.35 });
  const islandMat = std(0xb9bcc2, { roughness: 0.8 });
  const bollardMat = std(0x9fa4ab, { metalness: 0.7, roughness: 0.3 });
  const bandMat = std(0xf0b323, { roughness: 0.5 });
  const numTex = (n) => tex(128, 128, (g) => { g.fillStyle = "#1f5fc8"; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.fillStyle = "#fff"; g.font = "800 72px Manrope, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(n), 64, 68); });
  let pumpNo = 1;
  [-5.5, 0, 5.5].forEach((dx) => {
    [-2.4, 2.4].forEach((dz) => {
      const x = CX + dx, z = CZ + dz;
      box(1.0, 0.18, 4.2, islandMat, x, 0.09, z);
      const col = cyl(0.28, 0.28, CH - 0.2, colMat, x, (CH - 0.2) / 2 + 0.18, z - 1.2, 20);
      cyl(0.3, 0.3, 1.1, colBand, x, CH - 0.7, z - 1.2, 20);
      const nm = plane(0.42, 0.42, new THREE.MeshStandardMaterial({ map: numTex(pumpNo++), transparent: true }), x, 3.4, z - 1.2 + 0.31);
      // dispenser
      box(0.55, 1.75, 1.0, std(0xf4f5f7, { roughness: 0.4 }), x, 1.05, z + 0.6);
      box(0.57, 0.5, 1.02, std(SAS.blue), x, 1.7, z + 0.6, scene, false);
      [0x2ba24a, 0xf0b323, 0xdb342e, 0x1a1a1a].forEach((c, k) => { box(0.6, 0.12, 0.08, std(c), x, 0.9, z + 0.25 + k * 0.22, scene, false); });
      // U-shaped yellow-banded bollards at both ends
      [z - 2.0, z + 2.0].forEach((bz) => {
        const u = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 8, 16, Math.PI), bollardMat); u.position.set(x, 0.8, bz); u.rotation.y = Math.PI / 2; u.castShadow = true; scene.add(u);
        cyl(0.05, 0.05, 0.62, bollardMat, x, 0.49, bz - 0.32, 8); cyl(0.05, 0.05, 0.62, bollardMat, x, 0.49, bz + 0.32, 8);
        cyl(0.055, 0.055, 0.1, bandMat, x, 0.6, bz - 0.32, 8); cyl(0.055, 0.055, 0.1, bandMat, x, 0.6, bz + 0.32, 8);
      });
      cyl(0.22, 0.2, 0.7, std(0x1f5fc8, { roughness: 0.5 }), x + 0.75, 0.35, z - 1.6, 14); // blue bin
    });
  });
  const canopyLight = new THREE.PointLight(0xeaf3ff, 2.4, 22, 1.6); canopyLight.position.set(CX, CH - 0.6, CZ); scene.add(canopyLight);

  // tall Sasol pylon at the Atlas Road entrance
  const pyl = new THREE.Group(); scene.add(pyl);
  box(1.3, 7.2, 0.35, std(SAS.white, { roughness: 0.4 }), 0, 3.6, 0, pyl);
  box(1.34, 7.2, 0.12, std(SAS.blue, { roughness: 0.35 }), 0.5, 3.6, 0.13, pyl, false);
  const pLogo = tex(160, 512, (g, w, h) => {
    g.fillStyle = "#f2f4f7"; g.fillRect(0, 0, w, h);
    g.save(); g.translate(w / 2 + 12, h * 0.34); g.rotate(-Math.PI / 2); g.fillStyle = "#1f5fc8"; g.font = "700 64px Manrope, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("sasol", 0, 0); g.restore();
    [[80, 380, 22], [50, 420, 14], [112, 430, 16], [80, 470, 12]].forEach(([x, y, r]) => { g.fillStyle = "#1f5fc8"; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
  });
  plane(1.0, 3.2, new THREE.MeshStandardMaterial({ map: pLogo, roughness: 0.4 }), -0.1, 5.2, 0.18, 0, 0, pyl);
  const priceTex = tex(256, 256, (g, w, h) => {
    g.fillStyle = "#11131a"; g.fillRect(0, 0, w, h);
    g.font = "700 30px Manrope, Arial"; g.textBaseline = "middle";
    [["93", "#2ba24a"], ["95", "#db342e"], ["D", "#f0b323"]].forEach(([l, c], i) => { g.fillStyle = c; g.fillRect(14, 30 + i * 76, 54, 50); g.fillStyle = "#fff"; g.fillText(l, 24, 56 + i * 76); g.fillStyle = "#ff8a1a"; g.font = "700 40px 'Courier New', monospace"; g.fillText("--.--", 90, 56 + i * 76); g.font = "700 30px Manrope, Arial"; });
  });
  plane(1.0, 1.0, new THREE.MeshStandardMaterial({ map: priceTex, emissive: 0xffffff, emissiveMap: priceTex, emissiveIntensity: 0.4 }), -0.1, 2.6, 0.18, 0, 0, pyl);
  pyl.position.set(-29, 0, ROADZ - 8.6); pyl.rotation.y = 0.85;

  // palms along the verge
  const frondMat = std(0x3f6b2a, { roughness: 0.9, side: THREE.DoubleSide });
  const frondGeo = new THREE.PlaneGeometry(0.5, 2.6); frondGeo.translate(0, 1.3, 0);
  function palm(x, z, h) {
    const trunk = cyl(0.16, 0.24, h, std(0x7a6450, { roughness: 1 }), x, h / 2, z, 10);
    for (let i = 0; i < 9; i++) {
      const f = new THREE.Mesh(frondGeo, frondMat);
      f.position.set(x, h, z); f.rotation.set(0, (i / 9) * Math.PI * 2, 1.05 + (i % 3) * 0.15, "YXZ"); f.castShadow = true; scene.add(f);
    }
  }
  palm(-30, ROADZ - 9.5, 6.5); palm(-8, ROADZ - 9.2, 5.6); palm(12, ROADZ - 9.0, 6.2); palm(-36, 2, 7);

  /* ---------- lighting ---------- */
  scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x6a5a48, 0.85));
  const sun = new THREE.DirectionalLight(0xffe2b8, 2.1);
  sun.position.set(-14, 18, 16);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isSmall ? 2048 : 4096, isSmall ? 2048 : 4096);
  Object.assign(sun.shadow.camera, { left: -34, right: 22, top: 24, bottom: -16, near: 1, far: 90 });
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  const warmFill = new THREE.DirectionalLight(0xffb070, 0.45); warmFill.position.set(16, 6, 10); scene.add(warmFill);
  const interiorFill = new THREE.PointLight(0xfff0d8, 2.2, 12, 1.4); interiorFill.position.set(-2.0, 2.6, 1.4); IN.add(interiorFill);

  /* ---------- views + hotspots ---------- */
  const VIEWS = {
    overview: { pos: [16, 11, 30], target: [-6, 2.0, 4], title: "254 Atlas Road", text: "Mochachos sits on the Sasol Atlas Road forecourt in Beyers Park, Boksburg. Drag to walk around, or tap a marker to step inside.", inside: false },
    garage: { pos: [4, 2.6, 24], target: [-14, 2.6, 6], title: "Sasol Atlas Road", text: "Fill up and grab lunch in one stop. Mochachos is at the end of the Sasol shop row, right off the forecourt.", inside: false },
    street: { pos: [0, 2.0, 18], target: [0, 3.0, 3], title: "Shopfront", text: "Look for the red Mochachos letters and the chief on the roof. Parking is right out front on the pavers.", inside: false },
    deck: { pos: [-4.6, 1.7, 10.2], target: [0.5, 1.2, 5.2], title: "Outdoor deck", text: "Tables under the black Mochachos umbrellas, behind the hedges and steel rails. Great for a sunny lunch.", inside: false },
    counter: { pos: [1.8, 1.75, 3.1], target: [-1.6, 1.6, -3.0], title: "Order counter", text: "Place your order, collect it, or pick up a delivery. The menu boards and the grill are right behind.", inside: true },
    tiles: { pos: [-2.6, 1.65, 2.6], target: [4.4, 1.6, -0.6], title: "Tile wall & Aztec symbol", text: "The patchwork tile wall, the teal door and the big red Aztec symbol. Booth seats by the window.", inside: true },
    mural: { pos: [14, 2.1, 3.5], target: [6, 1.7, -1.6], title: "Aztec sun mural", text: "The hand-painted Aztec sun on the side wall, beside the gate.", inside: false }
  };
  const HOTSPOTS = [
    { view: "street", at: [0, 5.6, 4.1] },
    { view: "deck", at: [-4, 1.4, 5.6] },
    { view: "counter", at: [-1.6, 1.7, -2.2] },
    { view: "tiles", at: [3.0, 2.0, -1.6] },
    { view: "mural", at: [6.2, 1.8, -2.2] },
    { view: "garage", at: [-17, 5.5, 17.6] }
  ];
  const hotspotEls = HOTSPOTS.map((h, i) => {
    const b = document.createElement("button");
    b.className = "hotspot"; b.type = "button"; b.textContent = String(i + 1);
    b.setAttribute("aria-label", "Go to " + VIEWS[h.view].title);
    b.addEventListener("click", () => goTo(h.view));
    host.appendChild(b);
    return b;
  });

  const info = document.querySelector("[data-store-info]");
  const chips = document.querySelectorAll("[data-view]");
  let tween = null;
  let current = "overview";
  function limitsFor(v) {
    if (v.inside) { controls.minDistance = 0.4; controls.maxDistance = 6.5; }
    else { controls.minDistance = 3; controls.maxDistance = 55; }
  }
  function goTo(name, instant) {
    const v = VIEWS[name]; if (!v) return;
    current = name;
    chips.forEach((c) => c.classList.toggle("is-on", c.dataset.view === name));
    if (info) info.innerHTML = `<h3>${v.title}</h3><p>${v.text}</p>` + (name === "counter" ? '<button class="btn btn-fire btn-sm store-info-btn" data-counter-open><span>Open the counter menu</span></button>' : "");
    if (name === "counter") setTimeout(() => window.dispatchEvent(new CustomEvent("counter:open", { detail: { cat: "pollo" } })), reduceMotion ? 0 : 1500);
    const toP = new THREE.Vector3(...v.pos), toT = new THREE.Vector3(...v.target);
    controls.minDistance = 0.1; controls.maxDistance = 60; // free during the move
    if (instant || reduceMotion) { camera.position.copy(toP); controls.target.copy(toT); limitsFor(v); controls.update(); return; }
    tween = { fromP: camera.position.clone(), fromT: controls.target.clone(), toP, toT, t0: performance.now(), dur: 1600, v };
    if (name !== "overview") setAuto(false);
  }
  chips.forEach((c) => c.addEventListener("click", () => goTo(c.dataset.view)));

  const autoBtn = document.querySelector("[data-autorotate]");
  function setAuto(on) {
    controls.autoRotate = on;
    if (autoBtn) { autoBtn.setAttribute("aria-pressed", String(on)); autoBtn.textContent = on ? "Auto-rotate on" : "Auto-rotate off"; }
  }
  if (autoBtn) autoBtn.addEventListener("click", () => { if (!controls.autoRotate && VIEWS[current].inside) goTo("overview"); setAuto(!controls.autoRotate); });
  setAuto(!reduceMotion);
  controls.addEventListener("start", () => { if (tween) { limitsFor(tween.v); tween = null; } });

  goTo("overview", true);

  /* ---------- tap the menu boards or counter to order ---------- */
  const orderables = [];
  scene.traverse((o) => { if (o.isMesh && o.userData.order) orderables.push(o); });
  const tapRay = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  const hit = (e) => {
    const b = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
    tapRay.setFromCamera(ndc, camera);
    const h = tapRay.intersectObjects(scene.children, true).find((i) => i.object.visible !== false && !(i.object.material && i.object.material.transparent && i.object.material.opacity < 0.3));
    return h && h.object.userData.order ? h.object.userData.order : null;
  };
  renderer.domElement.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const cat = hit(e);
    if (cat) { setAuto(false); window.dispatchEvent(new CustomEvent("counter:open", { detail: { cat } })); }
  });
  if (matchMedia("(pointer: fine)").matches) {
    let lastMove = 0;
    renderer.domElement.addEventListener("pointermove", (e) => {
      const now = performance.now(); if (now - lastMove < 80 || e.buttons) return; lastMove = now;
      renderer.domElement.style.cursor = hit(e) ? "pointer" : "";
    });
  }

  /* ---------- sizing + loop ---------- */
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 600 ? 60 : 45;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();

  const tmp = new THREE.Vector3();
  const ray = new THREE.Raycaster();
  const occluded = HOTSPOTS.map(() => false);
  let frameNo = 0;
  const solids = [];
  scene.traverse((o) => { if (o.isMesh && !(o.material && o.material.wireframe) && !(o.material && o.material.alphaTest > 0)) solids.push(o); });
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(host);

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    if (tween) {
      const t = Math.min(1, (now - tween.t0) / tween.dur), k = ease(t);
      camera.position.lerpVectors(tween.fromP, tween.toP, k);
      controls.target.lerpVectors(tween.fromT, tween.toT, k);
      if (t >= 1) { limitsFor(tween.v); tween = null; }
    }
    controls.update();
    camera.position.y = Math.max(0.5, camera.position.y);
    renderer.render(scene, camera);

    const w = host.clientWidth, h = host.clientHeight;
    frameNo++;
    HOTSPOTS.forEach((hs, i) => {
      const el = hotspotEls[i];
      tmp.set(...hs.at);
      const dist = tmp.distanceTo(camera.position);
      if (frameNo % 8 === i) {
        const dir = tmp.clone().sub(camera.position).normalize();
        ray.set(camera.position, dir); ray.far = dist - 0.35;
        occluded[i] = ray.intersectObjects(solids, false).length > 0;
      }
      tmp.project(camera);
      const off = tmp.z > 1 || Math.abs(tmp.x) > 1.02 || Math.abs(tmp.y) > 1.02 || hs.view === current || occluded[i] || (VIEWS[current].inside && dist > 9);
      el.classList.toggle("is-hidden", off);
      if (!off) el.style.transform = `translate(${(tmp.x * 0.5 + 0.5) * w}px, ${(-tmp.y * 0.5 + 0.5) * h}px)`;
    });
  }
  requestAnimationFrame(frame);

  const loading = host.querySelector("[data-store-loading]");
  if (loading) loading.hidden = true;
}
