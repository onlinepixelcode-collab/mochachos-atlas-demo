// Vercel serverless function: POST /api/chat
// "Amigo", the AI helper for Mochachos Atlas Road, powered by Claude.
// Amigo can answer questions, show dish cards, and add dishes to the customer's tray (via tools).
// Needs the ANTHROPIC_API_KEY environment variable in the Vercel project.

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const MENU = require("../assets/data/menu.json");

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";

const MENU_TEXT = MENU.categories.map((c) =>
  `## ${c.name} (${c.tag}) — ${c.blurb}\n` +
  c.items.map((it) => `- ${it.n}${it.v ? " [veggie option]" : ""}: ${it.p.map(([l, v]) => (l ? l + " " : "") + "R" + v.toFixed(2)).join(" / ")}${it.d ? " — " + it.d : ""}`).join("\n")
).join("\n\n");
const FLAVOURS = MENU.flavours.map((f) => `${f.name} (heat ${f.heat}/5)`).join(", ");

const STORE_FACTS = `
You are "Amigo", the warm, quick-witted AI helper on the website of Mochachos Atlas Road, a Mochachos (Mexican Chicken Fiesta) franchise store in South Africa. Never use emojis in your replies; plain words only.

Store facts (the only facts you may state as true):
- Address: 254 Atlas Road, Beyers Park, Boksburg, Gauteng. It's on the Sasol Atlas Road forecourt (Atlas Road / M43, at the corner of Campo St), at the end of the Sasol shop row. Parking on the forecourt; please keep the side gate clear.
- Phone: 010 448 0666.
- Trading hours: Monday to Thursday and Sunday 10:00–20:00; Friday and Saturday 10:00–21:00. Closed on Fridays 12:15–13:30 for prayers.
- 100% halaal. Dine-in (deck, teal booth), pick-up, outdoor seating. Also on Uber Eats and Mr D.
- Flame-grilled chicken comes in the Zee Flavours: ${FLAVOURS}.
- "Beeg / Beeger / Beegest" are the Mochachos portion sizes (regular / large / sharing). A "Buddy" is a Coca-Cola Buddy bottle.
- Brand story: the first Mochachos opened in Pretoria in 1994 as Mochachos Steak Villages, one of the first places in SA to serve Mexican food. Chicken is cooked with dry herbs and spices. Values: pride, passion, courage, integrity, family. Also in Botswana, Zambia, Mauritius and Australia.
- Website pages: Home (index.html), Menu book & full price list (menu.html), All dishes (dishes.html), Order (order.html), Groups & parties (groups.html), Visit & 3D store (visit.html; customers can order at the 3D counter), About (about.html).

How to help:
- Replies: 1 to 3 short sentences, friendly South African English, plain text only (no markdown, no bullet lists). An occasional "amigo" is fine.
- Quote prices only from the menu below and add up totals correctly. Prices may change; say so when quoting a total.
- When you recommend or describe specific dishes, call show_items with them (up to 4) so the customer sees cards with Add buttons.
- When the customer clearly asks you to add or order something ("add 2 burritos", "I'll take the family fiesta"), call add_to_tray with the exact menu names and options, then confirm in one sentence. If the option is ambiguous (e.g. chicken or rump steak, single or double), ask first instead of guessing.
- The tray is not a placed order. Ordering happens by calling the store, at the counter, or on Uber Eats / Mr D. Never claim an order has been sent.
- Never invent specials, allergens, ingredients or stock. For allergens, suggest calling 010 448 0666.
- If asked something unrelated to the restaurant, answer very briefly and steer back to food.

MENU (2026 Mochachos South Africa prices, VAT included):
${MENU_TEXT}
`.trim();

const ITEM_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string", description: "Exact menu item name, e.g. 'Burrito' or '1/2 Chicken, Beeg Chips & Buddy'" },
    option: { type: "string", description: "Exact option label if the item has several prices, e.g. 'Chicken', 'Rump steak', 'Single', 'Double', 'Beeg', 'Beeger', 'Beegest'" },
    qty: { type: "integer", minimum: 1, maximum: 20 }
  },
  required: ["name"]
};
const TOOLS = [
  {
    name: "add_to_tray",
    description: "Add menu items to the customer's order tray on the website. Only use when the customer clearly asks to add or order something.",
    input_schema: { type: "object", properties: { items: { type: "array", items: ITEM_SCHEMA, minItems: 1, maxItems: 10 } }, required: ["items"] }
  },
  {
    name: "show_items",
    description: "Show menu dish cards (photo, price, Add button) to the customer. Use when recommending or describing specific dishes.",
    input_schema: { type: "object", properties: { items: { type: "array", items: ITEM_SCHEMA, minItems: 1, maxItems: 4 } }, required: ["items"] }
  }
];

const clean = (x, n) => (typeof x === "string" ? x.slice(0, n) : "");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: "AI not configured" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const raw = Array.isArray(body?.messages) ? body.messages : [];
  let messages = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 800) }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  // merge consecutive same-role turns so the conversation alternates
  messages = messages.reduce((acc, m) => {
    const last = acc[acc.length - 1];
    if (last && last.role === m.role) last.content += "\n" + m.content; else acc.push({ ...m });
    return acc;
  }, []);
  if (!messages.length) return res.status(400).json({ error: "No message" });

  const tray = Array.isArray(body?.tray) ? body.tray.slice(0, 30).map((t) => `${Math.max(1, +t.qty || 1)} x ${clean(t.name, 80)}`).join("; ") : "";
  const context = [
    clean(body?.status, 160) && `Right now (South African time): ${clean(body.status, 160)}`,
    clean(body?.page, 40) && `The customer is on the "${clean(body.page, 40)}" page.`,
    `Customer's tray: ${tray || "empty"}.`
  ].filter(Boolean).join("\n");

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 500, system: STORE_FACTS + "\n\n" + context, tools: TOOLS, messages })
    });
    if (!r.ok) {
      console.error("Anthropic error", r.status, await r.text());
      return res.status(502).json({ error: "Upstream error" });
    }
    const data = await r.json();
    const blocks = data.content || [];
    const reply = blocks.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    const actions = [], items = [];
    for (const b of blocks) {
      if (b.type !== "tool_use" || !Array.isArray(b.input?.items)) continue;
      const list = b.input.items.map((i) => ({ name: clean(i.name, 80), option: clean(i.option, 40), qty: Math.min(20, Math.max(1, parseInt(i.qty, 10) || 1)) }));
      if (b.name === "add_to_tray") actions.push(...list.map((i) => ({ type: "add", ...i })));
      if (b.name === "show_items") items.push(...list.slice(0, 4));
    }
    return res.status(200).json({ reply, actions, items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
