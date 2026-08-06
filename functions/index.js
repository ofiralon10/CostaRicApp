const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const https = require("https");
const admin = require("firebase-admin");

const DEFAULT_ITINERARY = require("./itinerary");
const DEFAULT_HOTELS = require("./hotels");

admin.initializeApp();
const db = admin.firestore();

const geminiKey = defineSecret("GEMINI_API_KEY");

const CHAT_SYSTEM = `You are a friendly, knowledgeable travel guide for an Israeli family of 5 (2 parents, kids aged 12, 17, 22) going on a trip to Costa Rica and Madrid in July-August 2026.
Their itinerary: 14 days in Costa Rica (La Fortuna, Rio Celeste, Monteverde, Manuel Antonio, Uvita/Corcovado, San Gerardo de Dota) + 3 days in Madrid.
Answer in the same language the user writes in (Hebrew or English). Keep answers concise and practical.
You are happy to answer ANY question about Costa Rica, Madrid, or Spain. This includes but is not limited to: geography, mountains, volcanoes, rivers, climate, weather, animals, birds, reptiles, insects, plants, flowers, trees, forests, national parks, tourism, beaches, population, demographics, cities, regions, culture, traditions, holidays, festivals, music, dance, art, history, politics, economy, currency, food, cuisine, recipes, drinks, coffee, agriculture, language, Spanish phrases, slang, indigenous peoples, religions, sports, soccer, surfing, safety, health, transportation, driving, airports, and anything else about these destinations. Be generous and enthusiastic with your knowledge — if someone asks a factual question about Costa Rica or Spain, answer it fully.
You can also help with: restaurant recommendations, local tips, safety advice, what to pack, wildlife spotting tips, cultural etiquette, weather, hidden gems, and trip planning.
Only decline questions that have absolutely nothing to do with Costa Rica, Spain, travel, or the trip.

You can view and modify almost anything about this trip using your tools:
- Itinerary (days, activities, notes, costs): get_itinerary, get_day, add_activity, remove_activity, update_activity, add_note, set_day_title (rename a day), reorder_activities (change the order of events within a day)
- Packing list: get_packing_list, add_packing_item, remove_packing_item
- Flights: get_flights, update_flight
- Hotels: get_hotels, update_hotel

Users may upload a document or image — a new flight itinerary, a hotel confirmation, a ticket, a booking change, etc. Read it carefully and, if it contains updated trip information, APPLY the changes with the matching tools. Workflow: first call the relevant get_* tool to see current values, then call the update tool with only the changed fields (match flights by current flight number, hotels by name). Handle multiple changes in one document by calling the tools repeatedly.
If a change doesn't fit any tool (e.g. emergency contacts or budget), say clearly what you can't edit directly and summarize the info so the user can update it.
After making any change, confirm clearly and specifically what you updated.`;

