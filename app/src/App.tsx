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
import Musculacao from './pages/Musculacao'
import TreinoExecucao from './pages/TreinoExecucao'
import NovoTreino from './pages/NovoTreino'
import Historico from './pages/musc/Historico'
import ExerciciosLib from './pages/musc/ExerciciosLib'
import Grupos from './pages/musc/Grupos'
import Avaliacoes from './pages/musc/Avaliacoes'
import Estatisticas from './pages/musc/Estatisticas'
import Fotos from './pages/musc/Fotos'

export default function App() {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()
  const hideBar = pathname.startsWith('/m/') || pathname === '/registrar' || pathname.startsWith('/musculacao')
  const shell = (c: React.ReactNode) => (
    <div className="min-h-screen" style={{ background: '#F6F8FC', fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter",system-ui,sans-serif' }}>{c}</div>
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
        <Route path="/musculacao" element={<Musculacao />} />
        <Route path="/musculacao/lista" element={<ExerciciosLib />} />
        <Route path="/musculacao/historico" element={<Historico />} />
        <Route path="/musculacao/exercicios" element={<ExerciciosLib />} />
        <Route path="/musculacao/grupos" element={<Grupos />} />
        <Route path="/musculacao/avaliacoes" element={<Avaliacoes />} />
        <Route path="/musculacao/fotos" element={<Fotos />} />
        <Route path="/musculacao/estatisticas" element={<Estatisticas />} />
        <Route path="/musculacao/novo" element={<NovoTreino />} />
        <Route path="/musculacao/treino/:key" element={<TreinoExecucao />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideBar && <BottomBar />}
    </>
  )
}
