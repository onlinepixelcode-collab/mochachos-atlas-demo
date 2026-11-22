// /api/health — tells the site whether the live order system is connected.
import { configured } from "./_store.js";
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(configured() ? 200 : 503).json({ live: configured(), staffPin: Boolean(process.env.DASHBOARD_PIN) });
}