const ITINERARY_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "get_itinerary",
        description: "Get the full trip itinerary to see current plans for all days",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "get_day",
        description: "Get the itinerary for a specific day number (1-19)",
        parameters: {
          type: "OBJECT",
          properties: {
            day: { type: "INTEGER", description: "Day number (1-19)" },
          },
          required: ["day"],
        },
      },
      {
        name: "add_activity",
        description: "Add a new activity to a specific day in the itinerary",
        parameters: {
          type: "OBJECT",
          properties: {
            day: { type: "INTEGER", description: "Day number (1-19)" },
            name: { type: "STRING", description: "Activity name in English" },
            nameHe: { type: "STRING", description: "Activity name in Hebrew" },
            description: { type: "STRING", description: "Activity description in English" },
            descriptionHe: { type: "STRING", description: "Activity description in Hebrew" },
            costPerPerson: { type: "NUMBER", description: "Cost per person in USD (optional)" },
            mapsUrl: { type: "STRING", description: "Google Maps URL (optional)" },
          },
          required: ["day", "name", "nameHe"],
        },
      },
      {
        name: "remove_activity",
        description: "Remove an activity from a specific day by its ID or name",
        parameters: {
          type: "OBJECT",
          properties: {
            day: { type: "INTEGER", description: "Day number (1-19)" },
            activityId: { type: "STRING", description: "Activity ID to remove (e.g. 'd3a2')" },
            activityName: { type: "STRING", description: "Activity name to remove (if ID unknown)" },
          },
          required: ["day"],
        },
      },
      {
        name: "update_activity",
        description: "Update an existing activity's details",
        parameters: {
          type: "OBJECT",
          properties: {
            day: { type: "INTEGER", description: "Day number (1-19)" },
            activityId: { type: "STRING", description: "Activity ID to update" },
            activityName: { type: "STRING", description: "Activity name to find (if ID unknown)" },
            name: { type: "STRING", description: "New name in English (optional)" },
            nameHe: { type: "STRING", description: "New name in Hebrew (optional)" },
            description: { type: "STRING", description: "New description in English (optional)" },
            descriptionHe: { type: "STRING", description: "New description in Hebrew (optional)" },
            costPerPerson: { type: "NUMBER", description: "New cost per person (optional)" },
            mapsUrl: { type: "STRING", description: "New Google Maps URL (optional)" },
          },
          required: ["day"],
        },
      },
      {
        name: "add_note",
        description: "Add or update the notes for a specific day",
        parameters: {
          type: "OBJECT",
          properties: {
            day: { type: "INTEGER", description: "Day number (1-19)" },
            notes: { type: "STRING", description: "Note text in English" },
            notesHe: { type: "STRING", description: "Note text in Hebrew" },
          },
          required: ["day", "notes", "notesHe"],
        },
      },
      {
        name: "set_day_title",
        description: "Change the title/heading of a day (the location label shown for that day). Provide English and/or Hebrew — at least one.",
        parameters: {
          type: "OBJECT",
          properties: {
            day: { type: "INTEGER", description: "Day number (1-19)" },
            title: { type: "STRING", description: "New day title in English (optional)" },
            titleHe: { type: "STRING", description: "New day title in Hebrew (optional)" },
          },
          required: ["day"],
        },
      },
      {
        name: "reorder_activities",
        description: "Reorder the activities (events) within a day. Provide the activity IDs in the desired new order. Any activities you omit are appended at the end in their current order. Call get_day first to see the current activity IDs.",
        parameters: {
          type: "OBJECT",
          properties: {
            day: { type: "INTEGER", description: "Day number (1-19)" },
            order: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "Activity IDs in the desired order, e.g. ['a17-2','a17-1','a17-4']",
            },
          },
          required: ["day", "order"],
        },
      },
      {
        name: "add_packing_item",
        description: "Add a new item to the packing list in a specific category",
        parameters: {
          type: "OBJECT",
          properties: {
            categoryId: { type: "STRING", description: "Category ID: documents, clothing, gear, health, adventure, or snacks" },
            name: { type: "STRING", description: "Item name in English" },
            nameHe: { type: "STRING", description: "Item name in Hebrew" },
          },
          required: ["categoryId", "name", "nameHe"],
        },
      },
      {
        name: "remove_packing_item",
        description: "Remove an item from the packing list by ID or name",
        parameters: {
          type: "OBJECT",
          properties: {
            itemId: { type: "STRING", description: "Item ID to remove (e.g. 'c3')" },
            itemName: { type: "STRING", description: "Item name to search for (if ID unknown)" },
          },
        },
      },
      {
        name: "get_packing_list",
        description: "Get the current packing list with all categories and items",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "get_flights",
        description: "Get the current flight list (airline, flight number, route, times, date)",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "update_flight",
        description: "Update an existing flight's details. Identify the flight by id (f1-f4) or by its current flight number. Provide only the fields to change.",
        parameters: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING", description: "Flight id: f1, f2, f3, or f4 (optional if flightNumber given)" },
            matchFlightNumber: { type: "STRING", description: "Current flight number to find the flight (if id unknown), e.g. 'IB1874'" },
            airline: { type: "STRING", description: "New airline name (optional)" },
            flightNumber: { type: "STRING", description: "New flight number (optional)" },
            from: { type: "STRING", description: "New origin, e.g. 'Tel Aviv (TLV)' (optional)" },
            to: { type: "STRING", description: "New destination (optional)" },
            departure: { type: "STRING", description: "New departure time HH:MM (optional)" },
            arrival: { type: "STRING", description: "New arrival time HH:MM, add '+1' if next day (optional)" },
            date: { type: "STRING", description: "New date YYYY-MM-DD (optional)" },
          },
        },
      },
      {
        name: "get_hotels",
        description: "Get the current hotel list (name, location, check-in/out dates, nights, rooms, cost, booking confirmation)",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "update_hotel",
        description: "Update an existing hotel booking. Identify by id (h1-h9) or by matching the current hotel name. Provide only the fields to change.",
        parameters: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING", description: "Hotel id: h1..h9 (optional if name given)" },
            matchName: { type: "STRING", description: "Current hotel name (or part of it) to find the hotel (if id unknown)" },
            name: { type: "STRING", description: "New hotel name (optional)" },
            location: { type: "STRING", description: "New location (optional)" },
            region: { type: "STRING", description: "New region (optional)" },
            checkIn: { type: "STRING", description: "New check-in date YYYY-MM-DD (optional)" },
            checkOut: { type: "STRING", description: "New check-out date YYYY-MM-DD (optional)" },
            nights: { type: "NUMBER", description: "New number of nights (optional)" },
            rooms: { type: "STRING", description: "New room description (optional)" },
            cost: { type: "NUMBER", description: "New total cost in USD (optional)" },
            bookingConfirmation: { type: "STRING", description: "Booking confirmation/reference number (optional)" },
          },
        },
      },
    ],
  },
];

