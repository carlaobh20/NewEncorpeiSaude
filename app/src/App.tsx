import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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
import Landing from './pages/Landing'
import Musculacao from './pages/Musculacao'
import TreinoExecucao from './pages/TreinoExecucao'
import NovoTreino from './pages/NovoTreino'
import Historico from './pages/musc/Historico'
import ExerciciosLib from './pages/musc/ExerciciosLib'
import Grupos from './pages/musc/Grupos'
import Avaliacoes from './pages/musc/Avaliacoes'
import Estatisticas from './pages/musc/Estatisticas'
import Fotos from './pages/musc/Fotos'
import Academia from './pages/musc/Academia'
import Progressao from './pages/musc/Progressao'
import Alimentacao from './pages/Alimentacao'
import Peso from './pages/Peso'
import Jejum from './pages/Jejum'
import Suplementos from './pages/Suplementos'
import Agenda from './pages/Agenda'
import Corpo from './pages/Corpo'
import Agua from './pages/Agua'
import Sono from './pages/Sono'
import Exames from './pages/Exames'
import Painel from './pages/Painel'
import Consultas from './pages/Consultas'
import Pro from './pages/Pro'

export default function App() {
  const { user, loading } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
    const shell = (c: React.ReactNode) => (
    <div className="min-h-screen" style={{ background: '#F6F8FC', fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter",system-ui,sans-serif' }}>{c}</div>
  )

  if (supabaseReady && loading) return shell(
    <div className="min-h-screen flex items-center justify-center">
      <span style={{ fontFamily: 'Georgia,serif' }} className="text-emerald-500 text-5xl lowercase animate-pulse">e</span>
    </div>
  )

  if (supabaseReady && !user) return shell(showLogin ? <Login /> : <Landing onStart={() => setShowLogin(true)} />)

  return shell(
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/corpo/nutricao" element={<Alimentacao />} />
        <Route path="/corpo/agua" element={<Agua />} />
        <Route path="/m/alimentacao" element={<Navigate to="/corpo/nutricao" replace />} />
        <Route path="/m/agua" element={<Navigate to="/corpo/agua" replace />} />
        <Route path="/m/peso" element={<Peso />} />
        <Route path="/corpo" element={<Corpo />} />
        <Route path="/exames" element={<Exames />} />
        <Route path="/painel" element={<Painel />} />
        <Route path="/consultas" element={<Consultas />} />
        <Route path="/pro" element={<Pro />} />
        <Route path="/corpo/jejum" element={<Jejum />} />
        <Route path="/jejum" element={<Navigate to="/corpo/jejum" replace />} />
        <Route path="/corpo/sono" element={<Sono />} />
        <Route path="/corpo/suplementos" element={<Suplementos />} />
        <Route path="/suplementos" element={<Navigate to="/corpo/suplementos" replace />} />
        <Route path="/m/sono" element={<Navigate to="/corpo/sono" replace />} />
        <Route path="/agenda" element={<Agenda />} />
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
        <Route path="/musculacao/academia" element={<Academia />} />
        <Route path="/musculacao/progressao" element={<Progressao />} />
        <Route path="/musculacao/novo" element={<NovoTreino />} />
        <Route path="/musculacao/treino/:key" element={<TreinoExecucao />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomBar />
    </>
  )
}
