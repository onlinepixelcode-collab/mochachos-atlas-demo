// Shared helpers for the order system (files starting with "_" are not routes on Vercel).
// Storage: Upstash Redis over its REST API (works with Vercel's Upstash/KV integration).
// Env: KV_REST_API_URL + KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN),
//      DASHBOARD_PIN (staff PIN for the dashboard).
import { createRequire } from "module";
const require = createRequire(import.meta.url);
export const MENU = require("../assets/data/menu.json");

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
export const configured = () => Boolean(URL_ && TOKEN);

export async function redis(...cmd) {
  const r = await fetch(URL_, { method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

export const STATUSES = ["new", "grill", "ready", "out", "done", "cancelled"];
export const DEFAULT_SETTINGS = { prepMins: 15, deliveryMins: 25, busyMins: 0, busyUntil: 0, pausedUntil: 0, deliveryFee: null };

export async function getSettings() {
  const raw = await redis("GET", "settings");
  const s = { ...DEFAULT_SETTINGS, ...(raw ? JSON.parse(raw) : {}) };
  const now = Date.now();
  if (s.busyUntil && now > s.busyUntil) { s.busyMins = 0; s.busyUntil = 0; }
  return s;
}
export async function getOrder(id) { const raw = await redis("GET", `order:${id}`); return raw ? JSON.parse(raw) : null; }
export async function saveOrder(o) { await redis("SET", `order:${o.id}`, JSON.stringify(o), "EX", 60 * 60 * 24 * 30); }

export function body(req) {
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  return b || {};
}
export const clean = (x, n) => (typeof x === "string" ? x.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n) : "");
export function isStaff(req) {
  const pin = process.env.DASHBOARD_PIN;
  return Boolean(pin) && req.headers["x-staff-pin"] === pin;
}

/* ---------- trading hours (South African time) ---------- */
const HOURS = { 0: [[600, 1200]], 1: [[600, 1200]], 2: [[600, 1200]], 3: [[600, 1200]], 4: [[600, 1200]], 5: [[600, 735], [810, 1260]], 6: [[600, 1260]] };
export function saParts(date = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Johannesburg", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(date).map((x) => [x.type, x.value]));
  return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday), mins: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10) };
}
export function isOpenAt(date) { const { day, mins } = saParts(date); return HOURS[day].some(([a, b]) => mins >= a && mins < b); }

/* ---------- pricing: never trust the browser's prices ---------- */
// Tray names look like "Burrito (Chicken)" or "1/2 Chicken (Beeg) · Hot"
export function priceLine(name) {
  const [main, flavour] = String(name).split(" · ");
  const m = main.match(/^(.*?)(?: \(([^()]*)\))?$/);
  const base = m[1], opt = m[2] || "";
  for (const c of MENU.categories) {
    for (const it of c.items) {
      if (it.n !== base && it.n !== main) continue;
      const p = it.n === main ? it.p[0] : it.p.find(([l]) => l === opt);
      if (!p) continue;
      const fl = flavour && MENU.flavours.find((f) => f.name === flavour) ? " · " + flavour : "";
      return { name: it.n + (p[0] ? ` (${p[0]})` : "") + fl, price: p[1] };
    }
  }
  return null;
}
export function newId() { return "MA-" + Math.floor(1000 + Math.random() * 9000) + String.fromCharCode(65 + Math.floor(Math.random() * 26)); }
export function newToken() { return Array.from({ length: 24 }, () => "abcdefghijkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 32)]).join(""); }

// What the customer may see about their order
export function publicOrder(o) {
  const { token, ...rest } = o;
  return rest;
}