const DEFAULT_PACKING_ITEMS = [
  { id: 'd1', categoryId: 'documents', name: 'Passports', nameHe: 'דרכונים' },
  { id: 'd2', categoryId: 'documents', name: 'Travel insurance', nameHe: 'ביטוח נסיעות' },
  { id: 'd3', categoryId: 'documents', name: 'Flight tickets (printed)', nameHe: 'כרטיסי טיסה (מודפסים)' },
  { id: 'd4', categoryId: 'documents', name: 'Hotel confirmations', nameHe: 'אישורי מלון' },
  { id: 'd5', categoryId: 'documents', name: 'Credit cards', nameHe: 'כרטיסי אשראי' },
  { id: 'd6', categoryId: 'documents', name: 'USD cash', nameHe: 'מזומן דולרים' },
  { id: 'd7', categoryId: 'documents', name: "Driver's license", nameHe: 'רישיון נהיגה' },
  { id: 'd8', categoryId: 'documents', name: 'Emergency contacts list', nameHe: 'רשימת טלפונים לחירום' },
  { id: 'c1', categoryId: 'clothing', name: 'Light hiking clothes', nameHe: 'בגדי הליכה קלים' },
  { id: 'c2', categoryId: 'clothing', name: 'Swimsuits', nameHe: 'בגדי ים' },
  { id: 'c3', categoryId: 'clothing', name: 'Rain jacket / poncho', nameHe: "מעיל גשם / פונצ'ו" },
  { id: 'c4', categoryId: 'clothing', name: 'Hiking shoes', nameHe: 'נעלי הליכה' },
  { id: 'c5', categoryId: 'clothing', name: 'Sandals / flip-flops', nameHe: 'סנדלים / כפכפים' },
  { id: 'c6', categoryId: 'clothing', name: 'Long sleeves for evenings', nameHe: 'שרוולים ארוכים לערב' },
  { id: 'c7', categoryId: 'clothing', name: 'Light long pants', nameHe: 'מכנסיים ארוכים קלים' },
  { id: 'c8', categoryId: 'clothing', name: 'Socks (quick-dry)', nameHe: 'גרביים (מתייבשים מהר)' },
  { id: 'c9', categoryId: 'clothing', name: 'Hat / cap', nameHe: 'כובע' },
  { id: 'g1', categoryId: 'gear', name: 'Phone chargers', nameHe: 'מטענים לטלפון' },
  { id: 'g2', categoryId: 'gear', name: 'Power bank', nameHe: 'סוללת גיבוי' },
  { id: 'g3', categoryId: 'gear', name: 'Camera + charger', nameHe: 'מצלמה + מטען' },
  { id: 'g4', categoryId: 'gear', name: 'Binoculars', nameHe: 'משקפת' },
  { id: 'g5', categoryId: 'gear', name: 'Daypack / small backpack', nameHe: 'תיק גב קטן ליום' },
  { id: 'g6', categoryId: 'gear', name: 'Dry bag (waterproof)', nameHe: 'שקית אטומה למים' },
  { id: 'g7', categoryId: 'gear', name: 'Water bottles', nameHe: 'בקבוקי מים' },
  { id: 'g8', categoryId: 'gear', name: 'Travel adapter (Type A/B)', nameHe: 'מתאם חשמל (Type A/B)' },
  { id: 'g9', categoryId: 'gear', name: 'Headphones', nameHe: 'אוזניות' },
  { id: 'h1', categoryId: 'health', name: 'Sunscreen (SPF 50+)', nameHe: 'קרם הגנה (SPF 50+)' },
  { id: 'h2', categoryId: 'health', name: 'Insect repellent (DEET)', nameHe: 'דוחה יתושים (DEET)' },
  { id: 'h3', categoryId: 'health', name: 'Personal medications', nameHe: 'תרופות אישיות' },
  { id: 'h4', categoryId: 'health', name: 'First aid kit', nameHe: 'ערכת עזרה ראשונה' },
  { id: 'h5', categoryId: 'health', name: 'Anti-diarrhea medicine', nameHe: 'תרופה נגד שלשול' },
  { id: 'h6', categoryId: 'health', name: 'Motion sickness pills', nameHe: 'כדורים נגד מחלת ים' },
  { id: 'h7', categoryId: 'health', name: 'Toothbrush & toothpaste', nameHe: 'מברשת ומשחת שיניים' },
  { id: 'h8', categoryId: 'health', name: 'Shampoo & soap (travel)', nameHe: 'שמפו וסבון (מטען)' },
  { id: 'h9', categoryId: 'health', name: 'After-sun lotion', nameHe: 'קרם אפטר סאן' },
  { id: 'a1', categoryId: 'adventure', name: 'Quick-dry towel', nameHe: 'מגבת מתייבשת מהר' },
  { id: 'a2', categoryId: 'adventure', name: 'Waterproof phone case', nameHe: 'כיסוי עמיד למים לטלפון' },
  { id: 'a3', categoryId: 'adventure', name: 'Sunglasses (with strap)', nameHe: 'משקפי שמש (עם רצועה)' },
  { id: 'a4', categoryId: 'adventure', name: 'Snorkeling gear', nameHe: 'ציוד שנירקול' },
  { id: 'a5', categoryId: 'adventure', name: 'Flashlight / headlamp', nameHe: 'פנס / פנס ראש' },
  { id: 'a6', categoryId: 'adventure', name: 'Ziplock bags', nameHe: "שקיות ג'ל" },
  { id: 's1', categoryId: 'snacks', name: 'Snacks for flights', nameHe: 'חטיפים לטיסות' },
  { id: 's2', categoryId: 'snacks', name: 'Neck pillow', nameHe: 'כרית צוואר' },
  { id: 's3', categoryId: 'snacks', name: 'Books / Kindle', nameHe: 'ספרים / קינדל' },
  { id: 's4', categoryId: 'snacks', name: 'Card games', nameHe: 'משחקי קלפים' },
  { id: 's5', categoryId: 'snacks', name: 'Earplugs + eye mask', nameHe: 'אטמי אוזניים + מסיכת עיניים' },
];

