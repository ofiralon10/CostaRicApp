export interface Flight {
  id: string
  airline: string
  flightNumber: string
  from: string
  to: string
  departure: string
  arrival: string
  date: string
}

export interface Hotel {
  id: string
  name: string
  location: string
  region: string
  checkIn: string
  checkOut: string
  nights: number
  rooms: string
  breakfast: boolean
  cost: number
  coordinates: [number, number]
  image?: string
  bookingConfirmation?: string
}

export interface Activity {
  id: string
  name: string
  nameHe: string
  costPerPerson?: number
  costTotal?: number
  description?: string
  descriptionHe?: string
  mapsUrl?: string
}

export interface DayPlan {
  day: number
  date: string
  region: string
  regionHe: string
  location: string
  locationHe: string
  hotelId?: string
  checkIn?: boolean
  checkOut?: boolean
  activities: Activity[]
  drivingDistance?: string
  notes?: string
  notesHe?: string
}

export interface Destination {
  id: string
  name: string
  nameHe: string
  description: string
  descriptionHe: string
  funFacts: string[]
  funFactsHe: string[]
  highlights: string[]
  highlightsHe: string[]
  image: string
  coordinates: [number, number]
  days: number[]
}

export interface EmergencyContact {
  name: string
  nameHe: string
  phone: string
  type: 'emergency' | 'embassy' | 'hotel' | 'guide' | 'family'
}

export type Language = 'he' | 'en'
