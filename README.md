# Mochachos Atlas Road — website

**Live demo:** https://onlinepixelcode-collab.github.io/mochachos-atlas-demo/ (GitHub Pages, public). On GitHub Pages the `api/` functions don't run, so ordering runs in demo mode (dashboard PIN 1234) and Amigo uses its built-in answers. A password-protected Netlify setup is also included (`netlify.toml`, `netlify/edge-functions/gate.ts`) if a private preview is needed later.

A multipage site for the Mochachos branch at 254 Atlas Road, Beyers Park, Boksburg (on the Sasol forecourt).

## Pages
| Page | What's on it |
|---|---|
| `index.html` | Dish-carousel banner over live flames, popular items, Explore cards, Zee Flavours, why Atlas Road |
| `menu.html` | Flip-book menu, printed menu lightbox, full searchable priced menu |
| `dishes.html` | Every dish as its own card: category tiles, filters, search, sort, meat-free toggle (`?cat=burgers` links straight to a category) |
| `dish.html?id=…` | One page per dish: sizes, Zee Flavour, quantity, add to tray, related dishes |
| `order.html` | Ways to order, spin the wheel, feed the crew |
| `groups.html` | Family boards, group order planner, call to book |
| `visit.html` | Address, hours, map, 3D store with the Sasol forecourt, and **ordering at the 3D counter** |
| `arcade.html` | Flame Catcher, an original catch-the-food game over a live grill, with high score and a "refuel" dish |
| `about.html` | The Mochachos story since 1994, values, the Atlas Road branch, FAQ |
| `checkout.html` | "Fiesta Express" checkout: pickup or delivery, ASAP or a scheduled slot, pay on collection |
| `track.html` | Live order tracker: grill progress, ETA, "I'm here" arrival button, chat with the store |
| `dashboard.html` | **Staff dashboard ("The Pass")**, PIN protected and hidden from search engines |

## Editing pages (build step)
The pages in the project root are generated. Edit the sources instead, then rebuild:
- `src/pages/<name>.html` holds each page's content (first line is a meta comment with title, description, nav item and scripts).
- `src/partials/` holds the shared head, header, footer, tray and chat.

```bash
python3 tools/build.py
```
This needs only Python 3 (no packages) and rewrites the `.html` files in the root.

## What's on it
- **Live open/closed status** in South African time, including the Friday 12:15–13:30 prayer closure.
- **Full 2026 menu with prices** (`assets/data/menu.json`), searchable, with an **order tray** that totals the order so customers can call it through or read it out at the counter.
- **Zee Flavours heat meter** (Lemon & Herb → Dynamite).
- **Interactive 3D model of the Atlas Road branch** (`assets/js/store3d.js`, Three.js): roof sign, deck, side mural, and inside to the counter and tile wall.
- **"Ask Amigo" AI assistant**: knows the hours, address, halaal status and every price; adds dishes to the tray when asked ("add 2 chicken burritos"), shows dish cards with Add buttons, reads back the tray, takes voice input, and remembers the chat across pages. With the API key it uses Claude with tools; without it, a built-in fallback does the same.
- **Real-time flames** (`assets/js/fire.js`): a WebGL fire shader with smoke and embers in the hero, the flavours section and the footer. The flames grow with the Zee Flavour heat level, and on desktop the cursor throws sparks. Turned off for visitors who prefer reduced motion.
- **Flip-book menu** (page-flip 2.0.7) built from the same menu data, plus the printed menu in a zoomable lightbox.
- **Spin the wheel** (random meal, add to tray) and **Feed the crew** (pick people and appetite, get a priced order you can add to the tray in one tap).