const DEFAULT_FLIGHTS = [
  { id: 'f1', airline: 'El Al', flightNumber: 'LY395', from: 'Tel Aviv (TLV)', to: 'Madrid (MAD)', departure: '05:00', arrival: '09:20', date: '2026-07-23' },
  { id: 'f2', airline: 'Iberia', flightNumber: 'IB243', from: 'Madrid (MAD)', to: 'San José (SJO)', departure: '11:30', arrival: '14:35', date: '2026-07-23' },
  { id: 'f3', airline: 'Iberia', flightNumber: 'IB244', from: 'San José (SJO)', to: 'Madrid (MAD)', departure: '16:10', arrival: '10:50+1', date: '2026-08-06' },
  { id: 'f4', airline: 'El Al', flightNumber: 'LY398', from: 'Madrid (MAD)', to: 'Tel Aviv (TLV)', departure: '22:50', arrival: '04:25+1', date: '2026-08-10' },
];

async function getFlightsFromDb() {
  const doc = await db.collection("shared").doc("flights").get();
  if (doc.exists) return doc.data().value;
  return JSON.parse(JSON.stringify(DEFAULT_FLIGHTS));
}

async function saveFlightsToDb(flights) {
  await db.collection("shared").doc("flights").set({ value: flights }, { merge: false });
}

async function getHotelsFromDb() {
  const doc = await db.collection("shared").doc("hotels").get();
  if (doc.exists) return doc.data().value;
  return JSON.parse(JSON.stringify(DEFAULT_HOTELS));
}

async function saveHotelsToDb(hotels) {
  await db.collection("shared").doc("hotels").set({ value: hotels }, { merge: false });
}

async function getPackingConfig() {
  const doc = await db.collection("shared").doc("packing-config").get();
  if (doc.exists) return doc.data().value;
  return { customItems: [], removedIds: [] };
}

async function savePackingConfig(config) {
  await db.collection("shared").doc("packing-config").set({ value: config }, { merge: false });
}

async function getItineraryFromDb() {
  const doc = await db.collection("shared").doc("itinerary").get();
  if (doc.exists) {
    return doc.data().value;
  }
  return null;
}

async function saveItineraryToDb(itinerary) {
  await db.collection("shared").doc("itinerary").set({ value: itinerary }, { merge: false });
}

function generateActivityId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

