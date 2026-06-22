import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import BottomNav from '@/components/BottomNav'
import QueueWall from '@/pages/QueueWall'
import RoomTimer from '@/pages/RoomTimer'
import ScanToStart from '@/pages/ScanToStart'
import ConfirmSelect from '@/pages/ConfirmSelect'
import ConfirmPage from '@/pages/ConfirmPage'
import DailyRecords from '@/pages/DailyRecords'
import SettingsPage from '@/pages/SettingsPage'
import { useEffect } from 'react'
import { useClinicStore } from '@/stores/useClinicStore'

function StatusRefresher() {
  const refreshRoomStatuses = useClinicStore((s) => s.refreshRoomStatuses)
  useEffect(() => {
    refreshRoomStatuses()
    const interval = setInterval(refreshRoomStatuses, 5000)
    return () => clearInterval(interval)
  }, [refreshRoomStatuses])
  return null
}

export default function App() {
  return (
    <Router>
      <StatusRefresher />
      <div className="min-h-screen bg-brand-bg pb-18">
        <Routes>
          <Route path="/" element={<QueueWall />} />
          <Route path="/rooms" element={<RoomTimer />} />
          <Route path="/scan" element={<ScanToStart />} />
          <Route path="/confirm-select" element={<ConfirmSelect />} />
          <Route path="/confirm/:roomId" element={<ConfirmPage />} />
          <Route path="/records" element={<DailyRecords />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
      <BottomNav />
    </Router>
  )
}
