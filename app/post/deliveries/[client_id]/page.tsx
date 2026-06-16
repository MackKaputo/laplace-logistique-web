"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  ArrowLeft,
  Building2,
  Package,
  TrendingUp,
  MapPin,
  DollarSign,
  Receipt,
  Calendar,
  FileText,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

type Payment = {
  id: string
  date: string
  amount: number
  invoice_number: string
  payment_method: string
  status: "paid" | "pending"
  deliveries_count: number
  period_start: string
  period_end: string
}

const dummyPayments: Payment[] = [
  {
    id: "1",
    date: "2024-12-20",
    amount: 285000,
    invoice_number: "INV-2024-001",
    payment_method: "Virement bancaire",
    status: "paid",
    deliveries_count: 75,
    period_start: "2024-12-01",
    period_end: "2024-12-15",
  },
  {
    id: "2",
    date: "2024-12-05",
    amount: 342000,
    invoice_number: "INV-2024-002",
    payment_method: "Mobile Money",
    status: "paid",
    deliveries_count: 90,
    period_start: "2024-11-15",
    period_end: "2024-11-30",
  },
  {
    id: "3",
    date: "2024-11-20",
    amount: 223000,
    invoice_number: "INV-2024-003",
    payment_method: "Espèces",
    status: "paid",
    deliveries_count: 56,
    period_start: "2024-11-01",
    period_end: "2024-11-14",
  },
]

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.client_id as string

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)

  const client = {
    user_id: clientId,
    organizationName: "Daredare Courier Service",
    phone_number: "+243844663965",
    balance: 850000,
  }

  const deliveryStats = {
    total: 245,
    delivered: 221,
    in_progress: 18,
    cancelled: 6,
  }

  const deliveryStatusData = [
    { name: "Livrées", value: 221, color: "#10b981" },
    { name: "En cours", value: 18, color: "#3b82f6" },
    { name: "Annulées", value: 6, color: "#ef4444" },
  ]

  const topZonesData = [
    { zone: "Zone A", deliveries: 85 },
    { zone: "Zone B", deliveries: 72 },
    { zone: "Zone C", deliveries: 48 },
    { zone: "Zone D", deliveries: 28 },
    { zone: "Zone E", deliveries: 12 },
  ]

  const handleViewInvoice = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowInvoiceDialog(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/post/deliveries")} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{client.organizationName}</h1>
          <p className="text-gray-600">Statistiques et historique des livraisons</p>
        </div>
      </div>

      {/* Client Info & Balance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#2B015F]" />
              <CardTitle>Informations du client</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Téléphone</p>
              <p className="font-medium text-gray-900">{client.phone_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ID Client</p>
              <p className="font-medium text-gray-900 text-xs break-all">{client.user_id}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#2B015F]/20 bg-gradient-to-br from-[#2B015F]/5 to-transparent">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#2B015F]" />
              <CardTitle>Solde du client</CardTitle>
            </div>
            <CardDescription>Montant dû à Daredare</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-[#2B015F]">{client.balance.toLocaleString("fr-CD")} CDF</p>
            <p className="text-sm text-gray-600 mt-2">Basé sur {deliveryStats.delivered} livraisons effectuées</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-[#2B015F]" />
            <CardTitle>Historique des paiements</CardTitle>
          </div>
          <CardDescription>Tous les paiements effectués à Daredare</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dummyPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => handleViewInvoice(payment)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-[#2B015F] rounded-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{payment.invoice_number}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(payment.date).toLocaleDateString("fr-FR")}</span>
                      <span className="mx-1">•</span>
                      <span>{payment.deliveries_count} livraisons</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{payment.payment_method}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#2B015F]">{payment.amount.toLocaleString("fr-CD")} CDF</p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      payment.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {payment.status === "paid" ? "Payé" : "En attente"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {dummyPayments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Aucun paiement enregistré</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{deliveryStats.total}</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Livrées</p>
                <p className="text-2xl font-bold text-green-900">{deliveryStats.delivered}</p>
                <p className="text-xs text-green-600 mt-1">
                  {((deliveryStats.delivered / deliveryStats.total) * 100).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">En cours</p>
                <p className="text-2xl font-bold text-blue-900">{deliveryStats.in_progress}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {((deliveryStats.in_progress / deliveryStats.total) * 100).toFixed(1)}%
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Annulées</p>
                <p className="text-2xl font-bold text-red-900">{deliveryStats.cancelled}</p>
                <p className="text-xs text-red-600 mt-1">
                  {((deliveryStats.cancelled / deliveryStats.total) * 100).toFixed(1)}%
                </p>
              </div>
              <Package className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des livraisons</CardTitle>
            <CardDescription>Distribution par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deliveryStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deliveryStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Zones */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#2B015F]" />
              <CardTitle>Zones les plus utilisées</CardTitle>
            </div>
            <CardDescription>Top 5 des zones avec le plus de livraisons</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topZonesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="zone" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="deliveries" fill="#2B015F" name="Livraisons" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Zone Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Détails par zone</CardTitle>
          <CardDescription>Nombre de livraisons par zone de livraison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topZonesData.map((zone, index) => (
              <div key={zone.zone} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-[#2B015F] text-white rounded-full text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{zone.zone}</p>
                    <p className="text-sm text-gray-600">
                      {((zone.deliveries / deliveryStats.total) * 100).toFixed(1)}% du total
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#2B015F]">{zone.deliveries}</p>
                  <p className="text-xs text-gray-600">livraisons</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Facture {selectedPayment?.invoice_number}</DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Date d'émission</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedPayment.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Statut</p>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedPayment.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {selectedPayment.status === "paid" ? "Payé" : "En attente"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-600">Période de facturation</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedPayment.period_start).toLocaleDateString("fr-FR")} -{" "}
                      {new Date(selectedPayment.period_end).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mode de paiement</p>
                    <p className="font-medium text-gray-900">{selectedPayment.payment_method}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Détails de facturation</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nombre de livraisons</span>
                    <span className="font-medium text-gray-900">{selectedPayment.deliveries_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tarif moyen par livraison</span>
                    <span className="font-medium text-gray-900">
                      {Math.round(selectedPayment.amount / selectedPayment.deliveries_count).toLocaleString("fr-CD")}{" "}
                      CDF
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Montant total</span>
                    <span className="text-2xl font-bold text-[#2B015F]">
                      {selectedPayment.amount.toLocaleString("fr-CD")} CDF
                    </span>
                  </div>
                </div>
              </div>

              {/* Client Info */}
              <div className="bg-[#2B015F]/5 rounded-lg p-4 border border-[#2B015F]/10">
                <h3 className="font-semibold text-gray-900 mb-2">Informations du client</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-900">{client.organizationName}</span>
                  </p>
                  <p className="text-gray-600">{client.phone_number}</p>
                  <p className="text-gray-600 text-xs break-all">{client.user_id}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