async function handleToolCall(functionCall) {
  const name = functionCall.name;
  const args = functionCall.args || {};

  let itinerary = await getItineraryFromDb();
  if (!itinerary) {
    itinerary = JSON.parse(JSON.stringify(DEFAULT_ITINERARY));
  }

  if (name === "get_itinerary") {
    const summary = itinerary.map((d) => ({
      day: d.day,
      date: d.date,
      location: d.location,
      activities: d.activities.map((a) => ({ id: a.id, name: a.name, nameHe: a.nameHe })),
      notes: d.notes,
    }));
    return { result: JSON.stringify(summary) };
  }

  if (name === "get_day") {
    const day = itinerary.find((d) => d.day === args.day);
    if (!day) return { result: JSON.stringify({ error: "Day not found" }) };
    return { result: JSON.stringify(day) };
  }

  if (name === "add_activity") {
    const dayIdx = itinerary.findIndex((d) => d.day === args.day);
    if (dayIdx === -1) return { result: JSON.stringify({ error: "Day not found" }) };

    const newActivity = {
      id: generateActivityId(),
      name: args.name,
      nameHe: args.nameHe,
    };
    if (args.description) newActivity.description = args.description;
    if (args.descriptionHe) newActivity.descriptionHe = args.descriptionHe;
    if (args.costPerPerson) newActivity.costPerPerson = args.costPerPerson;
    if (args.mapsUrl) newActivity.mapsUrl = args.mapsUrl;

    itinerary[dayIdx].activities.push(newActivity);
    await saveItineraryToDb(itinerary);
    return { result: JSON.stringify({ success: true, activity: newActivity }) };
  }

  if (name === "remove_activity") {
    const dayIdx = itinerary.findIndex((d) => d.day === args.day);
    if (dayIdx === -1) return { result: JSON.stringify({ error: "Day not found" }) };

    const activities = itinerary[dayIdx].activities;
    let removeIdx = -1;
    if (args.activityId) {
      removeIdx = activities.findIndex((a) => a.id === args.activityId);
    } else if (args.activityName) {
      removeIdx = activities.findIndex(
        (a) =>
          a.name.toLowerCase().includes(args.activityName.toLowerCase()) ||
          a.nameHe.includes(args.activityName)
      );
    }
    if (removeIdx === -1) return { result: JSON.stringify({ error: "Activity not found" }) };

    const removed = activities.splice(removeIdx, 1)[0];
    await saveItineraryToDb(itinerary);
    return { result: JSON.stringify({ success: true, removed }) };
  }

  if (name === "update_activity") {
    const dayIdx = itinerary.findIndex((d) => d.day === args.day);
    if (dayIdx === -1) return { result: JSON.stringify({ error: "Day not found" }) };

    const activities = itinerary[dayIdx].activities;
    let activity = null;
    if (args.activityId) {
      activity = activities.find((a) => a.id === args.activityId);
    } else if (args.activityName) {
      activity = activities.find(
        (a) =>
          a.name.toLowerCase().includes(args.activityName.toLowerCase()) ||
          a.nameHe.includes(args.activityName)
      );
    }
    if (!activity) return { result: JSON.stringify({ error: "Activity not found" }) };

    if (args.name) activity.name = args.name;
    if (args.nameHe) activity.nameHe = args.nameHe;
    if (args.description) activity.description = args.description;
    if (args.descriptionHe) activity.descriptionHe = args.descriptionHe;
    if (args.costPerPerson !== undefined) activity.costPerPerson = args.costPerPerson;
    if (args.mapsUrl) activity.mapsUrl = args.mapsUrl;

    await saveItineraryToDb(itinerary);
    return { result: JSON.stringify({ success: true, activity }) };
  }

  if (name === "add_note") {
    const dayIdx = itinerary.findIndex((d) => d.day === args.day);
    if (dayIdx === -1) return { result: JSON.stringify({ error: "Day not found" }) };

    itinerary[dayIdx].notes = args.notes;
    itinerary[dayIdx].notesHe = args.notesHe;
    await saveItineraryToDb(itinerary);
    return { result: JSON.stringify({ success: true }) };
  }

  if (name === "set_day_title") {
    const dayIdx = itinerary.findIndex((d) => d.day === args.day);
    if (dayIdx === -1) return { result: JSON.stringify({ error: "Day not found" }) };
    if (!args.title && !args.titleHe) {
      return { result: JSON.stringify({ error: "Provide title and/or titleHe" }) };
    }
    if (args.title) itinerary[dayIdx].location = args.title;
    if (args.titleHe) itinerary[dayIdx].locationHe = args.titleHe;
    await saveItineraryToDb(itinerary);
    return {
      result: JSON.stringify({
        success: true,
        day: args.day,
        location: itinerary[dayIdx].location,
        locationHe: itinerary[dayIdx].locationHe,
      }),
    };
  }

  if (name === "reorder_activities") {
    const dayIdx = itinerary.findIndex((d) => d.day === args.day);
    if (dayIdx === -1) return { result: JSON.stringify({ error: "Day not found" }) };

    const activities = itinerary[dayIdx].activities;
    const order = Array.isArray(args.order) ? args.order : [];
    if (order.length === 0) {
      return { result: JSON.stringify({ error: "Provide an 'order' array of activity IDs" }) };
    }

    const byId = new Map(activities.map((a) => [a.id, a]));
    const reordered = [];
    const used = new Set();
    for (const id of order) {
      const a = byId.get(id);
      if (a && !used.has(id)) {
        reordered.push(a);
        used.add(id);
      }
    }
    // Append any activities not mentioned, keeping their original order
    for (const a of activities) {
      if (!used.has(a.id)) reordered.push(a);
    }

    itinerary[dayIdx].activities = reordered;
    await saveItineraryToDb(itinerary);
    return {
      result: JSON.stringify({
        success: true,
        day: args.day,
        order: reordered.map((a) => ({ id: a.id, name: a.name })),
      }),
    };
  }

  if (name === "get_packing_list") {
    const config = await getPackingConfig();
    const allItems = DEFAULT_PACKING_ITEMS
      .filter((i) => !config.removedIds.includes(i.id))
      .concat(config.customItems);
    const grouped = {};
    for (const item of allItems) {
      if (!grouped[item.categoryId]) grouped[item.categoryId] = [];
      grouped[item.categoryId].push({ id: item.id, name: item.name, nameHe: item.nameHe });
    }
    return { result: JSON.stringify(grouped) };
  }

  if (name === "add_packing_item") {
    const config = await getPackingConfig();
    const newItem = {
      id: "custom_" + generateActivityId(),
      categoryId: args.categoryId,
      name: args.name,
      nameHe: args.nameHe,
    };
    config.customItems.push(newItem);
    await savePackingConfig(config);
    return { result: JSON.stringify({ success: true, item: newItem }) };
  }

  if (name === "remove_packing_item") {
    const config = await getPackingConfig();
    if (args.itemId) {
      if (args.itemId.startsWith("custom_")) {
        config.customItems = config.customItems.filter((i) => i.id !== args.itemId);
      } else {
        if (!config.removedIds.includes(args.itemId)) config.removedIds.push(args.itemId);
      }
      await savePackingConfig(config);
      return { result: JSON.stringify({ success: true, removedId: args.itemId }) };
    }
    if (args.itemName) {
      const allItems = DEFAULT_PACKING_ITEMS.concat(config.customItems);
      const match = allItems.find(
        (i) =>
          i.name.toLowerCase().includes(args.itemName.toLowerCase()) ||
          i.nameHe.includes(args.itemName)
      );
      if (!match) return { result: JSON.stringify({ error: "Item not found" }) };
      if (match.id.startsWith("custom_")) {
        config.customItems = config.customItems.filter((i) => i.id !== match.id);
      } else {
        if (!config.removedIds.includes(match.id)) config.removedIds.push(match.id);
      }
      await savePackingConfig(config);
      return { result: JSON.stringify({ success: true, removed: match }) };
    }
    return { result: JSON.stringify({ error: "Provide itemId or itemName" }) };
  }

  if (name === "get_flights") {
    const flights = await getFlightsFromDb();
    return { result: JSON.stringify(flights) };
  }

  if (name === "update_flight") {
    const flights = await getFlightsFromDb();
    let flight = null;
    if (args.id) flight = flights.find((f) => f.id === args.id);
    if (!flight && args.matchFlightNumber) {
      flight = flights.find((f) => f.flightNumber.toLowerCase() === args.matchFlightNumber.toLowerCase());
    }
    if (!flight) return { result: JSON.stringify({ error: "Flight not found" }) };

    for (const key of ["airline", "flightNumber", "from", "to", "departure", "arrival", "date"]) {
      if (args[key] !== undefined && args[key] !== null && args[key] !== "") flight[key] = args[key];
    }
    await saveFlightsToDb(flights);
    return { result: JSON.stringify({ success: true, flight }) };
  }

  if (name === "get_hotels") {
    const hotels = await getHotelsFromDb();
    // Trim coordinates from the summary to keep the model focused on editable fields
    const summary = hotels.map((h) => ({
      id: h.id, name: h.name, location: h.location, region: h.region,
      checkIn: h.checkIn, checkOut: h.checkOut, nights: h.nights,
      rooms: h.rooms, cost: h.cost, bookingConfirmation: h.bookingConfirmation || null,
    }));
    return { result: JSON.stringify(summary) };
  }

  if (name === "update_hotel") {
    const hotels = await getHotelsFromDb();
    let hotel = null;
    if (args.id) hotel = hotels.find((h) => h.id === args.id);
    if (!hotel && args.matchName) {
      const q = args.matchName.toLowerCase();
      hotel = hotels.find((h) => h.name.toLowerCase().includes(q));
    }
    if (!hotel) return { result: JSON.stringify({ error: "Hotel not found" }) };

    for (const key of ["name", "location", "region", "checkIn", "checkOut", "nights", "rooms", "cost", "bookingConfirmation"]) {
      if (args[key] !== undefined && args[key] !== null && args[key] !== "") hotel[key] = args[key];
    }
    await saveHotelsToDb(hotels);
    return { result: JSON.stringify({ success: true, hotel }) };
  }

  return { result: JSON.stringify({ error: "Unknown function" }) };
}

