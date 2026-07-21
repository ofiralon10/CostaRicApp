import type { Flight } from './types'

export const flights: Flight[] = [
  {
    id: 'f1',
    airline: 'El Al',
    flightNumber: 'LY395',
    from: 'Tel Aviv (TLV)',
    to: 'Madrid (MAD)',
    departure: '05:00',
    arrival: '09:20',
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
    airline: 'El Al',
    flightNumber: 'LY398',
    from: 'Madrid (MAD)',
    to: 'Tel Aviv (TLV)',
    departure: '22:50',
    arrival: '04:25+1',
    date: '2026-08-10',
  },
]
