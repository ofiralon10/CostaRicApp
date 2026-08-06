// One-off maintenance: clear the `shared/itinerary` Firestore override so the
// app falls back to the built-in itinerary in src/data/itinerary.ts.
//
// Why: ItineraryPage reads `shared/itinerary` first (so the in-app AI chat can
// edit the plan live) and only falls back to the default file. If that doc was
// written while the Madrid days were still empty, it masks later file edits.
//
// Runs in GitHub Actions with the FIREBASE_SERVICE_ACCOUNT secret (Firebase
// Admin SDK bypasses security rules). Prints the existing value first as a
// backup, then deletes the doc. Deleting is safe: the app just uses the file,
// and a future AI-chat edit will recreate the doc.

import admin from 'firebase-admin'

const raw = process.env.FIREBASE_SERVICE_ACCOUNT
if (!raw) {
  console.error('Missing FIREBASE_SERVICE_ACCOUNT env var')
  process.exit(1)
}

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) })
const db = admin.firestore()
const ref = db.doc('shared/itinerary')

const snap = await ref.get()
if (!snap.exists) {
  console.log('shared/itinerary does not exist — the app already uses the built-in itinerary. Nothing to do.')
  process.exit(0)
}

console.log('=== BACKUP of existing shared/itinerary (save this to restore if needed) ===')
console.log(JSON.stringify(snap.data()))
console.log('=== END BACKUP ===')

await ref.delete()
console.log('Deleted shared/itinerary. The app will now use the built-in itinerary file (with the full Madrid plan).')
process.exit(0)
