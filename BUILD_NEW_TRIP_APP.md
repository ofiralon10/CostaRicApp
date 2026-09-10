# Build Your Own Family Trip Companion App — Complete Guide

This document explains **everything** needed to turn this source code into a fully-working
trip-companion PWA for a **different family and a different destination**.

It is written to be handed to **Claude Code** (or Claude in any IDE) together with the source
code. A capable person following it step-by-step — or Claude doing the work with the person
approving — can stand up the whole app: web app, database, login, file storage, push
notifications, an AI trip-guide chat, image generation, and automated deployment.

> **You have the source code but not the data.** The bulk of this guide (Part D) is about
> creating the trip-specific content — flights, hotels, day-by-day plan, destinations,
> phrasebook, games, images. The code is generic; the data makes it *your* trip.

---

## 0. TL;DR — the shortest path

1. Install Node 20+, `npm i -g firebase-tools`, clone the repo, `npm install`.
2. Create a **Firebase project** on the **Blaze (pay-as-you-go) plan** (Cloud Functions require it).
3. Enable **Authentication (Google)**, **Firestore**, **Storage**, **Hosting**, **Cloud Functions**, **Cloud Messaging**.
4. Paste your project's **web config** into `src/firebase.ts` and `public/firebase-messaging-sw.js`; set `.firebaserc`.
5. Get a **Gemini API key**; store it as a Functions secret `GEMINI_API_KEY`.
6. Create a **Web Push (VAPID) key pair** in Firebase → put the public key in `src/hooks/useNotifications.ts`.
7. **Replace all the trip data** (Part D): family members, flights, hotels, itinerary, destinations, emergency, phrasebook, games, home constants.
8. **Generate images** with Gemini (Part E) into `public/images/`.
9. Deploy: `npm run build && firebase deploy` (hosting + functions + rules).
10. (Optional) Wire up **GitHub Actions** for auto-deploy (Part H) — mind the IAM roles in Part I.

If you're using Claude to do this: give it this file and say *"Set this app up for my trip — here are the details: …"* and work through Parts B→H with it. Claude should ask you for the trip facts, then edit the data files, generate images, and deploy.

---

## 1. What you're building

A mobile-first **Progressive Web App** (installable on iOS & Android, works offline) that a
family uses before and during a trip. Features:

- **Home** — live countdown, hero image, weather forecast per day, nav grid, push-notification toggle.
- **Itinerary** — day-by-day expandable timeline with activities, costs (hidden from kids), map links, and tap-to-check "done" boxes synced across the family.
- **Map** — route stops → Google Maps.
- **Hotels & Flights** — all booking details.
- **Destinations** — storybook cards with fun facts and optional audio podcasts.
- **Games** — a suite (Trivia, Memory, Coloring, Jigsaw, Crossword, Word Scramble, Imposter multiplayer, "Millionaire", Spanish/□-language phrasebook).
- **Stickers / Achievements**, **Packing** checklist, **Currency** converter (live rates), **Budget** tracker (parent-only, live shared), **Documents** vault, **Emergency** contacts, **Awards** (with AI-generated images), **Album**, **AI Trip Guide chat**.
- **Auth** — Google sign-in restricted to a family whitelist; `parent` vs `kid` roles (kids don't see prices).
- **Real-time family sync** via Firestore; **file storage** via Firebase Storage; **AI** via Google Gemini; **push** via Firebase Cloud Messaging.

### Tech stack
- **Frontend:** React + TypeScript, built with **Vite**; routing `react-router-dom`; icons `lucide-react`; dates `date-fns`; vanilla CSS (mobile-first, RTL-aware).
- **Backend:** **Firebase** — Auth, Firestore, Storage, Hosting, **Cloud Functions v2** (Node 20), Cloud Messaging (FCM).
- **AI:** **Google Gemini** (`gemini-2.5-flash` for chat, `gemini-2.5-flash-image` for images).
- **CI/CD:** GitHub Actions (optional).

---

## 2. Accounts, tools & costs you need

| Thing | Why | Notes / cost |
|-------|-----|--------------|
| **Google account** | Owns Firebase + Gemini | Free |
| **Firebase project** on **Blaze plan** | Hosting, DB, Storage, **Functions**, FCM | Blaze is pay-as-you-go but has a **generous free tier**; a family app costs ~$0–a few $/mo. A billing account (credit card) is required to use Cloud Functions at all. |
| **Google AI Studio / Gemini API key** | AI chat + image generation | Free tier available; see [aistudio.google.com](https://aistudio.google.com/app/apikey). Paid usage is cheap at family scale. |
| **Node.js 20+** and **npm** | Build the app & functions | Free |
| **Firebase CLI** (`npm i -g firebase-tools`) | Deploy | Free |
| **GitHub account + repo** | Source control, optional CI/CD | Free |
| **A computer** | First-time Firebase login/deploy needs a browser login once | The web app itself is buildable/editable anywhere, but `firebase login` and the first `firebase deploy` are easiest from a real computer. |

> **Important:** Cloud Functions (the AI chat, push notifications, daily countdown, award
> images) **require the Blaze plan**. If you skip Functions, the app still works but loses the
> AI chat, push notifications, and AI award images. Everything else (itinerary, games, budget,
> etc.) runs purely on the free Firestore/Storage/Hosting tier.

---

## 3. Repository layout (what you're given)

```
src/
  firebase.ts            — Firebase SDK init + config  ← REPLACE config
  version.ts             — APP_VERSION string (bump on each deploy)
  main.tsx / App.tsx     — app bootstrap + routes
  context/
    LanguageContext.tsx  — primary-language/English toggle + RTL
    AuthContext.tsx      — family members, emails, roles  ← REPLACE people
  hooks/
    useNotifications.ts  — FCM enable/disable  ← REPLACE VAPID key
    useSharedState.ts    — generic Firestore-synced state hook (shared/<docId>)
  components/            — Layout (header + bottom nav), WeatherForecast
  pages/                 — HomePage, ItineraryPage, MapPage, HotelsPage,
                           DestinationsPage, GamesPage, AchievementsPage,
                           PackingPage, CurrencyPage, DocumentsPage,
                           BudgetPage, AwardsPage, AlbumPage, ChatPage,
                           EmergencyPage, LoginPage
  data/                  — types.ts + all trip content  ← REPLACE most of this
  index.css              — full stylesheet (theme via CSS vars)
public/
  images/                — watercolor images + nav/game/avatar art  ← REGENERATE
  audio/                 — optional podcasts
  manifest.json, sw.js, firebase-messaging-sw.js, icons  ← EDIT names/config
functions/
  index.js               — Cloud Functions: chat, generateAwardImage,
                           sendNotification, dailyCountdown
  itinerary.js, hotels.js — server copies of itinerary/hotels for the AI  ← KEEP IN SYNC
  package.json
firebase.json            — hosting/firestore/storage/functions config
firestore.rules, storage.rules
.firebaserc              — points the CLI at your project  ← REPLACE project id
.github/workflows/deploy.yml — optional CI/CD
```

`src/data/types.ts` is the **schema for all trip content** — read it first; every data file
below conforms to a type there.

---

## PART A — Get the code running locally

```bash
git clone <your-repo-url> trip-app && cd trip-app
npm install
# install the Cloud Functions deps too:
npm --prefix functions install
npm run dev          # local dev server (Vite) — open the printed localhost URL
```

At this point it will still show the *previous* trip's data and try to talk to the *previous*
Firebase project (which you don't own) — logins and cloud features will fail until you do Part B.
That's expected. Build-only sanity check: `npm run build` (runs `tsc -b && vite build`).

> **TypeScript note:** `verbatimModuleSyntax` is on. Use `import type { X }` for type-only
> imports or the build fails.

---

## PART B — Create and wire up your Firebase project

### B1. Create the project (Blaze plan)
1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**. Pick a
   project id, e.g. `mytrip-2027` (this becomes part of your URL `mytrip-2027.web.app`).
2. Upgrade the project to the **Blaze plan** (Settings → Usage and billing → Modify plan → Blaze).
   Attach a billing account. (Required for Cloud Functions.)

### B2. Register a Web App and copy the config
1. Project Overview → **Add app** → **Web** (`</>`). Give it a nickname; **also check
   "Firebase Hosting"** to have it provision hosting.
2. Copy the `firebaseConfig` object it shows you.
3. Paste those values into **two** files (they must match):
   - `src/firebase.ts` → the `firebaseConfig` object, and the region in `getFunctions(app, 'us-central1')` (keep `us-central1` unless you deploy functions elsewhere).
   - `public/firebase-messaging-sw.js` → the config block near the top.

> The web `apiKey` here is **not a secret** (it's a public client identifier) — it's fine that
> it lives in the code. The real secret (Gemini) is handled separately in Part C4.

### B3. Point the CLI at your project
Edit `.firebaserc`:
```json
{ "projects": { "default": "mytrip-2027" } }
```
Then `firebase login` (opens a browser once) and `firebase use mytrip-2027`.

### B4. Enable the products (Firebase console)
- **Build → Authentication → Get started → Sign-in method → Google → Enable.** Set a support email.
- **Build → Firestore Database → Create database** (Production mode; pick a region close to the family).
- **Build → Storage → Get started** (Production mode).
- **Build → Functions** — will activate on first deploy (Blaze required).
- **Run → Hosting** — provisioned when you added the web app; finalized on first deploy.
- **Engage → Messaging** — used by FCM; no toggle needed, but do B‑C6 for the VAPID key.

### B5. Authorized domains for login
Authentication → Settings → **Authorized domains** must include `mytrip-2027.web.app`,
`mytrip-2027.firebaseapp.com`, and `localhost`. (Firebase adds the first two automatically.)

---

## PART C — Configure each service in detail

### C1. Auth whitelist, family members & roles — `src/context/AuthContext.tsx`
This is where you define **who can log in** and **who sees prices**.
```ts
export const familyMembers: FamilyMember[] = [
  { id: 'dad',  name: 'אבא',  nameEn: 'Dad',  emoji: '👨', avatar: '/images/avatar-dad.jpg',  role: 'parent', email: 'dad@gmail.com' },
  { id: 'kid1', name: 'ילד', nameEn: 'Kid',  emoji: '🧒', avatar: '/images/avatar-kid1.jpg', role: 'kid',    email: 'kid1@gmail.com' },
  // …one entry per family member
]
```
- `email` **must be the exact Google account** each person signs in with. Only these emails can
  enter (`ALLOWED_EMAILS` is derived from this list).
- `role: 'parent'` sees everything; `role: 'kid'` hides prices (checked via `useAuth().isParent`
  in ItineraryPage, HotelsPage, BudgetPage).
- The same names/emojis/avatars are used across Login, header, Awards, Budget, Imposter, etc.
  Search the codebase for a second hard-coded `FAMILY`/member list (e.g. in `AwardsPage.tsx`) and
  update it too, or refactor those to import `familyMembers`.

### C2. Firestore security rules — `firestore.rules`
The app stores all shared state under the `shared/` collection and device push tokens under
`fcm-tokens/`. The shipped rules allow any signed-in user to read/write those:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shared/{docId}      { allow read, write: if request.auth != null; }
    match /fcm-tokens/{id}     { allow read, write: if request.auth != null; }
  }
}
```
This is fine for a **private family app behind an email whitelist**. Deploy with
`firebase deploy --only firestore:rules`.

### C3. Storage security rules — `storage.rules`
Album photos, coloring pages, document uploads and award images live in Storage. Shipped rules:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /documents/{allPaths=**} { allow read, write: if request.auth != null; }
    match /album/{allPaths=**}     { allow read, write: if request.auth != null; }
  }
}
```
> **Gotcha:** use the `{allPaths=**}` recursive wildcard — nested paths like
> `documents/passports/abc.jpg` silently fail to upload without it. Deploy with
> `firebase deploy --only storage`.

### C4. Cloud Functions & the Gemini secret — `functions/`
The functions are **Cloud Functions v2 (Node 20)**:
| Function | Type | Purpose |
|----------|------|---------|
| `chat` | callable | AI Trip Guide; reads uploaded files; edits itinerary/packing/flights/hotels via tools |
| `generateAwardImage` | callable | Gemini image for Awards |
| `sendNotification` | callable | push to family device tokens |
| `dailyCountdown` | scheduled (cron `0 8 * * *`, TZ set inline) | morning "X days to go" push |

The Gemini key is **not** in code — it's a Functions secret referenced as
`const geminiKey = defineSecret("GEMINI_API_KEY")`. Set it once:
```bash
firebase functions:secrets:set GEMINI_API_KEY     # paste your Gemini key when prompted
```
Get the key from [Google AI Studio → Get API key](https://aistudio.google.com/app/apikey).
Then deploy functions: `firebase deploy --only functions` (first deploy also enables the
Cloud Functions / Cloud Build / Artifact Registry APIs — accept the prompts).

> If you also use Gemini for **image generation scripts** (Part E), that's a *separate* plain
> API key used locally via the `x-goog-api-key` header — it does not need to be a Functions secret.

### C5. Update the daily-countdown dates & copy — `functions/index.js`
`dailyCountdown` has the trip's **departure/end dates** and message copy inline. Update:
- the departure/return date constants,
- the timezone in the `onSchedule` options (e.g. `Asia/Jerusalem`),
- the notification text (translate to your family's language).

### C6. Push notifications / FCM VAPID key
1. Firebase console → Project Settings → **Cloud Messaging** → **Web configuration** →
   **Web Push certificates** → **Generate key pair** (or import one).
2. Copy the **public key** into `src/hooks/useNotifications.ts` → `VAPID_KEY`.
3. Ensure `public/firebase-messaging-sw.js` has your project config (Part B2).
4. Enable the **Firebase Cloud Messaging API (V1)** and **FCM Registration API** in Google Cloud
   console for the project (the console will link you if a token request fails).

---

## PART D — Replace the trip content (the data)

This is the heart of the customization. `src/data/types.ts` defines every shape. Work through
each file. Everything is **bilingual**: fields without a suffix are the toggle-off language
(here English), `…He` fields are the primary language (here Hebrew). **Rename/repurpose the
`He` fields to whatever primary language you want** — the toggle just swaps the two strings; the
code is language-agnostic. If your app is English-only, put English in both.

### D1. Version & branding
- `src/version.ts` → set `APP_VERSION` (bump on every deploy so PC/phone can confirm the build).
- App title & theme color: `index.html`, `public/manifest.json`, `src/components/Layout.tsx`
  (header text), and the theme CSS variables in `src/index.css` (`--green-*` etc. — rename or
  recolor for a non-tropical destination).

### D2. Flights — `src/data/flights.ts`  (type `Flight`)
```ts
{ id: 'f1', airline: 'El Al', flightNumber: 'LY395', from: 'TLV', to: 'MAD',
  departure: '05:00', arrival: '09:20', date: '2026-07-23' }
```
Also keep the server copy **`DEFAULT_FLIGHTS`** (inline in `functions/index.js`) in sync, since
the AI chat can edit flights.

### D3. Hotels — `src/data/hotels.ts`  (type `Hotel`) and `functions/hotels.js`
```ts
{ id: 'h1', name: '…', location: '…', region: '…',
  checkIn: '2026-07-23', checkOut: '2026-07-24', nights: 1,
  rooms: '…', breakfast: true, cost: 348, coordinates: [10.0023, -84.2045] }
```
`coordinates` are `[lat, lng]` (used by Map & the weather feature). Mirror any changes into
**`functions/hotels.js`** (the AI's server copy).

### D4. Itinerary — `src/data/itinerary.ts`  (type `DayPlan`) **and `functions/itinerary.js`**
The most important file. One object per day:
```ts
{ day: 1, date: '2026-07-23', region: 'San José', regionHe: 'סן חוסה',
  location: 'Arrival', locationHe: 'הגעה', hotelId: 'h1', checkIn: true,
  drivingDistance: '150 km (~3h)',
  activities: [
    { id: 'a1-1', name: 'Guided hike', nameHe: 'טיול מודרך',
      description: '…', descriptionHe: '…',
      costPerPerson: 17, /* or costTotal */ mapsUrl: 'https://maps.google.com/?q=…' },
  ],
  notes: 'Practical tip…', notesHe: '…' }
```
Notes/gotchas learned the hard way:
- **Activity `id`s must be stable & unique** (e.g. `a1-1`) — the "done" checkboxes key off them.
- **Costs render with a `$` sign.** For non-USD legs, put the price text in `description`
  (e.g. "~€35pp") and **omit** `costPerPerson`/`costTotal` to avoid a wrong currency symbol.
- **`hotelId`** links a day to a hotel (drives coordinates for weather + the hotel badge).
- **Keep `functions/itinerary.js` in sync.** It's the AI's fallback copy. The simplest way to
  regenerate it from the source of truth:
  ```bash
  node -e 'const fs=require("fs");let s=fs.readFileSync("src/data/itinerary.ts","utf8");
    s=s.replace(/^import[^\n]*\n/,"").replace(/export const itinerary:\s*DayPlan\[\]\s*=\s*\[/,"module.exports = [");
    fs.writeFileSync("functions/itinerary.js",s);'
  node --check functions/itinerary.js
  ```
  Then redeploy functions. **If these drift, the next AI itinerary edit will overwrite the live
  plan with the stale copy** (see Part I).

### D5. Destinations — `src/data/destinations.ts`  (type `Destination`)
Storybook cards: `name/nameHe`, `description/descriptionHe`, `funFacts[]/funFactsHe[]`,
`highlights[]/highlightsHe[]`, `coordinates`, `days: number[]` (which itinerary days it covers),
`imageUrl` (Part E), optional `podcastUrl` (Part F).

### D6. Emergency contacts — `src/data/emergency.ts`  (type `EmergencyContact`)
`name/nameHe`, `phone`, `type: 'emergency' | 'embassy' | 'hotel' | 'guide' | 'family'`. Put the
destination country's emergency number, your embassy, hotels, guide, and family contacts.

### D7. Home page constants — `src/pages/HomePage.tsx`
- `DEPARTURE` and `TRIP_END` ISO datetimes (drive the countdown / before-during-after state).
- `NAV_CARDS` — the home grid; each `{ id, label, labelEn, path, image }`. Remove cards you don't want.
- Any dismissible cards (e.g. the "podcast for the road") are date-gated with inline constants.

### D8. Weather — `src/components/WeatherForecast.tsx`
Uses **Open-Meteo** (free, keyless). It derives each day's coordinates from the itinerary/hotels.
Update `COORD_OVERRIDES` for day-trip days that are far from where you sleep, and for any
no-hotel travel days. No API key needed.

### D9. Currency — `src/pages/CurrencyPage.tsx` & Budget — `src/pages/BudgetPage.tsx`
- Currency converter pulls **live rates** from `open.er-api.com` (keyless). Set the default
  currencies for your trip (home currency + destination currency).
- Budget: adjust the `CATEGORIES` list and the reference `PLANNED` budget figures. Budget is
  **parent-only** and family-shared via `useSharedState('budget-expenses')`.

### D10. Games content
These are optional to customize (they work as-is) but should be re-themed for a good experience:
- **Spanish/□-language phrasebook — `src/data/spanish.ts`** — if your destination speaks a
  different language, replace with that language's phrases (Spanish/French/Thai/…). Each entry:
  target phrase + primary-language pronunciation + translation + optional tip.
- **Trivia / Imposter / Word Scramble** — inline arrays in `src/pages/GamesPage.tsx`
  (`scrambleWords`, imposter categories, trivia questions). Re-theme to the destination.
- **"Millionaire" questions** — `src/data/millionaire-*.ts` (barrel `millionaire.ts`). Large
  banks; re-theme or regenerate.
- **Crosswords** — `src/data/crosswords.ts` is **generated**; regenerate from a word bank if you
  want destination-specific puzzles (the generator script is referenced in the project notes;
  the shipped `.ts` is what runs).
- **Memory / Jigsaw / Coloring** — driven by images in `public/images/` (Part E); Jigsaw uses
  `jigsaw-*.jpg`, Coloring uses `coloring-*.jpg`.

> Fastest path with Claude: *"Re-theme all the games from Costa Rica to <destination> — trivia,
> scramble words, imposter categories, phrasebook language = <language>."*

---

## PART E — Generate the images (Gemini pipeline)

All art is **watercolor storybook** images generated with Gemini and stored in `public/images/`.
You need to regenerate them for your destination. The set includes (see the image table in
`CLAUDE.md` of the original for the full list): a home **hero**, one image **per destination**,
**nav card** images, **game card** images, **avatar portraits** per family member, and the
**coloring** (`coloring-*.jpg`) and **jigsaw** (`jigsaw-*.jpg`) sets.

**Pipeline (works well, avoids browser automation):**
- **Model:** `gemini-2.5-flash-image` (other flash models do *not* output images).
- **Endpoint:** `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`
- **Auth:** header `x-goog-api-key: <YOUR_GEMINI_KEY>` (not a query param).
- **Body:** `{"contents":[{"parts":[{"text":"<prompt>"}]}],"generationConfig":{"responseModalities":["IMAGE","TEXT"]}}`
- **Response:** base64 JPEG in `candidates[0].content.parts[].inlineData.data`.
- **Optimize:** resize to ~1200px wide, JPEG quality ~80 (~200 KB each) with PIL.
- Keep a **consistent style prompt suffix** (e.g. "soft watercolor storybook illustration, warm
  palette") across all images so the app looks cohesive.

Ask Claude to write a small Python script that loops over a `{filename: prompt}` map and writes
each file into `public/images/`. Match the **exact filenames** the code references (avatars must
be `avatar-<id>.jpg` matching the `id`s in `AuthContext`; nav/game images match `NAV_CARDS` and
the games list).

---

## PART F — Podcasts (optional)

Per-destination audio is generated with **Google NotebookLM's Audio Overview**:
1. Write a rich source document per destination (there are examples under `podcast-sources/`).
2. Upload each to NotebookLM → **Generate Audio Overview** → download the MP3/M4A.
3. Put files in `public/audio/` and set `podcastUrl` on the matching destination in
   `src/data/destinations.ts`.
Skip entirely if you don't want podcasts — the player only shows when `podcastUrl` is set.

---

## PART G — PWA (installable + offline)

- `public/manifest.json` — set `name`, `short_name`, `theme_color`, `background_color`, icons.
- `public/images/icon-192.png` & `icon-512.png` — replace with your app icon.
- `public/sw.js` — service worker (network-first with cache fallback). Usually no changes needed.
- Registration is inline in `index.html`.
- **Bump `APP_VERSION`** every deploy; the service worker caches aggressively, so users may need
  to fully close/reopen the installed app to pick up a new build. The version in the header is
  how you confirm the new build loaded.

---

## PART H — Deploy

### H1. Manual deploy (from a computer, simplest)
```bash
npm run build
firebase deploy                       # everything: hosting + functions + firestore + storage
# or piecemeal:
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage
```
Live at `https://<project-id>.web.app`. First functions deploy will prompt to enable APIs —
accept.

### H2. Automated deploy with GitHub Actions (optional) — `.github/workflows/deploy.yml`
The included workflow builds and deploys **hosting** on every push, and has optional
`workflow_dispatch` inputs to also clear the shared itinerary or deploy functions.
Setup:
1. Create a **service account** with a JSON key (Firebase console → Project settings →
   Service accounts → Generate new private key). Add it as the GitHub repo secret
   **`FIREBASE_SERVICE_ACCOUNT`** (Settings → Secrets and variables → Actions).
2. Update `projectId` in the workflow.
3. Push → it builds and deploys hosting automatically.

> **This CI path deploys HOSTING ONLY out of the box.** Deploying **functions** or **rules**
> from CI needs extra IAM permissions on that service account — see Part I. From a computer,
> your own owner login has them already, so **manual `firebase deploy` is the reliable path**
> for functions/rules.

---

## PART I — Hard-won gotchas (read this — it will save you hours)

These are real issues encountered building the original app. Bake the fixes in from the start.

1. **Functions require the Blaze plan.** No Blaze → no AI chat, push, or award images.

2. **Firestore has a 1 MiB per-document limit.** Never store base64 images/files inside a
   Firestore doc — the write *silently fails*. Upload binaries to **Storage** and store only the
   download URL. (This bit the Awards feature: AI images vanished on reload until moved to Storage.)

3. **The AI's server-side itinerary/hotel/flight copies must stay in sync with `src/data/*`.**
   `functions/itinerary.js`, `functions/hotels.js`, and `DEFAULT_FLIGHTS` in `functions/index.js`
   are what the chat function reads/writes. If they're stale, the next AI edit overwrites the
   live shared doc with old data. Re-sync (Part D4) and redeploy functions after any itinerary
   change you want the AI to know about.

4. **`shared/itinerary` can mask your file.** `ItineraryPage` was originally reading
   `shared/itinerary` (so the AI could edit it live) and only falling back to the built-in file.
   A stale/edited shared doc then hides your code changes. Two options, both in this codebase's
   history: (a) **harden** the page to always render the built-in file (immune, but AI can't edit
   the displayed itinerary), or (b) keep the shared read but make sure Part I‑3 is satisfied and
   provide a way to clear the doc. If you want AI itinerary editing, do (b) + keep functions in
   sync; otherwise (a) is bulletproof. To clear a bad shared doc you need admin access to
   Firestore (a small `firebase-admin` script with a service-account key, run locally or in CI).

5. **CI service-account IAM roles.** The Firebase Admin-SDK service account can deploy **hosting**
   but by default **cannot**:
   - **Deploy Cloud Functions** — needs **`roles/iam.serviceAccountUser`** (Service Account User)
     so it can *actAs* the runtime SA `<project>@appspot.gserviceaccount.com`. Grant it in
     Google Cloud console → IAM, or just deploy functions from a computer.
   - **Deploy Storage/Firestore rules via `firebase deploy`** — the CLI pre-checks whether the
     API is enabled and needs **`roles/serviceusage.serviceUsageConsumer`** (`serviceusage.services.get`).
     Without it you get a 403. Again, deploying rules from a computer avoids this.
   Grant these once if you want full CI deploys; otherwise use CI for hosting and a computer for
   functions/rules.

6. **Storage rules need recursive wildcards** (`{allPaths=**}`) or nested-path uploads fail
   silently (Part C3).

7. **`verbatimModuleSyntax`** — type-only imports must use `import type` or the build breaks.

8. **PWA caching** — bump `APP_VERSION` and fully reopen the installed app to see changes.

9. **Keep `CLAUDE.md` updated.** The original keeps a running "Deployed Version" log and current
   state so a new session (or a person switching PC↔phone) has full context. Maintain the same
   habit — it's how Claude stays oriented across sessions.

10. **Two config files must match** (`src/firebase.ts` and `public/firebase-messaging-sw.js`) or
    push notifications break.

---

## PART J — Suggested order of operations (checklist)

- [ ] Node 20, Firebase CLI, clone, `npm install`, `npm --prefix functions install`
- [ ] Create Firebase project on **Blaze**; enable Auth(Google)/Firestore/Storage/Hosting/Functions/Messaging
- [ ] Paste web config → `src/firebase.ts` + `public/firebase-messaging-sw.js`; set `.firebaserc`
- [ ] Authorized domains include your `.web.app` + `localhost`
- [ ] Replace `familyMembers` (emails, roles, names) in `AuthContext.tsx` (+ any duplicate lists)
- [ ] `firebase functions:secrets:set GEMINI_API_KEY`
- [ ] Generate a Web Push VAPID key → `useNotifications.ts`; update `dailyCountdown` dates/TZ/copy
- [ ] Fill in data: version, flights (+DEFAULT_FLIGHTS), hotels (+functions/hotels.js), itinerary (+functions/itinerary.js), destinations, emergency, HomePage constants, weather overrides, currency/budget, games/phrasebook
- [ ] Generate images (Gemini) into `public/images/` with the exact filenames
- [ ] (Optional) podcasts → `public/audio/` + `podcastUrl`
- [ ] PWA: manifest name, icons, theme colors
- [ ] `npm run build` clean → `firebase deploy`
- [ ] Test: log in as each family email; check countdown, itinerary, weather, chat, push toggle, budget, games
- [ ] (Optional) GitHub Actions + `FIREBASE_SERVICE_ACCOUNT` secret (+ IAM roles for full CI)

---

## PART K — Handing this to Claude

If Claude is doing the build, a good kickoff prompt is:

> "Read `BUILD_NEW_TRIP_APP.md`. I'm adapting this trip app for **<family>** going to
> **<destination>** on **<dates>**. Here are the flights, hotels, and day-by-day plan: <paste>.
> The family members and their Google emails are: <list>. Primary language: <language>.
> Walk me through Parts B–H: tell me exactly what to click in the Firebase/Google consoles,
> then make all the code/data edits yourself, generate the images, and deploy. Ask me for any
> fact you need."

Claude can do all the file edits, image-generation scripts, and (with your approvals and a
one-time `firebase login`) the deploys. The console steps (creating the project, enabling APIs,
generating keys, granting IAM roles) must be done by **you** — Claude will tell you exactly where
to click.

---

*Generated to accompany the Costa Rica Family Trip App source code. The code is generic; swap in
your data (Part D), your Firebase project (Parts B–C), and your images (Part E), and you have a
brand-new trip companion app.*
