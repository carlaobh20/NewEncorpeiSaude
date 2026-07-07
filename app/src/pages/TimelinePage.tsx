import ScreenHeader from '../components/ScreenHeader'
import { Card } from '../components/home/Sections'
import { iconMap } from '../components/home/ica'
import { tones, timeline } from '../lib/homeData'

export default function TimelinePage() {
  return (
    <div className="max-w-md md:max-w-2xl mx-auto px-4 pb-28">
      <ScreenHeader title="Timeline" />
      <p className="text-slate-500 text-sm mt-1 mb-4 px-1">Tudo que aconteceu hoje, em ordem.</p>
      <Card className="p-2">
        <div className="relative pl-3">
          {timeline.map((e, i) => {
            const Icon = iconMap[e.icon]; const t = tones[e.tone]
            return (
              <div key={e.id} className="flex gap-4 py-3">
                <div className="flex flex-col items-center">
                  <span className={`w-11 h-11 rounded-2xl ${t.bg} flex items-center justify-center z-10`}>
                    {Icon && <Icon className={`w-5 h-5 ${t.fg}`} />}
                  </span>
                  {i < timeline.length - 1 && <span className="w-px flex-1 bg-slate-200 my-1" />}
                </div>
                <div className="pt-1">
                  <div className="text-xs text-slate-400">{e.time}</div>
                  <div className="font-semibold text-slate-900">{e.label}</div>
                  <div className="text-sm text-slate-500">{e.detail}</div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