function geminiRequest(apiKey, model, body) {
  return new Promise((resolve, reject) => {
    const json = JSON.stringify(body);
    const req = https.request(
      {
        hostname: "generativelanguage.googleapis.com",
        path: `/v1beta/models/${model}:generateContent`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
          "Content-Length": Buffer.byteLength(json),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(json);
    req.end();
  });
}

exports.chat = onCall(
  { secrets: [geminiKey], region: "us-central1", cors: true, timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const { messages, file } = request.data;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new HttpsError("invalid-argument", "Messages required");
    }

    try {
      const contents = [
        { role: "user", parts: [{ text: CHAT_SYSTEM }] },
        { role: "model", parts: [{ text: "Understood! I'm ready to help with your Costa Rica and Madrid trip. Ask me anything!" }] },
        ...messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      ];

      // Attach an uploaded document/image to the most recent user turn so the
      // model can read it (Gemini reads PDFs and images natively).
      if (file && file.data && file.mimeType) {
        for (let i = contents.length - 1; i >= 0; i--) {
          if (contents[i].role === "user") {
            contents[i].parts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
            break;
          }
        }
      }

      const apiKey = geminiKey.value().trim();

      let result = await geminiRequest(apiKey, "gemini-2.5-flash", {
        contents,
        tools: ITINERARY_TOOLS,
      });

      if (result.error) {
        console.error("Gemini API error:", JSON.stringify(result.error));
        throw new HttpsError("internal", result.error.message || "Gemini API error");
      }

      let maxToolRounds = 5;
      while (maxToolRounds-- > 0) {
        const candidate = result.candidates?.[0];
        if (!candidate) break;

        const parts = candidate.content?.parts || [];
        const functionCallPart = parts.find((p) => p.functionCall);

        if (!functionCallPart) break;

        console.log("Tool call:", functionCallPart.functionCall.name);
        const toolResult = await handleToolCall(functionCallPart.functionCall);

        contents.push({ role: "model", parts });
        contents.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name: functionCallPart.functionCall.name,
                response: toolResult,
              },
            },
          ],
        });

        result = await geminiRequest(apiKey, "gemini-2.5-flash", {
          contents,
          tools: ITINERARY_TOOLS,
        });

        if (result.error) {
          console.error("Gemini API error (tool round):", JSON.stringify(result.error));
          throw new HttpsError("internal", result.error.message || "Gemini API error");
        }
      }

      const finalParts = result.candidates?.[0]?.content?.parts || [];
      const text = finalParts.find((p) => p.text)?.text;
      if (!text) {
        console.error("No text in response:", JSON.stringify(result));
        throw new HttpsError("internal", "No response from AI");
      }

      return { content: text };
    } catch (err) {
      console.error("Chat function error:", err);
      if (err instanceof HttpsError) throw err;
      throw new HttpsError("internal", err.message || "Unknown error");
    }
  }
);

