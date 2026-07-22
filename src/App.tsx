import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ItineraryPage from './pages/ItineraryPage'
import MapPage from './pages/MapPage'
import HotelsPage from './pages/HotelsPage'
import DestinationsPage from './pages/DestinationsPage'
import EmergencyPage from './pages/EmergencyPage'
import GamesPage from './pages/GamesPage'
import AchievementsPage from './pages/AchievementsPage'
import PackingPage from './pages/PackingPage'
import CurrencyPage from './pages/CurrencyPage'
import DocumentsPage from './pages/DocumentsPage'
import AwardsPage from './pages/AwardsPage'
import ChatPage from './pages/ChatPage'
import BudgetPage from './pages/BudgetPage'
import AlbumPage from './pages/AlbumPage'
import LoginPage from './pages/LoginPage'

function AppRoutes() {
  const { member, loading } = useAuth()

  if (loading) {
    return <div className="loading-screen"><div className="loading-spinner" /></div>
  }

  if (!member) {
    return <LoginPage />
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/itinerary" element={<ItineraryPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/hotels" element={<HotelsPage />} />
        <Route path="/destinations" element={<DestinationsPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/packing" element={<PackingPage />} />
        <Route path="/currency" element={<CurrencyPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/awards" element={<AwardsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/album" element={<AlbumPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AppRoutes />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
