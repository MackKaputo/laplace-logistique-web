import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-10 w-10 animate-spin text-[#2B015F]" />
        <p className="text-lg font-medium text-[#2B015F]">Chargement en cours...</p>
      </div>
    </div>
  )
}
