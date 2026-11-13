import LoadingState from '@/components/ui/loading-state'

export default function Loading() {
  return (
    <LoadingState size="lg" className="min-h-[50vh] w-full flex items-center justify-center p-6 animate-fade-in" />
  )
}
