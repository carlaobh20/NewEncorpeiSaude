import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface MiniSparklineProps {
  data: Array<{ value: number }>;
  color?: string;
}

export function MiniSparkline({ data, color = "#2EE6C6" }: MiniSparklineProps) {
  if (data.length === 0) {
    return <div className="h-12 w-full rounded-md bg-slate-800/30" />;
  }
  const gid = `sparkGrad-${color.replace("#", "")}`;
  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.55} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gid})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
