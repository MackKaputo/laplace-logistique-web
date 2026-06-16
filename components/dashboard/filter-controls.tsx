"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Search } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface FilterControlsProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  statusOptions?: { value: string; label: string }[]
  searchPlaceholder?: string
}

export function FilterControls({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  date,
  setDate,
  statusOptions = [{ value: "tous", label: "Tous les statuts" }], // Default value
  searchPlaceholder = "Rechercher par code, adresse...",
}: FilterControlsProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-40">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-40">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "dd MMMM yyyy", { locale: fr }) : "Sélectionner une date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        {(date || statusFilter !== "tous" || searchQuery) && (
          <Button
            variant="ghost"
            onClick={() => {
              setDate(undefined)
              setStatusFilter("tous")
              setSearchQuery("")
            }}
          >
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  )
}
