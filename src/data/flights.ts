import type { Flight } from './types'

export const flights: Flight[] = [
  {
    id: 'f1',
    airline: 'Iberia',
    flightNumber: 'IB1874',
    from: 'Tel Aviv (TLV)',
    to: 'Madrid (MAD)',
    departure: '05:30',
    arrival: '09:55',
    date: '2026-07-23',
  },
  {
    id: 'f2',
    airline: 'Iberia',
    flightNumber: 'IB243',
    from: 'Madrid (MAD)',
    to: 'San José (SJO)',
    departure: '11:30',
    arrival: '14:35',
    date: '2026-07-23',
  },
  {
    id: 'f3',
    airline: 'Iberia',
    flightNumber: 'IB244',
    from: 'San José (SJO)',
    to: 'Madrid (MAD)',
    departure: '16:10',
    arrival: '10:50+1',
    date: '2026-08-06',
  },
  {
    id: 'f4',
    airline: 'Iberia',
    flightNumber: 'IB1873',
    from: 'Madrid (MAD)',
    to: 'Tel Aviv (TLV)',
    departure: '17:00',
    arrival: '22:50',
    date: '2026-08-10',
  },
]
