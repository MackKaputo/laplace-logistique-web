"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, TrendingUp, DollarSign, Package, Edit2, Check, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { AccessControl } from "@/components/backoffice/access-control" // Import AccessControl
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"

interface DailyStats {
  _id: {
    year: number
    month: number
    day: number
  }
  total_deliveries: number
  total_fees: number
}

interface ApiResponse {
  success: boolean
  message: string
  data: DailyStats[]
}

const deliveryStatuses = [
  { value: "delivered", label: "Livrées" },
  { value: "unassigned", label: "Non assignées" },
  { value: "assigned", label: "Assignées" },
  { value: "picked_up", label: "Ramassées" },
  { value: "cancelled", label: "Annulées" },
]

const months = [
  { value: "all", label: "Tous" },
  { value: "1", label: "Janvier" },
  { value: "2", label: "Février" },
  { value: "3", label: "Mars" },
  { value: "4", label: "Avril" },
  { value: "5", label: "Mai" },
  { value: "6", label: "Juin" },
  { value: "7", label: "Juillet" },
  { value: "8", label: "Août" },
  { value: "9", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
]

const currentYear = new Date().getFullYear()
const years = [
  { value: "all", label: "Tous" },
  ...Array.from({ length: 3 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  })),
]

export default function FinancePage() {
  const [stats, setStats] = useState<DailyStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState("delivered")
  const [selectedMonth, setSelectedMonth] = useState("all")
  const [selectedYear, setSelectedYear] = useState("all")

  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [isEditingRate, setIsEditingRate] = useState(false)
  const [editedRate, setEditedRate] = useState("")
  const [isUpdatingRate, setIsUpdatingRate] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchFinanceData()
    fetchExchangeRate()
  }, [selectedStatus])

  const fetchFinanceData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/admin-statistics/monthly-per-day?status=${selectedStatus}`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch finance data")
      }

      const result: ApiResponse = await response.json()
      setStats(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/settings`)

      if (!response.ok) {
        throw new Error("Failed to fetch exchange rate")
      }

      const result = await response.json()
      if (result.success && result.data?.change_rate_usd_cdf) {
        setExchangeRate(result.data.change_rate_usd_cdf)
      }
    } catch (err) {
      console.error("Error fetching exchange rate:", err)
    }
  }

  const handleUpdateExchangeRate = async () => {
    const newRate = Number.parseFloat(editedRate)

    if (isNaN(newRate) || newRate <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un taux valide",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUpdatingRate(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/admin-update-change-rate`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            change_rate_usd_cdf: newRate,
          }),
        },
      )

      if (!response.ok) {
        throw new Error("Failed to update exchange rate")
      }

      const result = await response.json()

      if (result.success) {
        setExchangeRate(newRate)
        setIsEditingRate(false)
        toast({
          title: "Succès",
          description: "Taux de change mis à jour avec succès",
        })
      } else {
        throw new Error("Update failed")
      }
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le taux de change",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingRate(false)
    }
  }

  const handleStartEdit = () => {
    setEditedRate(exchangeRate?.toString() || "")
    setIsEditingRate(true)
  }

  const handleCancelEdit = () => {
    setIsEditingRate(false)
    setEditedRate("")
  }

  const filteredStats = useMemo(() => {
    return stats.filter((stat) => {
      const matchesMonth = selectedMonth === "all" || stat._id.month === Number.parseInt(selectedMonth)
      const matchesYear = selectedYear === "all" || stat._id.year === Number.parseInt(selectedYear)
      return matchesMonth && matchesYear
    })
  }, [stats, selectedMonth, selectedYear])

  const totalDeliveries = filteredStats.reduce((sum, stat) => sum + stat.total_deliveries, 0)
  const totalFees = filteredStats.reduce((sum, stat) => sum + stat.total_fees, 0)
  const averageFeePerDelivery = totalDeliveries > 0 ? totalFees / totalDeliveries : 0

  const chartData = filteredStats.map((stat) => ({
    date: `${stat._id.day}/${stat._id.month}/${stat._id.year}`,
    deliveries: stat.total_deliveries,
    fees: stat.total_fees,
    avgFee: stat.total_deliveries > 0 ? stat.total_fees / stat.total_deliveries : 0,
  }))

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B015F]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erreur</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchFinanceData}>Réessayer</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AccessControl requiredRole="management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#2B015F]">Finance</h1>
          <div className="flex items-center gap-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sélectionner le statut" />
              </SelectTrigger>
              <SelectContent>
                {deliveryStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={fetchFinanceData} variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        <Card className="border-[#2B015F]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Taux de Change USD → CDF</span>
              {!isEditingRate && (
                <Button onClick={handleStartEdit} variant="outline" size="sm">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
            </CardTitle>
            <CardDescription>Taux de conversion actuel pour les calculs de prix</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditingRate ? (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={editedRate}
                    onChange={(e) => setEditedRate(e.target.value)}
                    placeholder="Entrez le nouveau taux"
                    className="text-lg"
                    min="0"
                    step="0.01"
                  />
                </div>
                <Button onClick={handleUpdateExchangeRate} disabled={isUpdatingRate} size="sm">
                  <Check className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" size="sm" disabled={isUpdatingRate}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-4xl font-bold text-[#2B015F]">
                  {exchangeRate !== null ? exchangeRate.toLocaleString() : "..."}
                </span>
                <span className="text-xl text-muted-foreground">CDF</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Livraisons</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDeliveries}</div>
              <p className="text-xs text-muted-foreground">
                {deliveryStatuses.find((s) => s.value === selectedStatus)?.label}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Frais</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFees.toFixed(2)} $</div>
              <p className="text-xs text-muted-foreground">Revenus totaux</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Frais Moyen</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageFeePerDelivery.toFixed(2)} $</div>
              <p className="text-xs text-muted-foreground">Par livraison</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Frais par Jour</CardTitle>
              <CardDescription>Évolution des frais de livraison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="fees" stroke="#2B015F" name="Frais ($)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Livraisons par Jour</CardTitle>
              <CardDescription>Nombre de livraisons</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="deliveries" fill="#2B015F" name="Livraisons" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>Détails par Jour</CardTitle>
            <CardDescription>Statistiques détaillées des livraisons et frais</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Livraisons</TableHead>
                  <TableHead className="text-right">Frais Totaux</TableHead>
                  <TableHead className="text-right">Frais Moyen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStats.map((stat, index) => {
                  const avgFee = stat.total_deliveries > 0 ? stat.total_fees / stat.total_deliveries : 0
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        {stat._id.day}/{stat._id.month}/{stat._id.year}
                      </TableCell>
                      <TableCell className="text-right">{stat.total_deliveries}</TableCell>
                      <TableCell className="text-right">{stat.total_fees.toFixed(2)} $</TableCell>
                      <TableCell className="text-right">{avgFee.toFixed(2)} $</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AccessControl>
  )
}
