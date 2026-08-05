# Costa Rica Family Trip App

## Project Overview
A React + TypeScript PWA travel companion app for a family vacation to Costa Rica (+ Madrid stopover), inspired by [ranaviv.com/thailand-trip-app](https://ranaviv.com/thailand-trip-app).

## Trip Details
- **Dates:** July 23 – August 10, 2026 (15 nights Costa Rica + 3 nights Madrid + travel days)
- **Travelers:** 5 people — 2 adults + children aged 22, 17, 12
- **Family:** Israeli, Hebrew-speaking. App is Hebrew-primary with English toggle.
- **Phones:** Mix of iPhones and Android — that's why we're building a web app (PWA)
- **Tour operator:** 506 Expeditions (guide named Jorge), $250/day for car+guide

## Flights (updated per Itinerary-4.pdf, booking ref 7WXMND / IB P3NB6)
| # | Route | Flight | Date | Time |
|---|-------|--------|------|------|
| 1 | TLV → MAD | El Al LY395 | Jul 23 | 05:00 → 09:20 |
| 2 | MAD → SJO | Iberia IB243 | Jul 23 | 11:30 → 14:35 |
| 3 | SJO → MAD | Iberia IB244 | Aug 6 | 16:10 → 10:50+1 (Aug 7) |
| 4 | MAD → TLV | El Al LY398 | Aug 10 | 22:50 → 04:25+1 (Aug 11) |

Flight data lives in `src/data/flights.ts` (default) but HotelsPage reads `shared/flights` from Firestore first (so the AI chat can update flights live). HomePage countdown uses DEPARTURE 2026-07-23T05:00 and TRIP_END 2026-08-11T04:25.

## Hotels (in order)
| # | Hotel | Location | Check-in | Check-out | Nights | Cost |
|---|-------|----------|----------|-----------|--------|------|
| 1 | Hilton Garden Inn San Jose Airport City Mall | Alajuela | Jul 23 | Jul 24 | 1 | $348 |
| 2 | Tabacón Thermal Resort & Spa | La Fortuna | Jul 24 | Jul 27 | 3 | $4,877 |
| 3 | Hideaway Rio Celeste | Bijagua | Jul 27 | Jul 29 | 2 | $2,720 |
| 4 | Monteverde Lodge | Monteverde | Jul 29 | Jul 30 | 1 | $1,080 |
| 5 | Parador Nature Resort & Spa | Manuel Antonio | Jul 30 | Aug 2 | 3 | $2,585 |
| 6 | Hotel Cuna del Angel | Uvita | Aug 2 | Aug 4 | 2 | $820 |
| 7 | Trogon Lodge | San Gerardo de Dota | Aug 4 | Aug 5 | 1 | $390 |
| 8 | Hilton Garden Inn San Jose Airport City Mall | Alajuela | Aug 5 | Aug 6 | 1 | $348 |
| 9 | INNSide by Meliá Gran Vía | Madrid | Aug 7 | Aug 10 | 3 | €1,757 (~$2,068) |

All hotels include breakfast and 2 rooms.

## Day-by-Day Itinerary Summary
- **Day 1 (Jul 23):** Fly TLV→MAD→SJO. Private transfer to Hilton Garden Inn Alajuela.
- **Day 2 (Jul 24):** Poás Volcano NP ($17/pp). Drive to La Fortuna (3h). La Tirimbina Reserve + Chocolate Tour ($40/pp).
- **Day 3 (Jul 25):** Rafting Balsa River ($80/pp) + Arenal Volcano 1968 hike ($30/pp). Evening thermal pools.
- **Day 4 (Jul 26):** Horseback riding ($95/pp) + La Fortuna Waterfall ($25/pp) + Night Tour Ecocentro Danaus ($60/pp).
- **Day 5 (Jul 27):** Drive to Rio Celeste (1.5–2h). Guided hike Tenorio Volcano NP ($14/pp) + Tubing tour ($50/pp).
- **Day 6 (Jul 28):** Day trip to Rincón de la Vieja NP (2.5–3h). Las Pailas hike ($17/pp).
- **Day 7 (Jul 29):** Drive to Monteverde (2.5h). Hanging Bridges tour ($40/pp).
- **Day 8 (Jul 30):** Canopy + Aerial Tram at Treetopia ($101/pp). Drive to Manuel Antonio (3.5–4h).
- **Day 9 (Jul 31):** Guided visit Manuel Antonio NP ($18/pp). Afternoon at the beach.
- **Day 10 (Aug 1):** Biesanz Beach + Catamaran Tour ($95/pp).
- **Day 11 (Aug 2):** Mangrove boat tour ($65/pp) + Biesanz Beach. Drive to Uvita (20 min).
- **Day 12 (Aug 3):** Boat to San Pedrillo + guided walk Corcovado NP ($120/pp).
- **Day 13 (Aug 4):** 4x4 ride to Nauyaca Waterfalls ($35/pp, incl. lunch). Drive to San Gerardo de Dota (4h).
- **Day 14 (Aug 5):** Morning forest walk Dota ($40/pp). Drive back to Alajuela (2.5–3.5h).
- **Day 15 (Aug 6):** Private transfer to SJO ($50). Fly SJO→MAD (IB244, 16:10).
- **Day 16 (Aug 7):** Arrive Madrid 10:50. Transfer via Booking (8-seat van, €55, conf #247998892). Easy afternoon: Gran Vía → Plaza Mayor → Mercado de San Miguel → Templo de Debod sunset.
- **Day 17 (Aug 8):** Teleférico cable car + Casa de Campo (AM) → Ikono immersive experience (Prado optional next door) → Retiro Park boats → rooftop dinner.
- **Day 18 (Aug 9):** El Rastro Sunday market (AM) → Santiago Bernabéu stadium tour at 15:00 → family dinner.
- **Day 19 (Aug 10):** Last Madrid morning (San Ginés churros + Gran Vía shopping, bag storage) → fly MAD→TLV (El Al LY398, 22:50, arrive 04:25+1). El Al security: be at MAD ~19:45.

## Budget Summary
- Flights: $9,450
- Car + Guide: $3,350 ($250/day × 13 days + $100 transfers)
- Activities: ~$4,810 ($942/pp × 5 + $100 transfers)
- Hotels (Costa Rica): $13,168
- Hotel (Madrid): €1,757
- Extra: $6,000
- **Total: ~$38,535**

## Tech Stack
- **Framework:** React + TypeScript (Vite)
- **Routing:** react-router-dom
- **Icons:** lucide-react
- **Dates:** date-fns
- **Styling:** Vanilla CSS, mobile-first, tropical green theme
- **Languages:** Hebrew (primary) + English toggle, RTL support via LanguageContext
- **Target:** PWA (cross-platform, offline-capable)
- **Auth:** Firebase Auth (Google sign-in), `firebase` npm package
- **Hosting:** Firebase Hosting
- **Repo:** github.com/ofiralon10/CostaRicApp

## App Structure
```
src/
  data/         — types.ts, flights.ts, hotels.ts, itinerary.ts, destinations.ts, emergency.ts
  context/      — LanguageContext.tsx (Hebrew/English toggle + RTL), AuthContext.tsx (family login + roles)
  components/   — Layout.tsx (header + bottom nav + router outlet)
  pages/        — HomePage, ItineraryPage, MapPage, HotelsPage, DestinationsPage, GamesPage, AchievementsPage, PackingPage, CurrencyPage, DocumentsPage, EmergencyPage, LoginPage
  index.css     — Full stylesheet
```

## Deployed Version
**App version: `0.54`** — Swapped the Royal Palace (day 17, Sat Aug 8 morning) for the **Teleférico cable car + Casa de Campo** per family preference; rest of the Madrid plan unchanged.
_(prior: `0.53`)_ — **Filled in the Madrid itinerary (days 16–19, Aug 7–10)** in `src/data/itinerary.ts` (were empty). Fri: Gran Vía/Plaza Mayor/Mercado San Miguel/Templo de Debod sunset. Sat: Royal Palace + Almudena → **Ikono** immersive experience (Prado optional next door) → Retiro boats → rooftop dinner. Sun: **El Rastro** market → **Santiago Bernabéu tour at 15:00** (verified no match Aug 9 2026, full Sunday hours) → dinner. Mon: San Ginés churros + Gran Vía shopping → airport ~19:45 for the 22:50 El Al flight. Each activity has a Google Maps link; prices noted in the description text as € (avoided the `costPerPerson`/`costTotal` fields since ItineraryPage renders those with a `$` symbol). **Note:** ItineraryPage reads `shared/itinerary` (Firestore) first and only falls back to this default file — if the in-app AI chat previously wrote a custom itinerary, this edit won't show until that doc is cleared/updated.
_(prior: `0.52`)_ — **Itinerary activities are now checkable.** Each activity in `ItineraryPage` has a tap-to-toggle check (lucide `CheckCircle2`/`Circle`); done items get a strikethrough + green tint. State is **family-shared** via `useSharedState('activity-done')` (Firestore `shared/activity-done`, a `Record<activityId, true>` map — activity ids like `a2-0` are stable), so checking one off syncs to everyone. Each day header shows an `x/y` progress pill (green when all done). Layout: `.activity-item` is now a row (checkbox + `.activity-body` column); no Firestore rule change needed (`shared/{docId}` covers it).
_(prior: `0.51`)_ — **Fixed AI award images not persisting.** The AI image was stored as a base64 data URL *inside* the Firestore `shared/awards` doc, which exceeds the 1 MiB per-document limit → the `setDoc` write silently failed, so the image (and award) vanished on reload. Now `AwardsPage.handleSend` uploads the generated image to **Firebase Storage** and stores only the short download URL on the award (same pattern as album/coloring/documents); the Send button shows a "Sending…" spinner during upload. **Path note:** images go to `album/award-{ts}-{rand}.jpg` — reusing the already-deployed `album/{allPaths=**}` Storage rule (raw files there don't show in the gallery, which renders from the `album` Firestore array, not a Storage listing). We initially added an `awards/` rule + a workflow step to auto-deploy rules, but the Firebase Admin-SDK service account lacks `serviceusage.services.get`, so `firebase deploy --only storage` 403s on its "is the Storage API enabled" precheck — reverted both. **To deploy Storage/Firestore rule changes in future:** either grant that SA the *Service Usage Consumer* role in GCP IAM, or run `firebase deploy --only storage,firestore:rules` locally; the GitHub Actions workflow deploys **hosting only**.
_(prior: `0.49`)_ — Added a **live weather forecast** on HomePage (`src/components/WeatherForecast.tsx`), shown near the top. Displays **today + next 2 days**, each forecast for **the place visited that day** (mapped from `itinerary` date → location label + coordinates via `hotelId`→`hotels.coordinates`, with `COORD_OVERRIDES` for far day-trips like Rincón de la Vieja / Corcovado, and for the no-hotel fly days SJO/Madrid). Real data from **Open-Meteo** (`api.open-meteo.com/v1/forecast`, free/keyless/CORS-ok, ~16-day horizon) — daily `weather_code` (mapped to emoji+He/En via WMO codes), `temperature_2m_max/min`, `precipitation_probability_max`. Before the trip starts it previews the first 3 itinerary days; after the trip (or dates outside the trip) those cards are omitted; shows an "unavailable" note if offline. Deploy is now automatic via GitHub Actions (`.github/workflows/deploy.yml`) on push to the dev branch — a one-time `FIREBASE_SERVICE_ACCOUNT` repo secret is configured.
_(prior: `0.48`)_ — **Word Scramble** ("פאזל מילים") no longer repeats: expanded the word bank from 10 → **65** Costa Rica wildlife/nature/food/adventure words (`scrambleWords` in `GamesPage.tsx`), and each round now uses `pickScrambleRound()` — a proper Fisher-Yates shuffle that skips recently-used words via a rolling `localStorage` window (`scramble-used`, keeps last `total-8` words) so you cycle through nearly the whole bank before any word comes back.
_(prior: `0.47`)_ — Added **Budget Tracker** (`/budget`, `src/pages/BudgetPage.tsx`). Parent-only (kids see a "grown-ups only" screen, matching the app's price-hiding). Live family-shared expense log via `useSharedState('budget-expenses')` (Firestore `shared/budget-expenses`, array of `{id, amount, currency, usd, category, note, memberId, ts}`). Log a spend in USD/CRC/EUR/ILS → converted to USD at entry time using live rates (`open.er-api.com`, same source as CurrencyPage; falls back to approx rates offline) and the USD value is **locked** on the record so totals stay stable offline. 6 categories (Food, Activities, Shopping, Transport, Tips, Other). Shows running total, per-category breakdown bars, recent-expense list (who paid + date + delete), and a reference "planned pre-paid budget" card (flights/hotels/car/etc, ~$38.8k) with a grand total. Nav card added on HomePage (reuses `nav-hotels.jpg` as placeholder image — regenerate a dedicated watercolor via the Gemini pipeline when convenient). No Firestore rules change needed (`shared/{docId}` already covers it).
_(prior: `0.46`)_ — HomePage shows a **"Podcast for the Road"** card (family-prep audio `public/audio/family-preparation.m4a`, 64k mono ~25MB) below the notification toggle, gated to appear only from **Jul 23 2026 onward** (`new Date() >= 2026-07-23T00:00+03:00`) and dismissible via a "Done listening" button (localStorage `family-podcast-hidden`). Source script: `podcast-sources/00-family-preparation.md`.
_(prior: `0.44`)_ (`src/version.ts`, shown in-app). Live at https://costaricapp-2026.web.app. Bump `APP_VERSION` on every deploy so PC↔mobile sessions can confirm the build loaded. Deploy hosting with `npm run build && firebase deploy --only hosting`; functions with `firebase deploy --only functions`; rules with `firebase deploy --only firestore:rules` / `--only storage`.

## Recent Work Log (this session, → v0.44)
Chronological summary of what was built/changed. All deployed & working.
- **Millionaire** — fixed repeating questions: proper Fisher-Yates shuffle + per-tier localStorage tracking (`mill-used-*`) excluding recently-used; options also shuffled. ~2645 questions across split data files.
- **Push notifications** — added FCM. Per-device tokens in `fcm-tokens` (doc id = localStorage `device-id`, tagged `memberId`). Home-screen on/off toggle + Test button. Debugged the full stack: enabled **FCM Registration API** + **Firebase Cloud Messaging API**, VAPID key `BAf-PGNH…` matches the Console Web Push cert, Firestore rule for `fcm-tokens`, per-device storage so PC+phone both receive.
- **Daily countdown** — `dailyCountdown` scheduled function (`onSchedule` cron `0 8 * * *` TZ Asia/Jerusalem) pushes "X days to Costa Rica" every morning to all tokens; special copy at 30/7/1 days, in-trip "יום N", stops after TRIP_END. Auto-prunes stale tokens and logs per-device OK/FAIL. (Diagnosed a stale phone token via `registration-token-not-registered`; re-enabling on the device re-registered it.)
- **Imposter** — multi-device rewrite: landing → host **chooses invitees** → sends push invites **with delivery feedback** ("sent to N devices" / "none have notifications on") + resend → live join badges → host starts (imposter/first-turn re-picked from those who actually joined).
- **Coloring** — replaced crude SVG with **50 Gemini portrait (3:4) coloring pages** (`public/images/coloring-*.jpg`); canvas flood fill with pre-computed dilated **boundary map** (no leaks); **paint/zoom-pan** toggle (pinch + wheel, 1–5×); **"Post to family album"** button uploads canvas to Storage `album/`.
- **Jigsaw** — real draggable interlocking puzzle (bezier tab/blank edges via shared `jigsawEdge` → gap-free). 8 dedicated portrait images `jigsaw-*.jpg`. **4 size options** (4×6/6×9/8×12/10×15). Pieces pre-scaled 1:1 (perfect alignment), laid out in a **non-overlapping tray grid**, empty target grid (no ghost). **Fixed unreachable pieces** by removing `touch-action:none` from the tall board so the page can scroll. Pausable **timer** + per-size personal (localStorage `jigsaw-records-personal`) & family (Firestore `shared/jigsaw-records`) records.
- **Memory** — board sizes 4×4…7×8 (28 emoji pairs), timer from first move, per-size personal/family records (`memory-records-personal` / `shared/memory-records`), pause/resume (only when no cards face-up), emoji sized to tile via `cqi`.
- **Currency** — live rates from `open.er-api.com/v6/latest/USD` (keyless, CORS-ok) with refresh + live/offline status; fallback rates. (Old hardcoded 3.65 ILS was wrong; live ≈ 3.04.)
- **Documents** — each topic now holds **multiple files**, images **or PDFs**. New model `document-files` (`Record<slotId, DocFile[]>`), storage path `documents/{slotId}/{fileId}.{ext}`; legacy single-file merged in `getFiles()`. **Fixed silent upload failures** by changing Storage rule to `documents/{allPaths=**}` (nested paths). Per-file delete; PDFs open in new tab.
- **Crossword** — **100 auto-generated Hebrew crosswords** (40 easy / 35 medium / 25 hard), grids 9×9–22×22, 12–30 words. Generator + word bank in `scratchpad/gen_crosswords.js` → `src/data/crosswords.ts`. Level-select screen, responsive cell size, input normalizes final letters. **To regenerate/expand: edit word bank + LEVELS in the script, `node scratchpad/gen_crosswords.js`.** (Note: the standalone scratchpad dir may not exist in a fresh clone — the generated `src/data/crosswords.ts` is what ships.)
- **Flights** — updated per Itinerary-4.pdf: flight 1 = **El Al LY395** (05:00→09:20), flight 4 = **El Al LY398** (Aug 10 22:50 → Aug 11 04:25); IB243/IB244 unchanged. Updated `flights.ts`, itinerary day 1/19, Home countdown (DEP 05:00 / END Aug 11 04:25).
- **AI Chat file upload** — paperclip attaches image/PDF (≤10MB, base64) → Gemini reads natively. AI can now **edit itinerary, packing, flights, and hotels** from an uploaded doc (get_*/update_*; flights matched by number, hotels by name). Flights→`shared/flights`, hotels→`shared/hotels`; HotelsPage reads those first.
- **Awards** — "Notify the whole family" toggle (default on) pushes a notification when an award is given.
- **Polish** — Hebrew "לילה/לילות" singular/plural fix; hotel date-range arrow now correct in RTL (`←`, `<bdi>`); every game has a sticky **"All Games"** back button.

## Known / possible next steps
- Budget tracker still not built (planned). Emergency contacts + destinations are static (AI can't edit them yet — would need Firestore + tools like flights/hotels).
- Crossword puzzles use **non-final letter forms** in the grid (e.g. "ים"→"י·מ") so intersections always match — deliberate simplification.
- Notifications only reach members who enabled them on each device; stale tokens auto-prune on the daily send.

## Current State (v2.0)
All 11 pages + login are built and functional:
0. **Login** — Google sign-in via Firebase Auth. Only 5 whitelisted family emails can access. Watercolor avatar portraits for each member shown on login screen. Auto-detects family member from Google email.
1. **Home** — Live countdown, hero banner with watercolor illustration, quick stats, nav grid with Games, Stickers, Packing, Currency links. **Notification toggle** (on/off switch) to enable/disable push notifications per device.
2. **Itinerary** — 19-day expandable timeline with activities, costs (hidden for kids), maps links
3. **Map** — Route stops linking to Google Maps
4. **Hotels & Flights** — All booking details with navigate links, costs hidden for kids
5. **Destinations** — 8 destination cards with watercolor storybook illustrations, fun facts, and podcast player (audio pending NotebookLM generation)
6. **Games** — 8 Costa Rica-themed games at /games, adventure map trail layout with parchment-framed cards, dashed trail line connecting numbered stops, compass hero, and trophy endpoint. Each game has a watercolor image card:
   - **Spanish Phrasebook** — 23 categories (Greetings, Essentials, Food, Restaurant, Directions, Transportation, Hotel, Shopping, Numbers, Time, Nature, Weather, Health, Activities, Family, Feelings, Sports, Clothing, Colors, Drinks, Photos, Slang, Airport) with ~712 phrases. Each phrase shows Spanish, Hebrew pronunciation, Hebrew/English translation, and cultural tips. Search bar and text-to-speech (Web Speech API, es-ES). Quiz mode for each category with flashcard-style self-assessment. Data in `src/data/spanish.ts`.
   - **Trivia** — 12 questions with fun facts, randomized 10 per round
   - **Memory** — Costa Rica emoji matching with flip animation. Choose board size (4×4, 4×5, 5×6, 6×7, 7×8; 28 pairs available). Timer starts on first move. Per-size **personal record** (localStorage `memory-records-personal`) and **family record** (Firestore `shared/memory-records`, via `useSharedState`) shown on the size-select screen and win screen.
   - **Coloring** — 50 Gemini-generated portrait (3:4) coloring book images with bold, closed outlines (Costa Rica animals, nature, activities, culture, plants). Canvas flood fill uses a pre-computed dilated boundary map (grayscale threshold 160, 2px separable dilation) so fills don't leak across thin/broken lines. 14-color palette. Paint/Zoom mode toggle: pinch + mouse-wheel zoom (1–5x), drag to pan. Images in `public/images/coloring-*.jpg`.
   - **Jigsaw** — Real draggable jigsaw puzzle with canvas-rendered interlocking pieces (bezier curve tabs/blanks). 3x4 portrait grid, pieces scattered in tray below board, drag to snap into correct position. Faint ghost of full image shown on board. Pieces blit 1:1 from a pre-scaled offscreen canvas (no per-piece rescaling → perfect alignment). Interlocking edges use a shared-curve convention (`jigsawEdge`) so neighbors render the identical boundary → gap-free fit. Four size options (4×6, 6×9, 8×12, 10×15 cols×rows) chosen on a size-select screen. Pausable timer starts on first piece grab (pause disables piece dragging + dims board, tap banner to resume); per-size **personal record** (localStorage `jigsaw-records-personal`) and **family record** (Firestore `shared/jigsaw-records`) shown on the size-select and win screens. Uses 8 dedicated portrait watercolor images `public/images/jigsaw-*.jpg` (arenal, sloth, rio-celeste, monteverde, beach, macaw, whale, frog), random image each round.
   - **Crossword** — **100 auto-generated Hebrew crosswords** across 3 levels (40 easy / 35 medium / 25 hard), grids 8×8 to 17×17. Data in `src/data/crosswords.ts`, generated by `scratchpad/gen_crosswords.js` (word bank + placement algorithm with verified intersections; letters normalized to non-final forms). Level-select screen → random puzzle of that level → RTL grid (per-puzzle size, responsive cell px), Across/Down clue lists, Check/Reveal/Reset/New-Puzzle. Input normalizes final Hebrew letters. To regenerate: edit the word bank in the script and re-run `node scratchpad/gen_crosswords.js`.
   - **Coloring post-to-gallery** — When coloring, a "Post to family album" button uploads the current canvas to Firebase Storage `album/` and prepends it to the shared `album` state (same gallery as AlbumPage).
   - **Word Scramble** — Unscramble English wildlife/nature words with hints
   - **Imposter** — Multi-device multiplayer party game (Firestore real-time sync via `useSharedState`). Landing screen → host taps "New Game" → **chooses who to invite** (min 3) → sends push notification invites and sees delivery feedback ("sent to N devices" / "none have notifications on") with a resend button → players join from their own devices (live join badges) → host starts (imposter + first-turn re-picked from those who actually joined) → roles revealed individually (no device passing!) → discuss → reveal. Host can "Start Over" from the waiting screen. 5 categories (Animals, Places, Food, Activities, Objects) with Hebrew/English words.
   - **Who Wants to Be a Millionaire** — 15-question game with money ladder ($100–$1M), 3 lifelines (50:50, phone-a-friend, ask-audience), safe levels at Q5/Q10. ~2645 questions: 1200 easy (Q1-5), 995 medium (Q6-10), 450 hard (Q11-15). Mix of Costa Rica trivia and Spanish language. Data split across `src/data/millionaire-easy-1-part{1,2,3}.ts`, `millionaire-easy-2.ts`, `millionaire-medium.ts`, `millionaire-hard.ts` with barrel file `millionaire.ts`.
- **Awards** — `/awards` family award feed. Give an award to one member or everyone, pick an icon, message, optional AI-generated image. A **"Notify the whole family" toggle** (default on) pushes a notification (via `sendNotification`, link `/awards`) to all members except the sender when the award is sent.

7. **Achievements** — Sticker book at /achievements with 20 stickers for attractions across 4 categories (Nature, Adventure, Culture, Wildlife). Users tap to earn stickers after visiting attractions. Progress bar, category badges, confirmation modal with watercolor preview, pop animation. State persisted in localStorage.
8. **Packing** — Checklist at /packing with 6 categories (Documents, Clothing, Gear, Health, Adventure, Snacks), ~50 items. Expandable categories with checkboxes, progress bar, persisted in localStorage. Reset button.
9. **Currency** — Converter at /currency for USD/CRC/EUR/ILS. **Live rates** fetched from `open.er-api.com/v6/latest/USD` (free, keyless, CORS-ok) on load, with a refresh button and "Live · updated <time>" / "Approximate (offline)" status indicator. Falls back to hardcoded rates if the fetch fails. Swap button, quick conversion table, travel tips.
10. **Documents** — Document vault at /documents with fixed topics (Passports, Insurance, Flights, Booking Confirmations, Other). Each topic holds **multiple files** — photos (camera/gallery) and/or PDFs (e.g. one PDF per hotel room). Files stored per-topic in shared `document-files` state (`Record<slotId, DocFile[]>`, DocFile = {id,url,type,path}) at storage path `documents/{slotId}/{fileId}.{ext}`; images resized to JPEG, PDFs uploaded as-is and opened in a new tab. Legacy single-file uploads (`documents` + `document-types` maps, path `documents/{slotId}.{ext}`) still render via a merge in `getFiles()`. Per-file delete; "other-*" topics renamable via `document-names`. Progress bar counts topics with ≥1 file.
11. **Emergency** — Contacts with tap-to-call

## Auth & Roles
- **Login:** Google sign-in via Firebase Auth (`signInWithPopup`). Only whitelisted emails allowed.
- **Whitelist:** ofiralon10@gmail.com, merav.yanai@gmail.com, mayalon03@gmail.com, matan.alon333@gmail.com, yoav.alon333@gmail.com
- **Family members:** Yoav (🧒 kid), Matan (👦 kid), Ofir (👨 parent), Merav (👩 parent), Maya (👩‍🦱 kid)
- **Avatars:** Watercolor portraits in `public/images/avatar-{name}.jpg`, shown on login page and header
- **Roles:** `parent` sees everything, `kid` sees no prices (activity costs, hotel costs hidden)
- **Persistence:** Firebase Auth handles session persistence automatically
- **Price hiding:** `useAuth().isParent` checked in ItineraryPage and HotelsPage

## Destination Images
All images are watercolor storybook illustrations generated via Gemini API (Nano Banana 2 model).
Stored in `public/images/`, referenced via `imageUrl` field in `src/data/destinations.ts`.

| File | Destination |
|------|------------|
| hero-costa-rica.jpg | Home page hero banner |
| arenal-volcano.jpg | Arenal & La Fortuna |
| rio-celeste.jpg | Rio Celeste & Tenorio |
| rincon-vieja.jpg | Rincón de la Vieja |
| monteverde.jpg | Monteverde Cloud Forest |
| manuel-antonio.jpg | Manuel Antonio |
| uvita-corcovado.jpg | Uvita & Corcovado |
| san-gerardo.jpg | San Gerardo de Dota |
| madrid.jpg | Madrid |
| game-trivia.jpg | Trivia game card |
| game-memory.jpg | Memory game card |
| game-jigsaw.jpg | Jigsaw game card |
| game-crossword.jpg | Crossword game card |
| game-scramble.jpg | Word Scramble game card |
| game-spanish.jpg | Spanish Phrasebook game card |
| avatar-yoav.jpg | Yoav's watercolor portrait avatar |
| avatar-matan.jpg | Matan's watercolor portrait avatar |
| avatar-ofir.jpg | Ofir's watercolor portrait avatar |
| avatar-merav.jpg | Merav's watercolor portrait avatar |
| avatar-maya.jpg | Maya's watercolor portrait avatar |
| game-coloring.jpg | Coloring game card |
| nav-destinations.jpg | Nav card: Itinerary |
| nav-flights.jpg | Nav card: Flights & Hotels |
| nav-activities.jpg | Nav card: Destinations |
| nav-games.jpg | Nav card: Games |
| nav-stickers.jpg | Nav card: Stickers |
| nav-weather.jpg | Nav card: Map |
| nav-emergency.jpg | Nav card: Emergency |

## Image Generation Pipeline
Use Gemini API to generate images (much faster/reliable than browser automation):
- **Model:** `gemini-2.5-flash-image` (confirmed working — other flash models like gemini-2.0-flash do NOT support image output)
- **Auth:** `x-goog-api-key` header (NOT query param — key format starts with `AQ.`)
- **API key name:** "Gemini API Key 2" in project 691528045184 (Default Gemini Project)
- **Endpoint:** `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`
- **Body:** `{"contents":[{"parts":[{"text":"prompt"}]}],"generationConfig":{"responseModalities":["IMAGE","TEXT"]}}`
- **Response:** base64 JPEG in `candidates[0].content.parts[].inlineData.data`
- **Optimize:** Use PIL to resize to max 1200px wide, JPEG quality 80 (~200KB per image)
- **Script template:** See `/tmp/generate_images.py` pattern

## Podcasts for Kids
Hebrew audio podcasts for each destination, generated via Google NotebookLM's Audio Overview feature.
- **Target audience:** Teenagers (~16 year old level; kids are aged 12, 17, 22)
- **Source documents:** `podcast-sources/` directory — one rich Hebrew document per destination (~2000+ words each)
- **Files:** 01-arenal-la-fortuna.md, 02-rio-celeste.md, 03-rincon-de-la-vieja.md, 04-monteverde.md, 05-manuel-antonio.md, 06-uvita-corcovado.md, 07-san-gerardo-de-dota.md, 08-madrid.md
- **Workflow:** Upload each source doc to NotebookLM → Generate Audio Overview → Download MP3 → Place in `public/audio/` → Set `podcastUrl` in `src/data/destinations.ts`
- **UI:** Podcast player section in DestinationsPage (play/pause button + native audio controls), shown when `podcastUrl` is set
- **Type:** `podcastUrl?: string` field added to `Destination` interface in `src/data/types.ts`

## PWA Support
- **Manifest:** `public/manifest.json` with app name, theme color, icons
- **Service Worker:** `public/sw.js` — network-first with cache fallback, image caching
- **Icons:** `public/images/icon-192.png` and `icon-512.png`
- **Registration:** In `index.html` via inline script on load
- **Install:** App is installable on iOS (Add to Home Screen) and Android (install prompt)

## Planned Features (not yet built)
- (Budget tracker shipped in v0.47 — see Deployed Version.)

## Design Inspiration
Based on the Thailand trip app by Ran Aviv (ranaviv.com/thailand-trip-app):
- Storybook-style illustrations per destination
- Gamification / progression (stamps, badges)
- Kids' audio podcast per destination
- Weather module with hand-drawn icons
- Document vault with offline access

## Push Notifications (FCM)
- **Service:** Firebase Cloud Messaging (FCM) with Web Push
- **VAPID public key:** `BAf-PGNHEZewo6bI0jzL1Dm0_z9x_adCzqwUIl8DneBHDgTgFpC3rwFmHU6j_P-qENrLddMw9bQTgKfuMexxt9E`
- **Token storage:** Firestore collection `fcm-tokens`, **one doc per device** (doc ID = random `device-id` in localStorage), each tagged with `memberId`. This lets a member receive on PC + phone + tablet simultaneously. `sendNotification` queries `where memberId in targetMemberIds` and sends to every device token.
- **Service workers:** `public/sw.js` (push handler) + `public/firebase-messaging-sw.js` (FCM compat)
- **Hook:** `src/hooks/useNotifications.ts` — `useNotifications()` returns `{enabled, enable, disable}`
- **Cloud Function:** `sendNotification` — accepts `{targetMemberIds, title, body, data}`
- **Daily countdown:** `dailyCountdown` scheduled Cloud Function (`onSchedule`, cron `0 8 * * *`, TZ Asia/Jerusalem) pushes a "X days left to Costa Rica" morning notification to every registered device. Before departure: counts down days (special copy at 30/7/1 days); during the trip: "יום N בטיול"; after TRIP_END (2026-08-11): stops. Departure/end constants live inline in `functions/index.js`.
- **Toggle:** On HomePage, users can enable/disable notifications per device
- **Setup needed:** In Firebase Console > Project Settings > Cloud Messaging > Web Push certificates, click "Import existing key pair" and paste the VAPID public key above

## AI Trip Guide (Chat)
- **Page:** `src/pages/ChatPage.tsx` (`/chat`) — chat UI backed by the `chat` Cloud Function (Gemini 2.5-flash).
- **File upload:** paperclip button attaches an **image or PDF** (≤10MB), sent as base64 in the callable's `file: {data, mimeType}` arg. The function attaches it as an `inlineData` part on the latest user turn so Gemini reads it natively.
- **Tools:** the function can modify the **itinerary** (`shared/itinerary`), **packing list** (`shared/packing-config`), **flights** (`shared/flights`), and **hotels** (`shared/hotels`) via function-calling. So a user can upload any updated trip document (flight itinerary, hotel confirmation, ticket) and the AI applies it live — no code change needed. Get_* then update_* (flights matched by current flight number, hotels by name).
- **Flights/Hotels sync:** `update_flight`→`shared/flights`, `update_hotel`→`shared/hotels`; HotelsPage reads those first, falling back to `src/data/flights.ts` / `src/data/hotels.ts`. Keep `DEFAULT_FLIGHTS` (inline in `functions/index.js`) and `functions/hotels.js` in sync with the `src/data/*` sources.

## Firebase Config
- **Project:** costaricapp-2026
- **App ID:** 1:1005193058269:web:99703b084a0538e89b4834
- **Config file:** `src/firebase.ts` — exports `auth`, `googleProvider`, `db`, `storage`, `functions`, `getMessagingInstance`, `getToken`, `onMessage`
- **Auth domain:** costaricapp-2026.firebaseapp.com
- **Auth method:** Google sign-in (signInWithPopup)

## Deployment
- **Live URL:** https://costaricapp-2026.web.app
- **Firebase project:** costaricapp-2026
- **Hosting:** Firebase Hosting, deploy with `npm run build && firebase deploy --only hosting`
- **GitHub repo:** github.com/ofiralon10/CostaRicApp

## Important Notes
- Always update this CLAUDE.md file when making changes — user switches between PC and mobile sessions
- `verbatimModuleSyntax` is enabled in tsconfig — use `import type` for type-only imports
- The app uses `date-fns` with Hebrew locale support
- All data is typed in `src/data/types.ts`
- CSS uses CSS custom properties for theming (--green-*, --gray-*, etc.)
