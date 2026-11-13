export default function Loading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-xl space-y-3">
        <div className="h-6 w-40 rounded-xl skeleton" />
        <div className="h-4 w-64 max-w-full rounded-lg skeleton" />
        <div className="h-28 rounded-3xl skeleton mt-4" />
      </div>
    </div>
  )
}
