// /api/orders
//   POST  (public)  place an order        -> { id, token, eta }
//   GET   (staff)   list recent orders    -> { orders, settings, unread }
import { configured, redis, body, clean, isStaff, getSettings, saveOrder, getOrder, priceLine, newId, newToken, isOpenAt, publicOrder } from "./_store.js";

export default async function handler(req, res) {
  if (!configured()) return res.status(503).json({ error: "Order system not configured", demo: true });
  try {
    if (req.method === "POST") return create(req, res);
    if (req.method === "GET") {
      if (!isStaff(req)) return res.status(401).json({ error: "Staff PIN required" });
      const ids = (await redis("LRANGE", "orders", 0, 199)) || [];
      const raws = ids.length ? await redis("MGET", ...ids.map((i) => `order:${i}`)) : [];
      const orders = raws.filter(Boolean).map((r) => JSON.parse(r));
      const unread = parseInt((await redis("GET", "msgs:unread")) || "0", 10);
      return res.status(200).json({ orders, settings: await getSettings(), unread });
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}

async function create(req, res) {
  const b = body(req);
  const settings = await getSettings();
  const now = Date.now();
  if (settings.pausedUntil && now < settings.pausedUntil) return res.status(409).json({ error: "We've paused online orders for a few minutes. Please call 010 448 0666." });

  const type = b.type === "delivery" ? "delivery" : "pickup";
  const name = clean(b.customer?.name, 60);
  const phone = clean(b.customer?.phone, 20).replace(/[^\d+]/g, "");
  if (name.length < 2) return res.status(400).json({ error: "Please add your name." });
  if (!/^(\+27|0)\d{9}$/.test(phone)) return res.status(400).json({ error: "Please add a valid SA phone number." });
  const address = type === "delivery" ? clean(b.address, 200) : "";
  if (type === "delivery" && address.length < 6) return res.status(400).json({ error: "Please add your delivery address." });

  const items = [];
  for (const it of Array.isArray(b.items) ? b.items.slice(0, 40) : []) {
    const line = priceLine(clean(it.name, 120));
    const qty = Math.min(30, Math.max(1, parseInt(it.qty, 10) || 1));
    if (line) items.push({ name: line.name, price: line.price, qty });
  }
  if (!items.length) return res.status(400).json({ error: "Your tray is empty." });

  // timing: ASAP only while open; scheduled must be in trading hours, today or tomorrow
  let when = "asap";
  const prep = settings.prepMins + settings.busyMins + (type === "delivery" ? settings.deliveryMins : 0);
  if (b.when && b.when !== "asap") {
    const t = Date.parse(b.when);
    if (!t || t < now + 10 * 60000 || t > now + 36 * 3600000 || !isOpenAt(new Date(t))) return res.status(400).json({ error: "Please pick a time when we're open." });
    when = new Date(t).toISOString();
  } else if (!isOpenAt(new Date())) {
    return res.status(400).json({ error: "We're closed right now. Schedule your order for when we're open." });
  }
  const etaAt = when === "asap" ? now + prep * 60000 : Date.parse(when);

  const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
  const fee = type === "delivery" && typeof settings.deliveryFee === "number" ? settings.deliveryFee : 0;
  let id = newId();
  for (let i = 0; i < 5 && (await getOrder(id)); i++) id = newId();
  const order = {
    id, token: newToken(), createdAt: now, status: "new", history: [{ s: "new", t: now }],
    type, when, etaAt, customer: { name, phone }, address,
    notes: clean(b.notes, 300), payment: b.payment === "card" ? "card" : "cash",
    car: clean(b.car, 60), items, subtotal, deliveryFee: type === "delivery" ? settings.deliveryFee : null, total: Math.round((subtotal + fee) * 100) / 100,
    arrived: null, messages: [], unreadStaff: 0, unreadCustomer: 0
  };
  await saveOrder(order);
  await redis("LPUSH", "orders", id);
  await redis("LTRIM", "orders", 0, 499);
  return res.status(201).json({ id, token: order.token, etaAt, order: publicOrder(order) });
}
