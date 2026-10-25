# Live demo script and pitch talking points

## 90-second demo flow

1. Open `pnpm dev` → `http://localhost:5173/`. Show branded header, hero, stats strip, prize grid, countdown banner.
2. Scroll Home: event-details card, schedule preview, recharts restyle. Point out ~4.5 MB full bundle.
3. Open `/register`: fill form, submit → success status. Show `/schedule` room badges + highlight row.
4. Run `pnpm demo:verify` (or show report): slow-3g full `/` takes ~91s / 4.5 MB; lite `/` 1.0s / 3 KB.
5. Show detection: under slow-3g the app switches to `/lite/` automatically (~1s). Manual switch both ways always available (header button + footer link, or `?lite=1` / `?lite=0`).
6. Show report.md: 14/14 essential actions pass on both versions; zero console errors; zero broken links; 99-100% byte reduction.

## DevTools (F12) demo — the one that lands

**Reset before you start.** A remembered manual choice wins over detection: once you
click **Use the full site** (or visit `?lite=0`), the key `fallback-forge-mode=full` is
written to `localStorage` and the detector stops switching in that browser profile — under
3G you then watch the full app's white screen instead of the fallback. Clear it first
(F12 → Console):

```js
localStorage.removeItem('fallback-forge-mode');
```

Or demo in a fresh Incognito window. Never edit footage to hide this — say it out
loud: an explicit visitor choice is respected, detection only decides for visitors
who have not chosen.

1. `pnpm dev`, open `http://localhost:5173/` with the full app visible.
2. Press **F12** → **Network** tab → throttling dropdown → **Slow 3G**.
3. Press **Ctrl+R**. Within ~1 s the page replaces itself with `/lite/?ff=effective-type`:
   same event name, venue, deadline, schedule and registration form, ~3.5 KB of HTML,
   no bundle. Read the URL bar out loud — the reason is in `?ff=`.
4. Click **Use the full site** in the yellow banner: back on the full app, and the
   detector stays quiet (`?lite=0` remembers the choice).
5. Set throttling back to **No throttling**, reload, show the branded **⚡ Lite mode**
   button in the header (and the footer link) — the manual switch both ways.
6. Submit the lite registration form: `Registered! Check your email for confirmation.`
   The companion route posts to the site's real `/api/register`.

Backup if venue Wi-Fi or throttling misbehaves: `http://localhost:5173/?lite=1` jumps
straight to the companion route, and `?lite=0` returns. Both work offline of any
network state.

## Pitch talking points

- Problem: heavy JS bundles, images, third-party scripts make sites unusable on weak networks.
- Solution: generate a semantic-HTML companion route, switch visitors on poor connectivity, verify essential actions with Playwright.
- Differentiator: deterministic core + optional AI outline (never raw HTML); reuses existing routes/APIs; never silently drops an action.
- Metrics: `/` 4.5 MB → 3 KB (100%), 91s → 1.0s on slow-3g; `/register` 343 KB → 3.4 KB; `/schedule` 343 KB → 2.5 KB.
- Detection is best-effort: NetworkInformation + Save-Data + slow-load timer; manual switch always works.
- Limitations disclosed: Vite/React projects only; browser API variance; AI optional.

## Fallback if demo fails

- Show pre-generated `.fallback-forge/report.md` and `inspect.json`.
- Open `.fallback-forge/lite/index.html` directly to prove the companion route works offline.
