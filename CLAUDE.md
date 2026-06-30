# Costa Rica Family Trip App

## Project Overview
A React + TypeScript PWA travel companion app for a family vacation to Costa Rica (+ Madrid stopover), inspired by [ranaviv.com/thailand-trip-app](https://ranaviv.com/thailand-trip-app).

## Trip Details
- **Dates:** July 23 – August 10, 2026 (15 nights Costa Rica + 3 nights Madrid + travel days)
- **Travelers:** 5 people — 2 adults + children aged 22, 17, 12
- **Family:** Israeli, Hebrew-speaking. App is Hebrew-primary with English toggle.
- **Phones:** Mix of iPhones and Android — that's why we're building a web app (PWA)
- **Tour operator:** 506 Expeditions (guide named Jorge), $250/day for car+guide

## Flights (Iberia)
| # | Route | Flight | Date | Time |
|---|-------|--------|------|------|
| 1 | TLV → MAD | IB1874 | Jul 23 | 05:30 → 09:55 |
| 2 | MAD → SJO | IB243 | Jul 23 | 11:30 → 14:35 |
| 3 | SJO → MAD | IB244 | Aug 6 | 16:10 → 10:50+1 |
| 4 | MAD → TLV | IB1873 | Aug 10 | 17:00 → 22:50 |

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
- **Day 2 (Jul 24):** Drive to La Fortuna (3h). La Tirimbina Reserve + Chocolate Tour ($40/pp).
- **Day 3 (Jul 25):** Rafting Balsa River ($80/pp) + Arenal Volcano 1968 hike ($30/pp). Evening thermal pools.
- **Day 4 (Jul 26):** Canyoning ($100/pp) + La Fortuna Waterfall ($25/pp) + Night Tour Ecocentro Danaus ($60/pp).
- **Day 5 (Jul 27):** Drive to Rio Celeste (1.5–2h). Guided hike Tenorio Volcano NP ($14/pp) + horseback riding ($50/pp).
- **Day 6 (Jul 28):** Day trip to Rincón de la Vieja NP (2.5–3h). Las Pailas hike ($17/pp).
- **Day 7 (Jul 29):** Drive to Monteverde (2.5h). Hanging Bridges tour ($40/pp).
- **Day 8 (Jul 30):** Canopy + Aerial Tram at Treetopia ($101/pp). Drive to Manuel Antonio (3.5–4h).
- **Day 9 (Jul 31):** Guided visit Manuel Antonio NP ($18/pp). Afternoon at the beach.
- **Day 10 (Aug 1):** Catamaran / jet ski / whale watching (TBD).
- **Day 11 (Aug 2):** Mangrove boat tour ($65/pp) + Biesanz Beach. Drive to Uvita (20 min).
- **Day 12 (Aug 3):** Boat to San Pedrillo + guided walk Corcovado NP ($120/pp).
- **Day 13 (Aug 4):** Horseback ride to Nauyaca Waterfalls ($80/pp). Drive to San Gerardo de Dota (4h).
- **Day 14 (Aug 5):** Morning forest walk Dota ($40/pp). Drive back to Alajuela (2.5–3.5h).
- **Day 15 (Aug 6):** Private transfer to SJO ($50). Fly SJO→MAD (IB244, 16:10).
- **Day 16 (Aug 7):** Arrive Madrid 10:50. Transfer via Booking (8-seat van, €55, conf #247998892).
- **Days 17–18 (Aug 8–9):** Madrid free days.
- **Day 19 (Aug 10):** Fly MAD→TLV (IB1873, 17:00, arrive 22:50).

## Budget Summary
- Flights: $9,450
- Car + Guide: $3,000
- Activities: ~$4,500
- Hotels (Costa Rica): $13,168
- Hotel (Madrid): €1,757
- Extra: $6,000
- **Total: ~$37,875**

## Tech Stack
- **Framework:** React + TypeScript (Vite)
- **Routing:** react-router-dom
- **Icons:** lucide-react
- **Dates:** date-fns
- **Styling:** Vanilla CSS, mobile-first, tropical green theme
- **Languages:** Hebrew (primary) + English toggle, RTL support via LanguageContext
- **Target:** PWA (cross-platform, offline-capable)
- **Hosting:** Firebase Hosting (planned)
- **Repo:** github.com/ofiralon10/CostaRicApp

## App Structure
```
src/
  data/         — types.ts, flights.ts, hotels.ts, itinerary.ts, destinations.ts, emergency.ts
  context/      — LanguageContext.tsx (Hebrew/English toggle + RTL)
  components/   — Layout.tsx (header + bottom nav + router outlet)
  pages/        — HomePage, ItineraryPage, MapPage, HotelsPage, DestinationsPage, EmergencyPage
  index.css     — Full stylesheet
```

## Current State (v1)
All 6 pages are built and functional:
1. **Home** — Live countdown, hero banner, quick stats
2. **Itinerary** — 19-day expandable timeline with activities, costs, maps links
3. **Map** — Route stops linking to Google Maps
4. **Hotels & Flights** — All booking details with navigate links
5. **Destinations** — 8 destination cards with fun facts
6. **Emergency** — Contacts with tap-to-call

## Planned Features (not yet built)
- Currency converter (Colon/Euro ↔ ILS/USD)
- Packing checklist
- Spanish phrasebook
- PWA manifest + service worker for offline
- Firebase Hosting deployment
- Budget tracker
- Document vault (passports, insurance, bookings)

## Design Inspiration
Based on the Thailand trip app by Ran Aviv (ranaviv.com/thailand-trip-app):
- Storybook-style illustrations per destination
- Gamification / progression (stamps, badges)
- Kids' audio podcast per destination
- Weather module with hand-drawn icons
- Document vault with offline access

## Important Notes
- `verbatimModuleSyntax` is enabled in tsconfig — use `import type` for type-only imports
- The app uses `date-fns` with Hebrew locale support
- All data is typed in `src/data/types.ts`
- CSS uses CSS custom properties for theming (--green-*, --gray-*, etc.)
