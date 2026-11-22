// /api/settings
//   GET (public) prep times, busy and pause state (the checkout uses it for quoted times)
//   PUT (staff)  { prepMins, deliveryMins, busyMins, pauseMins, deliveryFee }
import { configured, redis, body, isStaff, getSettings } from "./_store.js";

export default async function handler(req, res) {
  if (!configured()) return res.status(503).json({ error: "Not configured", demo: true });
  try {
    if (req.method === "GET") return res.status(200).json({ settings: await getSettings() });
    if (req.method === "PUT") {
      if (!isStaff(req)) return res.status(401).json({ error: "Staff PIN required" });
      const b = body(req), s = await getSettings(), now = Date.now();
      const num = (v, lo, hi) => Math.min(hi, Math.max(lo, parseInt(v, 10) || 0));
      if (b.prepMins !== undefined) s.prepMins = num(b.prepMins, 5, 90);
      if (b.deliveryMins !== undefined) s.deliveryMins = num(b.deliveryMins, 5, 120);
      if (b.busyMins !== undefined) { s.busyMins = num(b.busyMins, 0, 60); s.busyUntil = s.busyMins ? now + 3600000 : 0; } // busy mode resets after an hour
      if (b.pauseMins !== undefined) s.pausedUntil = b.pauseMins ? now + num(b.pauseMins, 0, 600) * 60000 : 0;
      if (b.deliveryFee !== undefined) s.deliveryFee = b.deliveryFee === null || b.deliveryFee === "" ? null : Math.max(0, Number(b.deliveryFee) || 0);
      await redis("SET", "settings", JSON.stringify(s));
      return res.status(200).json({ settings: s });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}
