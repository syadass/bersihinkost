'use client'

export function getInitials(name) {
  const parts = String(name || 'A').trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || 'A') + (parts[1]?.[0] || '')).toUpperCase()
}

export function AdminPageTitle({ title, subtitle, titleClassName = '', subtitleClassName = '' }) {
  return (
    <div className="shrink-0 min-w-0">
      <h1 className={`text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight ${titleClassName}`.trim()}>{title}</h1>
      {subtitle ? <p className={`text-xs sm:text-sm font-bold text-lavender-500 mt-1 ${subtitleClassName}`.trim()}>{subtitle}</p> : null}
    </div>
  )
}

export function AdminUserBadge({ name = 'Administrator', role = 'Solo Operator', className = '' }) {
  return (
    <div className={`hidden sm:flex items-center gap-3 bg-white pl-3 pr-5 py-2 rounded-full shadow-card border border-lavender-100 shrink-0 ${className}`.trim()}>
      <div className="w-10 h-10 rounded-full bg-peach-100 text-peach-600 flex items-center justify-center font-extrabold border-2 border-white shadow-sm">
        {getInitials(name)}
      </div>
      <div>
        <p className="text-sm font-extrabold text-gray-800 leading-tight">{name}</p>
        <p className="text-[10px] font-extrabold text-peach-500 uppercase tracking-wider">{role}</p>
      </div>
    </div>
  )
}
