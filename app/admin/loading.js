export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-3xl space-y-4">
        <div className="h-8 w-48 rounded-2xl skeleton" />
        <div className="h-4 w-72 max-w-full rounded-xl skeleton" />
        <div className="mt-6 grid gap-3">
          <div className="h-24 rounded-3xl skeleton" />
          <div className="h-24 rounded-3xl skeleton" />
          <div className="h-24 rounded-3xl skeleton" />
        </div>
      </div>
    </div>
  )
}
