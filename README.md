# Family Trip Companion App — Start Here 👋

This is a reusable **family-trip companion PWA** (React + TypeScript + Firebase + Gemini AI).
It was built for one family's trip, and it's designed to be **re-skinned for a different family
and a different destination**.

> **You were handed this to build a trip app for your own vacation.** Everything you need is here.
> This README is the 60-second orientation; the real instructions live in
> **[`BUILD_NEW_TRIP_APP.md`](./BUILD_NEW_TRIP_APP.md)**.

---

## 📚 The three docs (read in this order)

| Doc | What it is | When to use |
|-----|-----------|-------------|
| **README.md** (this file) | Orientation + quickstart | First — right now |
| **[`BUILD_NEW_TRIP_APP.md`](./BUILD_NEW_TRIP_APP.md)** | **The full build guide** — accounts, Firebase, Gemini, all the data, images, deploy, gotchas, and a find-&-replace map (Part L) | To actually build & ship your version |
| **`CLAUDE.md`** | The original app's architecture/reference notes | Deep-dive reference while editing; adapt as you go |

---

## 🧩 Is this a filled-in app or a blank template?

This copy may be **scrubbed** — the previous family's private values (Firebase keys, emails,
booking numbers, names) have been replaced with **placeholders** like `<YOUR_FIREBASE_API_KEY>`
and `your-project-id`. That means it **won't run until you plug in your own** Firebase project
and trip data. That's expected. The **destination content (Costa Rica + Madrid) is still there
as a worked example** — you'll swap it for your own trip in Part D of the guide.

To find everything you must replace: see **Part L "Values to replace"** in the build guide.

---

## ⚡ 5-minute quickstart

```bash
# 1. Install dependencies (Node 20+ required)
npm install
npm --prefix functions install

# 2. Run it locally (shows the example trip; cloud features need your Firebase — see the guide)
npm run dev

# 3. Type-check / production build
npm run build
```

Then follow **`BUILD_NEW_TRIP_APP.md`** to:
1. Create your **Firebase** project (Blaze plan) and paste its config into `src/firebase.ts` + `public/firebase-messaging-sw.js`.
2. Set your **Gemini** API key as a Functions secret; add your **Web Push (VAPID)** key.
3. Put your **family + emails** in `src/context/AuthContext.tsx`.
4. Replace the **trip data** in `src/data/*` (flights, hotels, itinerary, destinations, …).
5. Generate **images** with Gemini into `public/images/`.
6. `npm run build && firebase deploy`.

---

## 🗺️ What's in the box

- **Frontend:** React + TypeScript (Vite), `react-router-dom`, `lucide-react`, `date-fns`, vanilla CSS (mobile-first, RTL-aware, bilingual).
- **Backend (Firebase):** Auth (Google sign-in, family whitelist), Firestore (real-time family sync), Storage (photos/docs), Hosting, **Cloud Functions v2** (Node 20), Cloud Messaging (push).
- **AI (Gemini):** in-app **trip-guide chat** + **image generation**.
- **Features:** live countdown, per-day **weather**, expandable **itinerary** with done-checkboxes, **hotels & flights**, **destinations** with podcasts, a full **games** suite, **stickers**, **packing**, **currency**, **budget** (parent-only), **documents** vault, **emergency** contacts, **awards**, **album**, and an **AI chat**.

```
src/        app code (data/, context/, hooks/, components/, pages/)  ← src/data/types.ts = the schema
functions/  Cloud Functions (AI chat, push, daily countdown, award images)
public/     images, PWA manifest, service workers, icons
firebase.json / firestore.rules / storage.rules / .firebaserc   ← deploy config
.github/workflows/deploy.yml   ← optional auto-deploy
```

---

## 🤖 Building it with Claude (recommended)

This project is designed to be finished with **Claude Code**. Open the folder in Claude and say:

> *"Read `BUILD_NEW_TRIP_APP.md`. Help me set this app up for my family's trip to `<destination>`
> on `<dates>`. Here are the flights/hotels/day-by-day plan: `<paste>`. Family members + Google
> emails: `<list>`. Primary language: `<language>`. Walk me through the Firebase/Gemini console
> steps, then make the code/data edits and generate the images yourself."*

Claude can do all the file edits, write the image-generation script, and run the deploys (after a
one-time `firebase login`). The console steps — creating the Firebase project, enabling APIs,
generating keys, granting IAM roles — are yours to click; Claude will tell you exactly where.

---

*Happy travels — and happy building.* 🌍
