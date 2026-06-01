interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  sub?: string;
  color: "blue" | "emerald" | "amber" | "purple";
  icon: string;
}

const colorMap = {
  blue: "from-blue-600 to-blue-500",
  emerald: "from-emerald-600 to-emerald-500",
  amber: "from-amber-600 to-amber-500",
  purple: "from-purple-600 to-purple-500",
};

export default function KPICard({ title, value, unit, sub, color, icon }: KPICardProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-500 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm mb-1">{title}</p>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold text-white">{value}</span>
            {unit && <span className="text-slate-400 text-sm mb-1">{unit}</span>}
          </div>
          {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-2xl`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