exports.generateAwardImage = onCall(
  { secrets: [geminiKey], region: "us-central1", cors: true, timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const { prompt } = request.data;
    if (!prompt || typeof prompt !== "string") {
      throw new HttpsError("invalid-argument", "Prompt required");
    }

    const fullPrompt = `Create a small, cute watercolor sticker illustration for a family travel award. The image should be: ${prompt}. Style: warm watercolor, storybook illustration, Costa Rica tropical theme, no text, white background, simple and charming.`;

    const result = await geminiRequest(
      geminiKey.value().trim(),
      "gemini-2.5-flash-image",
      {
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }
    );

    const parts = result.candidates?.[0]?.content?.parts;
    const imagePart = parts?.find((p) => p.inlineData);
    if (!imagePart) {
      throw new HttpsError("internal", "No image generated");
    }

    return { image: imagePart.inlineData.data };
  }
);

// ─── SEND PUSH NOTIFICATION ───
exports.sendNotification = onCall(async (request) => {
  const { targetMemberIds, title, body, data } = request.data;
  if (!targetMemberIds || !title) {
    throw new HttpsError("invalid-argument", "targetMemberIds and title required");
  }

  // Tokens are stored one doc PER DEVICE, tagged with memberId — so a member
  // with a PC + phone gets notified on both. Query every device for the targets.
  const snap = await db
    .collection("fcm-tokens")
    .where("memberId", "in", targetMemberIds.slice(0, 30))
    .get();

  const tokenSet = new Set();
  snap.forEach((d) => {
    const tk = d.data().token;
    if (tk) tokenSet.add(tk);
  });
  const tokens = Array.from(tokenSet);

  if (tokens.length === 0) return { sent: 0 };

  const message = {
    notification: { title, body: body || "" },
    data: data || {},
    tokens,
  };

  const result = await admin.messaging().sendEachForMulticast(message);
  return { sent: result.successCount, failed: result.failureCount };
});

