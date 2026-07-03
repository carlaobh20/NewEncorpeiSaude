import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import BottomBar from './components/home/BottomBar'
import Home from './pages/Home'
import ModuleScreen from './pages/ModuleScreen'
import Registrar from './pages/Registrar'
import TimelinePage from './pages/TimelinePage'
import Coach from './pages/Coach'
import Perfil from './pages/Perfil'
import Insights from './pages/Insights'
import PlanoCompleto from './pages/PlanoCompleto'

export default function App() {
  const { pathname } = useLocation()
  const hideBar = pathname.startsWith('/m/') || pathname === '/registrar'
  return (
    <div className="min-h-screen" style={{ background: '#F7F8FC', fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter",system-ui,sans-serif' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/m/:slug" element={<ModuleScreen />} />
        <Route path="/registrar" element={<Registrar />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/coach" element={<Coach />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/plano" element={<PlanoCompleto />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideBar && <BottomBar />}
    </div>
  )
}
