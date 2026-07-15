export default function StatCard({ label, value, icon: Icon, accent = 'teal', trend }) {
  const accentStyles = {
    teal: 'from-teal-500 to-teal-600 text-teal-600 bg-teal-50',
    navy: 'from-navy-700 to-navy-900 text-navy-700 bg-navy-50',
    amber: 'from-amber-500 to-amber-600 text-amber-600 bg-amber-50',
    violet: 'from-violet-500 to-violet-600 text-violet-600 bg-violet-50',
    rose: 'from-rose-500 to-rose-600 text-rose-600 bg-rose-50',
    cyan: 'from-cyan-500 to-cyan-600 text-cyan-600 bg-cyan-50',
  }
  const gradient = accentStyles[accent]?.split(' ').slice(0, 2).join(' ') || accentStyles.teal
  const iconWrapClasses = accentStyles[accent]?.split(' ').slice(2).join(' ') || accentStyles.teal

  return (
    <div className="card group relative overflow-hidden p-5 hover:-translate-y-1 hover:shadow-card-hover">
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 transition-transform duration-500 group-hover:scale-125`}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-navy-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-navy-900">{value}</p>
          {trend && (
            <p className="mt-1.5 text-xs font-medium text-teal-600">{trend}</p>
          )}
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconWrapClasses}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}
