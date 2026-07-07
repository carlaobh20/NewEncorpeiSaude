import ScreenHeader from '../components/ScreenHeader'
import { Card } from '../components/home/Sections'

const cards = [
  { t: 'Composição corporal', v: '+3 kg massa magra · −11 kg gordura', d: 'Últimos 90 dias', tone: 'text-emerald-600' },
  { t: 'Sequência', v: '7 dias consecutivos registrando', d: 'Continue pra manter o multiplicador', tone: 'text-emerald-600' },
  { t: 'Exames', v: 'Vitamina D caiu · Ferritina melhorou', d: 'Comparado ao exame de abril', tone: 'text-amber-600' },
  { t: 'Recuperação', v: '71% hoje', d: 'Sono abaixo do ideal puxou pra baixo', tone: 'text-violet-600' },
]

export default function Insights() {
  return (
    <div className="max-w-md md:max-w-2xl mx-auto px-4 pb-28">
      <ScreenHeader title="Insights" />
      <p className="text-slate-500 text-sm mt-1 mb-4 px-1">O que a IA percebeu na sua evolução.</p>
      <div className="space-y-3">
        {cards.map((c) => (
          <Card key={c.t} className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">{c.t}</div>
            <div className={`text-lg font-semibold mt-1 ${c.tone}`}>{c.v}</div>
            <div className="text-sm text-slate-500 mt-0.5">{c.d}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
