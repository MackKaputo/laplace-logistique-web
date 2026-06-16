"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package } from "lucide-react"
import { DialogFooter } from "@/components/ui/dialog"

interface TrackingFormProps {
  onCancel: () => void
}

export function TrackingForm({ onCancel }: TrackingFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="tracking">Numéro de suivi</Label>
        <div className="relative">
          <Package className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input id="tracking" placeholder="Entrez votre numéro de suivi" className="pl-10" />
        </div>
      </div>
      <DialogFooter className="flex justify-between mt-6">
        <Button variant="outline" type="button" onClick={onCancel}>
          Annuler
        </Button>
        <Button className="bg-[#2B015F] hover:bg-[#2B015F]/90">Suivre ma livraison</Button>
      </DialogFooter>
    </div>
  )
}
