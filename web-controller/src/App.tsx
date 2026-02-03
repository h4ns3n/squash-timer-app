import { Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { ControllerPage } from './pages/ControllerPage'
import { TVManagementPage } from './pages/TVManagementPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/controller" element={<ControllerPage />} />
      <Route path="/tv-management" element={<TVManagementPage />} />
    </Routes>
  )
}

export default App
