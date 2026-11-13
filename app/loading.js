export default function Loading() {
  return (
    <div className="min-h-[50vh] w-full flex items-center justify-center p-6 animate-fade-in">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-20 h-20 rounded-full bg-white shadow-float border border-lavender-100 flex items-center justify-center">
          <div className="absolute inset-1.5 rounded-full border-4 border-lavender-100 border-t-lavender-500 animate-spin" aria-hidden="true" />
          <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-lavender-500 to-lavender-700 text-white flex items-center justify-center shadow-inner">
            <i className="fa-solid fa-broom text-lg animate-pulse" />
          </div>
        </div>
        <p className="text-sm font-extrabold text-lavender-500 tracking-wide">Memuat...</p>
      </div>
    </div>
  )
}
