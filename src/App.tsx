import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ItineraryPage from './pages/ItineraryPage'
import MapPage from './pages/MapPage'
import HotelsPage from './pages/HotelsPage'
import DestinationsPage from './pages/DestinationsPage'
import EmergencyPage from './pages/EmergencyPage'

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/itinerary" element={<ItineraryPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/hotels" element={<HotelsPage />} />
            <Route path="/destinations" element={<DestinationsPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
          </Route>
        </Routes>
      </LanguageProvider>
    </BrowserRouter>
  )
}
