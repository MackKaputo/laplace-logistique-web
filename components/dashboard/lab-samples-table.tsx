"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Microscope, CheckCircle2, Loader2, Clock, AlertCircle } from "lucide-react"
import { format } from "date-fns"

interface LabSamplesTableProps {
  samples: any[]
}

export function LabSamplesTable({ samples }: LabSamplesTableProps) {
  // Fonction pour obtenir la couleur du badge selon le statut
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "livré":
        return "bg-green-500 hover:bg-green-600"
      case "en cours":
        return "bg-blue-500 hover:bg-blue-600"
      case "ramassé":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "incident":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  // Fonction pour obtenir la couleur du badge selon la priorité
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "normal":
        return "bg-green-500 hover:bg-green-600"
      case "urgent":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "critique":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  // Fonction pour obtenir l'icône selon le statut
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "livré":
        return <CheckCircle2 className="h-4 w-4 mr-1" />
      case "en cours":
        return <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      case "ramassé":
        return <Clock className="h-4 w-4 mr-1" />
      case "incident":
        return <AlertCircle className="h-4 w-4 mr-1" />
      default:
        return null
    }
  }

  return (
    <Tabs defaultValue="liste" className="mb-6">
      <TabsList>
        <TabsTrigger value="liste">Liste</TabsTrigger>
        <TabsTrigger value="urgents">Échantillons urgents</TabsTrigger>
      </TabsList>
      <TabsContent value="liste">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Patient ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Origine</TableHead>
                <TableHead className="hidden md:table-cell">Destination</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Temp.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {samples.length > 0 ? (
                samples.map((sample) => (
                  <TableRow key={sample.id}>
                    <TableCell className="font-medium">{sample.id}</TableCell>
                    <TableCell>{format(new Date(sample.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{sample.patientId}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Microscope className="h-4 w-4 mr-1 text-[#2B015F]" />
                        {sample.sampleType}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{sample.origin}</TableCell>
                    <TableCell className="hidden md:table-cell">{sample.destination}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityBadgeColor(sample.priority)}>{sample.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(sample.status)}>
                        <span className="flex items-center">
                          {getStatusIcon(sample.status)}
                          {sample.status}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>{sample.temperature}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-4">
                    Aucun échantillon trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
      <TabsContent value="urgents">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Patient ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Origine</TableHead>
                <TableHead className="hidden md:table-cell">Destination</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Temp.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {samples
                .filter((sample) => sample.priority === "urgent" || sample.priority === "critique")
                .map((sample) => (
                  <TableRow key={sample.id}>
                    <TableCell className="font-medium">{sample.id}</TableCell>
                    <TableCell>{format(new Date(sample.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{sample.patientId}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Microscope className="h-4 w-4 mr-1 text-[#2B015F]" />
                        {sample.sampleType}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{sample.origin}</TableCell>
                    <TableCell className="hidden md:table-cell">{sample.destination}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityBadgeColor(sample.priority)}>{sample.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(sample.status)}>
                        <span className="flex items-center">
                          {getStatusIcon(sample.status)}
                          {sample.status}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>{sample.temperature}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  )
}
