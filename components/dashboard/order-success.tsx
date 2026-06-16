"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

interface OrderSuccessProps {
  onClose: () => void
  onAddAnother: () => void
}

export function OrderSuccess({ onClose, onAddAnother }: OrderSuccessProps) {
  return (
    <div className="py-8 text-center">
      <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h3 className="text-xl font-bold mb-2">Commande créée avec succès!</h3>
      <p className="text-gray-600 mb-6">Votre commande a été enregistrée et sera traitée rapidement.</p>
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={onClose}>
          Retour au tableau de bord
        </Button>
        <Button className="bg-[#FBC140] text-black hover:bg-[#FBC140]/90" onClick={onAddAnother}>
          Ajouter une autre commande
        </Button>
      </div>
    </div>
  )
}
