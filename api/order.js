// /api/order?id=MA-1234A
//   GET    ?token=…  (customer) track an order
//   POST   ?token=…  (customer) { arrived: { spot, car } } or { message }
//   PATCH            (staff)    { status } | { undo: true } | { message } | { read: true }
import { configured, body, clean, isStaff, getOrder, saveOrder, STATUSES, publicOrder } from "./_store.js";

const FLOW = { pickup: ["new", "grill", "ready", "done"], delivery: ["new", "grill", "ready", "out", "done"] };

export default async function handler(req, res) {
  if (!configured()) return res.status(503).json({ error: "Order system not configured", demo: true });
  const id = clean(req.query?.id, 12).toUpperCase();
  try {
    const o = await getOrder(id);
    if (!o) return res.status(404).json({ error: "Order not found" });
    const staff = isStaff(req);
    const customer = req.query?.token && req.query.token === o.token;
    const b = body(req);
    const now = Date.now();

    if (req.method === "GET") {
      if (!customer && !staff) return res.status(403).json({ error: "Not allowed" });
      if (customer && o.unreadCustomer) { o.unreadCustomer = 0; await saveOrder(o); }
      return res.status(200).json({ order: publicOrder(o) });
    }
    if (req.method === "POST") {
      if (!customer) return res.status(403).json({ error: "Not allowed" });
      if (b.arrived) {
        o.arrived = { t: now, spot: clean(b.arrived.spot, 40), car: clean(b.arrived.car, 60) };
        o.unreadStaff = (o.unreadStaff || 0) + 1;
      }
      const text = clean(b.message, 400);
      if (text) { o.messages.push({ from: "customer", text, t: now }); o.unreadStaff = (o.unreadStaff || 0) + 1; }
      await saveOrder(o);
      return res.status(200).json({ order: publicOrder(o) });
    }
    if (req.method === "PATCH") {
      if (!staff) return res.status(401).json({ error: "Staff PIN required" });
      if (b.undo && o.history.length > 1) { o.history.pop(); o.status = o.history[o.history.length - 1].s; }
      else if (b.status && STATUSES.includes(b.status) && (b.status === "cancelled" || FLOW[o.type].includes(b.status))) {
        o.status = b.status; o.history.push({ s: b.status, t: now });
      }
      const text = clean(b.message, 400);
      if (text) { o.messages.push({ from: "store", text, t: now }); o.unreadCustomer = (o.unreadCustomer || 0) + 1; }
      if (b.read) o.unreadStaff = 0;
      await saveOrder(o);
      return res.status(200).json({ order: o });
    }
    res.setHeader("Allow", "GET, POST, PATCH");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}
