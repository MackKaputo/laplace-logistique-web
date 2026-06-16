"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterControls } from "./filter-controls"
import { LabSamplesTable } from "./lab-samples-table"
import { AlertCircle } from "lucide-react"

interface HospitalDashboardProps {
  labSamples: any[]
  filteredSamples: any[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  date: Date | undefined
  setDate: (date: Date | undefined) => void
}

export function HospitalDashboard({
  labSamples,
  filteredSamples,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  date,
  setDate,
}: HospitalDashboardProps) {
  // Define status options for the filter
  const statusOptions = [
    { value: "tous", label: "Tous les statuts" },
    { value: "ramassé", label: "Ramassé" },
    { value: "en cours", label: "En cours" },
    { value: "livré", label: "Livré" },
    { value: "incident", label: "Incident" },
  ]

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total des échantillons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labSamples.length}</div>
            <p className="text-xs text-gray-500">+8% cette semaine</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">En transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labSamples.filter((s) => s.status === "en cours").length}</div>
            <p className="text-xs text-gray-500">3 échantillons urgents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Livrés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labSamples.filter((s) => s.status === "livré").length}</div>
            <p className="text-xs text-gray-500">98% dans les délais</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Suivi des échantillons</CardTitle>
          <CardDescription>Gérez le transport de vos échantillons de laboratoire</CardDescription>
        </CardHeader>
        <CardContent>
          <FilterControls
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            date={date}
            setDate={setDate}
            statusOptions={statusOptions}
            searchPlaceholder="Rechercher par ID, patient, type..."
          />

          <LabSamplesTable samples={filteredSamples} />

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-6">
            <h3 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Rappel sur la manipulation des échantillons
            </h3>
            <p className="text-sm text-yellow-700">
              Tous les échantillons doivent être transportés dans des conteneurs appropriés et conformes aux normes de
              sécurité. Vérifiez toujours la température requise et les conditions de transport spécifiques.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
