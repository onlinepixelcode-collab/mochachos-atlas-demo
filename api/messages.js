// /api/messages
//   POST  (public) { name, phone, text }  "Message us" form
//   GET   (staff)  list messages
//   PATCH (staff)  ?id=…  { read: true }
import { configured, redis, body, clean, isStaff } from "./_store.js";

export default async function handler(req, res) {
  if (!configured()) return res.status(503).json({ error: "Messages not configured", demo: true });
  try {
    if (req.method === "POST") {
      const b = body(req);
      const name = clean(b.name, 60), phone = clean(b.phone, 20).replace(/[^\d+]/g, ""), text = clean(b.text, 800);
      if (name.length < 2 || text.length < 3) return res.status(400).json({ error: "Please add your name and a message." });
      if (phone && !/^(\+27|0)\d{9}$/.test(phone)) return res.status(400).json({ error: "Please check your phone number." });
      const msg = { id: "M" + Date.now().toString(36), name, phone, text, t: Date.now(), read: false };
      await redis("LPUSH", "msgs", JSON.stringify(msg));
      await redis("LTRIM", "msgs", 0, 299);
      await redis("INCR", "msgs:unread");
      return res.status(201).json({ ok: true });
    }
    if (!isStaff(req)) return res.status(401).json({ error: "Staff PIN required" });
    if (req.method === "GET") {
      const list = ((await redis("LRANGE", "msgs", 0, 199)) || []).map((r) => JSON.parse(r));
      return res.status(200).json({ messages: list });
    }
    if (req.method === "PATCH") {
      const id = clean(req.query?.id, 30);
      const list = ((await redis("LRANGE", "msgs", 0, 299)) || []).map((r) => JSON.parse(r));
      const i = list.findIndex((m) => m.id === id);
      if (i > -1 && !list[i].read) {
        list[i].read = true;
        await redis("LSET", "msgs", i, JSON.stringify(list[i]));
        await redis("SET", "msgs:unread", String(list.filter((m) => !m.read).length));
      }
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}
