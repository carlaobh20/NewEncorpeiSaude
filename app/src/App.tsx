import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { supabaseReady } from './lib/supabase'
import BottomBar from './components/home/BottomBar'
import Home from './pages/Home'
import ModuleScreen from './pages/ModuleScreen'
import Registrar from './pages/Registrar'
import TimelinePage from './pages/TimelinePage'
import Coach from './pages/Coach'
import Perfil from './pages/Perfil'
import Insights from './pages/Insights'
import PlanoCompleto from './pages/PlanoCompleto'
import Login from './pages/Login'

export default function App() {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()
  const hideBar = pathname.startsWith('/m/') || pathname === '/registrar'
  const shell = (c: React.ReactNode) => (
    <div className="min-h-screen" style={{ background: '#F7F8FC', fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter",system-ui,sans-serif' }}>{c}</div>
  )

  if (supabaseReady && loading) return shell(
    <div className="min-h-screen flex items-center justify-center">
      <span style={{ fontFamily: 'Georgia,serif' }} className="text-emerald-500 text-5xl lowercase animate-pulse">e</span>
    </div>
  )

  if (supabaseReady && !user) return shell(<Login />)

  return shell(
    <>
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
    </>
  )
}
