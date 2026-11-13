export default function Loading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 animate-fade-in">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white shadow-float border border-lavender-100 flex items-center justify-center">
          <div className="absolute inset-1.5 rounded-full border-4 border-lavender-100 border-t-lavender-500 animate-spin" aria-hidden="true" />
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-lavender-500 to-lavender-700 text-white flex items-center justify-center shadow-inner">
            <i className="fa-solid fa-broom text-lg sm:text-xl animate-pulse" />
          </div>
        </div>
        <p className="text-sm font-extrabold text-lavender-500 tracking-wide">Memuat...</p>
      </div>
    </div>
  )
}