## Ordering system
**Customers:** tray → `checkout.html` → `track.html`.
- Pickup or delivery, ASAP or a 15-minute slot (only trading hours; Friday prayers are skipped automatically).
- Pay with cash or card when the food is handed over (no online payment).
- Details are remembered on the device; "Same again?" re-adds the last order in one tap.
- The tracker updates live: Received → On the grill → Ready → (Out for delivery) → Collected/Delivered, with an ETA, sounds, optional browser notifications and a chat with the store.
- Pickup customers tap **"I'm here"** (where they're parked + car), and the kitchen sees it on the ticket.
- A live banner on every page links back to an active order. "Message the store" on the Visit page goes to the dashboard inbox.

**Staff dashboard (`dashboard.html`)**
- Columns: New → On the grill → Ready → Out for delivery, plus "Completed today" with placed → done times.
- Ticket timers turn green → amber → red (thresholds follow the prep time), late tickets glow.
- "All day" panel counts every item still to cook across tickets.
- One tap moves a ticket on; the final step is **press-and-hold to complete** (fire fills the button, the ticket bursts). Every move can be undone, and completed orders can be brought back.
- Keyboard "bump bar": ← → select, Enter = next step, U = undo.
- New-order chime and toasts, arrival and message alerts, order chat with quick replies, website inbox, print ticket, search, pickup/delivery filter.
- **Busy mode** (+5 to +30 min on quoted times, resets after an hour) and a timed **pause** for online orders.
- Settings: prep time, delivery time, delivery fee (blank = "confirmed by the store").

**Going live (Vercel):**
1. In Vercel, add the **Upstash Redis** (KV) integration to the project. It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or set `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`).
2. Add `DASHBOARD_PIN` (the staff PIN).
3. Redeploy. `/api/health` returns `{"live": true}` when it's connected.

The server re-prices every order from `assets/data/menu.json`, so prices can't be changed in the browser, and it checks trading hours, pause state and phone numbers.

**Demo mode:** with no database connected, the whole system still works inside one browser (orders sync between tabs instantly). Open `checkout.html` in one tab and `dashboard.html` in another; the demo PIN is **1234**, and "Simulate order" creates test orders.

## Fire effects (`assets/js/fx.js`, on every page)
- **Heat dial** in the top bar (Lemon & Herb → Dynamite), saved for the whole site and linked to the Zee Flavours meter. Every flame follows it.
- **Dynamite mode** at full heat: flames along the bottom of the screen, rising embers, heat-haze headings, a pulsing red glow.
- **Fire sound**: a live crackle generated with Web Audio, off by default, louder with more heat.
- **Burning page transitions** (WebGL): leaving a page, a wall of live flames with sparks surges up and engulfs the screen; arriving, the new page burns through the char like paper with glowing edges while the Mochachos logo flickers and burns off. A tiny script in `<head>` covers the screen before first paint so there's no flash. Falls back to a CSS flame wall without WebGL.
- **Heat haze** on the hero dish and dish photos, and **grill marks** that sear across dish photos on hover.
All motion effects switch off for visitors who prefer reduced motion.

## Run locally
```bash
python3 -m http.server 5173
```
Then open http://localhost:5173 (the home page) and use the nav to move between pages. (The menu loads from JSON, so open it through a server, not by double-clicking the file.)

## Deploy (Vercel)
1. Push this folder to a Git repo and import it in Vercel. No build step is needed.
2. In the Vercel project settings, add the environment variable `ANTHROPIC_API_KEY`.
3. Optional: `ANTHROPIC_MODEL` (defaults to `claude-haiku-5-5`).

Without the key, Amigo still works: it falls back to built-in answers from the same menu and store facts.

## Updating
- **Prices / items:** edit `assets/data/menu.json`. The menu, the tray and the AI all read from it.
- **Hours:** `HOURS` in `assets/js/main.js`, the hours table in `src/pages/visit.html` and `src/pages/about.html`, `src/partials/footer.html`, and `STORE_FACTS` in `api/chat.js`.
- **Header / footer / nav:** edit `src/partials/` (nav items are in `tools/build.py`), then rebuild.

## To confirm with the owner before launch
- Whether they deliver themselves (and the delivery fee and area), or keep delivery on Uber Eats / Mr D only.
- Who uses the dashboard (a tablet at the counter works well) and the staff PIN.
- Direct Uber Eats and Mr D store links (currently a search link and the Mr D home page).
- Real photos of the Atlas Road store to add to the site (place them in `assets/img/atlas/`).
- Food photos and the logo come from the Mochachos franchise site; check the franchise's brand rules for local store sites.
