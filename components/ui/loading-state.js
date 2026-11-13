export default function LoadingState({
  text = 'Memuat...',
  className = 'min-h-[60vh] flex items-center justify-center animate-fade-in',
  size = 'md',
}) {
  const sizes = {
    md: { outer: 'w-16 h-16', inner: 'w-9 h-9', icon: 'text-sm', gap: 'gap-3' },
    lg: { outer: 'w-20 h-20 sm:w-24 sm:h-24', inner: 'w-11 h-11 sm:w-12 sm:h-12', icon: 'text-lg sm:text-xl', gap: 'gap-4' },
  }
  const s = sizes[size] || sizes.md

  return (
    <div className={className}>
      <div className={`flex flex-col items-center ${s.gap}`}>
        <div className={`relative ${s.outer} rounded-full bg-white shadow-card border border-lavender-100 flex items-center justify-center`}>
          <div className="absolute inset-1.5 rounded-full border-4 border-lavender-100 border-t-lavender-500 animate-spin" aria-hidden="true" />
          <div className={`relative ${s.inner} rounded-full bg-gradient-to-br from-lavender-500 to-lavender-700 text-white flex items-center justify-center shadow-inner`}>
            <i className={`fa-solid fa-broom ${s.icon} animate-pulse`} />
          </div>
        </div>
        <p className="text-sm font-extrabold text-lavender-500 tracking-wide">{text}</p>
      </div>
    </div>
  )
}
