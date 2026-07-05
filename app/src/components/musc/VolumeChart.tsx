export default function VolumeChart({ data }: { data: { d: string; kg: number }[] }) {
  const max = Math.max(...data.map((x) => x.kg), 1)
  return (
    <div className="flex items-end justify-between gap-1.5">
      {data.map((x, i) => {
        const h = x.kg > 0 ? Math.max(8, (x.kg / max) * 100) : 4
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex items-end" style={{ height: 84 }}>
              <div className="w-full rounded-md transition-all duration-500"
                style={{ height: `${h}%`, background: x.kg > 0 ? 'linear-gradient(180deg,#34d399,#10B981)' : '#EEF1F5' }} />
            </div>
            <span className="text-[10px] text-slate-400">{x.d}</span>
          </div>
        )
      })}
    </div>
  )
}