// ─── DAILY MORNING COUNTDOWN NOTIFICATION ───
const DEPARTURE_MS = Date.parse("2026-07-23T05:00:00+03:00"); // El Al LY395 TLV→MAD
const TRIP_END_MS = Date.parse("2026-08-11T04:25:00+03:00");  // land back in TLV

function countdownMessage(nowMs) {
  const DAY = 24 * 60 * 60 * 1000;
  if (nowMs > TRIP_END_MS) return null; // trip is over — stop notifying

  if (nowMs >= DEPARTURE_MS) {
    const dayNum = Math.floor((nowMs - DEPARTURE_MS) / DAY) + 1;
    return {
      title: "🌴 בוקר טוב מקוסטה ריקה!",
      body: `יום ${dayNum} בטיול — תיהנו! 🦜`,
    };
  }

  const days = Math.ceil((DEPARTURE_MS - nowMs) / DAY);
  if (days === 1) {
    return { title: "✈️ מחר טסים!", body: "עוד יום אחד לקוסטה ריקה — ארזתם הכל? 🎒" };
  }
  if (days === 7) {
    return { title: "🌴 שבוע לטיול!", body: "נשאר בדיוק שבוע לקוסטה ריקה! 🎉" };
  }
  if (days === 30) {
    return { title: "🌴 חודש לטיול!", body: "נשארו 30 ימים לקוסטה ריקה! 🦥" };
  }
  return {
    title: "🌴 בוקר טוב!",
    body: `נשארו ${days} ימים לטיול לקוסטה ריקה! ✈️`,
  };
}

exports.dailyCountdown = onSchedule(
  { schedule: "0 8 * * *", timeZone: "Asia/Jerusalem", region: "us-central1" },
  async () => {
    const msg = countdownMessage(Date.now());
    if (!msg) {
      console.log("Trip is over — no countdown sent.");
      return;
    }

    const snap = await db.collection("fcm-tokens").get();
    const entries = []; // { token, docId, memberId }
    const seen = new Set();
    snap.forEach((d) => {
      const tk = d.data().token;
      if (tk && !seen.has(tk)) {
        seen.add(tk);
        entries.push({ token: tk, docId: d.id, memberId: d.data().memberId || "?" });
      }
    });
    if (entries.length === 0) {
      console.log("No FCM tokens registered — nothing sent.");
      return;
    }

    const result = await admin.messaging().sendEachForMulticast({
      notification: { title: msg.title, body: msg.body },
      data: { url: "/" },
      webpush: {
        notification: { title: msg.title, body: msg.body, icon: "/images/icon-192.png", badge: "/images/icon-192.png" },
        fcmOptions: { link: "https://costaricapp-2026.web.app/" },
      },
      tokens: entries.map((e) => e.token),
    });

    // Log per-device outcome and prune dead tokens
    const dead = [];
    result.responses.forEach((r, i) => {
      const e = entries[i];
      if (r.success) {
        console.log(`  OK   member=${e.memberId}`);
      } else {
        const code = r.error && r.error.code;
        console.log(`  FAIL member=${e.memberId} code=${code}`);
        if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token" || code === "messaging/invalid-argument") {
          dead.push(e.docId);
        }
      }
    });
    for (const docId of dead) {
      await db.collection("fcm-tokens").doc(docId).delete().catch(() => {});
    }
    console.log(`Countdown: ${result.successCount} ok, ${result.failureCount} failed, ${dead.length} stale tokens removed. "${msg.body}"`);
  }
);
