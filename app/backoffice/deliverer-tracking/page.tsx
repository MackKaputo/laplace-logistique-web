"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  MapPin,
  Phone,
  Users,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  Pencil,
  Save,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Deliverer {
  _id: string
  deliverer_id: string
  name: string
  last_name: string
  phone_number: string
  delivery_zone?: {
    id: string
    name: string
  }
  is_activated: boolean
}

interface DailyReport {
  deliverer_daily_report_id: string
  deliverer_id: string
  approved_by: string
  missing_amount: Array<{
    currency: string
    value: number
  }>
  remarks: string
  daily_report: PaymentReport
  created_at: {
    $date: string
  }
}

interface PaymentReport {
  payments: Array<{
    currency: string
    total_package_value: number
    total_delivery_fees: number
  }>
  payment_reports: Array<{
    payment_report_id: string
    delivery_id: string
    expected_delivery_fee?: {
      currency: string
      value: number
    }
    received_delivery_fee: {
      currency: string
      value: number
    }
    received_package_value: Array<{
      currency: string
      value: number
    }>
    declared_package_value: Record<string, number>
    notes: string
  }>
  deliveries: Array<{
    delivery_id: string
    status: string
    created_at: string
    customer: {
      name: string
      phone_number: string
    }
    recipient: {
      name: string
      phone_number: string
    }
    deliverer: {
      deliverer_id: string
      name: string
    }
    pickup_address: string
    delivery_address: string
    package_code: string
  }>
}

export default function DelivererTrackingPage() {
  const [deliverers, setDeliverers] = useState<Deliverer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDeliverer, setSelectedDeliverer] = useState<Deliverer | null>(null)
  const [paymentReport, setPaymentReport] = useState<PaymentReport | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set())
  const [historicalReports, setHistoricalReports] = useState<DailyReport[]>([])
  const [loadingHistorical, setLoadingHistorical] = useState(false)
  const [expandedHistorical, setExpandedHistorical] = useState<Set<string>>(new Set())
  const [isApproving, setIsApproving] = useState(false)
  const [showAmendDialog, setShowAmendDialog] = useState(false)
  const [missingAmountCDF, setMissingAmountCDF] = useState("")
  const [missingAmountUSD, setMissingAmountUSD] = useState("")
  const [amendmentNote, setAmendmentNote] = useState("")
  const [isSubmittingAmendment, setIsSubmittingAmendment] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [editingReportId, setEditingReportId] = useState<string | null>(null)
  const [editedDeliveryFee, setEditedDeliveryFee] = useState<{ currency: string; value: number } | null>(null)
  const [editedPackageValues, setEditedPackageValues] = useState<Array<{ currency: string; value: number }>>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchDeliverers()
  }, [])

  const fetchDeliverers = async () => {
    setLoading(true)
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/auth/deliverers`
      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des livreurs: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        const activeDeliverers = result.data.filter((deliverer: Deliverer) => deliverer.is_activated)
        setDeliverers(activeDeliverers)
      } else {
        throw new Error(result.message || "Erreur lors de la récupération des livreurs")
      }
    } catch (error) {
      console.error("Error fetching deliverers:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des livreurs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentReport = async (delivererId: string) => {
    setLoadingReport(true)
    setPaymentReport(null)
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/payment-report?deliverer_id=${delivererId}`
      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération du rapport: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data && result.data.length > 0) {
        setPaymentReport(result.data[0])
      } else {
        toast({
          title: "Aucune donnée",
          description: "Aucun rapport de paiement disponible pour ce livreur",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error fetching payment report:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger le rapport de paiement",
        variant: "destructive",
      })
    } finally {
      setLoadingReport(false)
    }
  }

  const fetchHistoricalReports = async (delivererId: string) => {
    setLoadingHistorical(true)
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/payment-report/deliverer-daily-reports?deliverer_id=${delivererId}`
      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération de l'historique: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        setHistoricalReports(result.data)
      } else {
        setHistoricalReports([])
      }
    } catch (error) {
      console.error("Error fetching historical reports:", error)
      setHistoricalReports([])
    } finally {
      setLoadingHistorical(false)
    }
  }

  const handleDelivererClick = (deliverer: Deliverer) => {
    setSelectedDeliverer(deliverer)
    fetchPaymentReport(deliverer.deliverer_id)
    fetchHistoricalReports(deliverer.deliverer_id)
  }

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount?.toLocaleString() || "0"} ${currency}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getInitials = (name: string, lastName: string) => {
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const calculateTotalByCurrency = () => {
    if (!paymentReport) return []

    return paymentReport?.payments?.map((payment) => ({
      currency: payment.currency,
      total: payment.total_package_value + payment.total_delivery_fees,
    }))
  }

  const startEditingReport = (report: PaymentReport["payment_reports"][0]) => {
    setEditingReportId(report.payment_report_id)
    setEditedDeliveryFee({ ...report.received_delivery_fee })
    setEditedPackageValues(report.received_package_value.map((v) => ({ ...v })))
  }

  const cancelEditingReport = () => {
    setEditingReportId(null)
    setEditedDeliveryFee(null)
    setEditedPackageValues([])
  }

  const [savingReport, setSavingReport] = useState(false)

  const handleSaveReport = async (report: PaymentReport["payment_reports"][0]) => {
    if (!editedDeliveryFee || !selectedDeliverer) return

    const backofficeRole = sessionStorage.getItem("backoffice_role") || "operations"

    const dto = {
      payment_report_id: report.payment_report_id,
      delivery_id: report.delivery_id,
      backoffice_role: backofficeRole,
      received_delivery_fee: {
        currency: editedDeliveryFee.currency,
        value: editedDeliveryFee.value,
      },
      received_package_value: editedPackageValues.map((v) => ({
        currency: v.currency,
        value: v.value,
      })),
    }

    setSavingReport(true)
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/payment-report`
      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Rapport mis à jour",
          description: "Les modifications ont été sauvegardées avec succès.",
          duration: 5000,
        })
        cancelEditingReport()
        fetchPaymentReport(selectedDeliverer.deliverer_id)
        fetchHistoricalReports(selectedDeliverer.deliverer_id)
      } else {
        throw new Error(result.message || "Erreur lors de la sauvegarde")
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setSavingReport(false)
    }
  }

  const toggleReportExpansion = (reportId: string) => {
    setExpandedReports((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(reportId)) {
        newSet.delete(reportId)
      } else {
        newSet.add(reportId)
      }
      return newSet
    })
  }

  const toggleHistoricalExpansion = (reportId: string) => {
    setExpandedHistorical((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(reportId)) {
        newSet.delete(reportId)
      } else {
        newSet.add(reportId)
      }
      return newSet
    })
  }

  const calculateDailyReportTotal = (
    payments: Array<{ currency: string; total_package_value: number; total_delivery_fees: number }>,
  ) => {
    return payments?.length > 0 ? payments.map((payment) => ({
      currency: payment.currency,
      total: payment.total_package_value + payment.total_delivery_fees,
    })) : []
  }

  const handleApproveReport = async () => {
    if (!selectedDeliverer) return

    setIsApproving(true)
    try {
      const approvedBy = sessionStorage.getItem("backoffice_role") || "operations"
      const apiUrl = `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/payment-report/approve`

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliverer_id: selectedDeliverer.deliverer_id,
          approved_by: approvedBy,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erreur lors de l'approbation: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "✅ Rapport approuvé",
          description: "Le rapport de paiement a été approuvé avec succès. Les données ont été mises à jour.",
          duration: 5000,
        })
        fetchPaymentReport(selectedDeliverer.deliverer_id)
        fetchHistoricalReports(selectedDeliverer.deliverer_id)
      } else {
        throw new Error(result.message || "Erreur lors de l'approbation")
      }
    } catch (error) {
      console.error("Error approving report:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'approuver le rapport de paiement",
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
    }
  }

  const handleAmendReport = async () => {
    if (!selectedDeliverer) return

    setIsSubmittingAmendment(true)
    try {
      const approvedBy = sessionStorage.getItem("backoffice_role") || "operations"
      const apiUrl = `${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/deliveries/payment-report/approve`

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliverer_id: selectedDeliverer.deliverer_id,
          approved_by: approvedBy,
          missing_amount_cdf: missingAmountCDF ? Number.parseFloat(missingAmountCDF) : undefined,
          missing_amount_usd: missingAmountUSD ? Number.parseFloat(missingAmountUSD) : undefined,
          remarks: amendmentNote || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erreur lors de l'amendement: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "✅ Écart signalé",
          description:
            "Le rapport a été mis à jour avec les montants manquants. Les informations ont été enregistrées.",
          duration: 5000,
        })
        setMissingAmountCDF("")
        setMissingAmountUSD("")
        setAmendmentNote("")
        setShowAmendDialog(false)
        fetchPaymentReport(selectedDeliverer.deliverer_id)
      } else {
        throw new Error(result.message || "Erreur lors de l'amendement")
      }
    } catch (error) {
      console.error("Error amending report:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'amender le rapport de paiement",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingAmendment(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2B015F]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Suivi des Livreurs</h1>
        <p className="text-gray-500 mt-2">Suivez les activités de livraison d'aujourd'hui</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px,1fr]">
        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle>Livreurs Actifs</CardTitle>
            <CardDescription>
              {deliverers.length} livreur{deliverers.length !== 1 ? "s" : ""} actif{deliverers.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {deliverers?.map((deliverer) => (
              <Card
                key={deliverer._id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedDeliverer?._id === deliverer._id ? "border-[#2B015F] bg-purple-50" : "hover:border-gray-300"
                }`}
                onClick={() => handleDelivererClick(deliverer)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#2B015F] text-white text-sm">
                        {getInitials(deliverer.name, deliverer.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {deliverer.name} {deliverer.last_name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <Phone className="h-3 w-3" />
                        <span className="truncate">{deliverer.phone_number}</span>
                      </div>
                      {deliverer.delivery_zone && (
                        <div className="flex items-center gap-1 text-xs mt-1">
                          <MapPin className="h-3 w-3 text-[#2B015F]" />
                          <span className="font-medium truncate">{deliverer.delivery_zone.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {deliverers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">Aucun livreur actif</h3>
                <p className="text-xs text-gray-500">Il n'y a aucun livreur actif dans le système.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {!selectedDeliverer ? (
            <Card className="h-[400px] flex items-center justify-center">
              <CardContent className="text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez un livreur</h3>
                <p className="text-gray-500">Cliquez sur un livreur pour voir son rapport de paiement</p>
              </CardContent>
            </Card>
          ) : loadingReport ? (
            <Card className="h-[400px] flex items-center justify-center">
              <CardContent>
                <Loader2 className="h-8 w-8 animate-spin text-[#2B015F] mx-auto" />
                <p className="text-center text-gray-500 mt-4">Chargement du rapport...</p>
              </CardContent>
            </Card>
          ) : paymentReport ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#2B015F]" />
                    Rapport de Paiement - {selectedDeliverer.name} {selectedDeliverer.last_name}
                  </CardTitle>
                  <CardDescription>Détails des livraisons et paiements</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-[#2B015F]" />
                    Résumé des Paiements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {paymentReport?.payments?.map((payment, idx) => (
                      <Card key={idx}>
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Valeur des colis</span>
                              <span className="font-semibold">
                                {formatCurrency(payment.total_package_value, payment.currency)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Frais de livraison</span>
                              <span className="font-semibold text-[#2B015F]">
                                {formatCurrency(payment.total_delivery_fees, payment.currency)}
                              </span>
                            </div>
                            <div className="pt-2 border-t">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-900">Total à remettre</span>
                                <span className="text-lg font-bold text-green-600">
                                  {formatCurrency(
                                    payment.total_package_value + payment.total_delivery_fees,
                                    payment.currency,
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Montant Total à Récupérer
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {calculateTotalByCurrency().map((total, idx) => (
                        <div key={idx} className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-green-700">{total.total?.toLocaleString()}</span>
                          <span className="text-lg font-semibold text-green-600">{total.currency}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-green-200 flex flex-wrap gap-3">
                      <Button
                        onClick={() => setShowApprovalDialog(true)}
                        disabled={isApproving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isApproving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Approbation...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approuver le rapport
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => setShowAmendDialog(true)}
                        variant="outline"
                        className="border-orange-500 text-orange-700 hover:bg-orange-50"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Signaler un écart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {paymentReport.payment_reports.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Rapports de Paiement et Livraisons</CardTitle>
                    <CardDescription>
                      {paymentReport.payment_reports.length} rapport(s) • {paymentReport.deliveries.length} livraison(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {paymentReport.payment_reports?.map((report) => {
                      const isExpanded = expandedReports.has(report.payment_report_id)
                      const delivery = paymentReport.deliveries.find((d) => d.delivery_id === report.delivery_id)

                      return (
                        <Card key={report.payment_report_id} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div
                              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => toggleReportExpansion(report.payment_report_id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 grid gap-3 md:grid-cols-4">
                                  <div>
                                    <span className="text-xs text-gray-600 block mb-1">Code colis</span>
                                    <span className="font-semibold text-[#2B015F]">
                                      {delivery?.package_code || "N/A"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-600 block mb-1">Frais de livraison</span>
                                    <span className="font-semibold text-green-600">
                                      {formatCurrency(
                                        report.received_delivery_fee.value,
                                        report.received_delivery_fee.currency,
                                      )}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-600 block mb-1">Valeur des colis</span>
                                    <div className="space-y-0.5">
                                      {report.received_package_value.map((val, idx) => (
                                        <div key={idx} className="font-semibold text-sm">
                                          {formatCurrency(val.value, val.currency)}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-600 block mb-1">Destinataire</span>
                                    <span className="font-semibold text-sm truncate block">
                                      {delivery?.recipient.name || "N/A"}
                                    </span>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="ml-2">
                                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </Button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="border-t bg-gray-50 p-4 space-y-4">
                                <div className="bg-white rounded-lg p-4 space-y-3">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-sm text-gray-900">Détails du Paiement</h4>
                                    {editingReportId === report.payment_report_id ? (
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => { e.stopPropagation(); cancelEditingReport() }}
                                          className="h-7 px-2 text-xs"
                                        >
                                          <X className="h-3 w-3 mr-1" />
                                          Annuler
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={(e) => { e.stopPropagation(); handleSaveReport(report) }}
                                          className="h-7 px-2 text-xs bg-[#2B015F] hover:bg-[#2B015F]/90"
                                          disabled={savingReport}
                                        >
                                          {savingReport ? (
                                            <>
                                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                              Sauvegarde...
                                            </>
                                          ) : (
                                            <>
                                              <Save className="h-3 w-3 mr-1" />
                                              Sauvegarder
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => { e.stopPropagation(); startEditingReport(report) }}
                                        className="h-7 px-2 text-xs"
                                      >
                                        <Pencil className="h-3 w-3 mr-1" />
                                        Modifier
                                      </Button>
                                    )}
                                  </div>
                                  <div className="grid gap-3 md:grid-cols-2">
                                    {report.expected_delivery_fee && (
                                      <div>
                                        <span className="text-xs text-gray-600 block mb-1">
                                          Frais de livraison attendus
                                        </span>
                                        <span className="font-semibold text-orange-600">
                                          {formatCurrency(
                                            report.expected_delivery_fee.value,
                                            report.expected_delivery_fee.currency,
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-xs text-gray-600 block mb-1">Frais de livraison reçus</span>
                                      {editingReportId === report.payment_report_id && editedDeliveryFee ? (
                                        <div className="flex items-center gap-2">
                                          <Input
                                            type="number"
                                            value={editedDeliveryFee.value}
                                            onChange={(e) =>
                                              setEditedDeliveryFee({
                                                ...editedDeliveryFee,
                                                value: Number.parseFloat(e.target.value) || 0,
                                              })
                                            }
                                            className="h-8 w-32 text-sm"
                                            step="0.01"
                                            min="0"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <span className="text-xs text-gray-500">{editedDeliveryFee.currency}</span>
                                        </div>
                                      ) : (
                                        <span className="font-semibold text-green-600">
                                          {formatCurrency(
                                            report.received_delivery_fee.value,
                                            report.received_delivery_fee.currency,
                                          )}
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-600 block mb-1">Valeur des colis reçue</span>
                                      {editingReportId === report.payment_report_id ? (
                                        <div className="space-y-2">
                                          {editedPackageValues.map((val, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                              <Input
                                                type="number"
                                                value={val.value}
                                                onChange={(e) => {
                                                  const newVals = [...editedPackageValues]
                                                  newVals[idx] = {
                                                    ...newVals[idx],
                                                    value: Number.parseFloat(e.target.value) || 0,
                                                  }
                                                  setEditedPackageValues(newVals)
                                                }}
                                                className="h-8 w-32 text-sm"
                                                step="0.01"
                                                min="0"
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                              <span className="text-xs text-gray-500">{val.currency}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="space-y-1">
                                          {report.received_package_value.map((val, idx) => (
                                            <div key={idx} className="font-semibold text-sm">
                                              {formatCurrency(val.value, val.currency)}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    {Object.keys(report.declared_package_value).length > 0 && (
                                      <div>
                                        <span className="text-xs text-gray-600 block mb-1">Valeur déclarée</span>
                                        <div className="space-y-1">
                                          {Object.entries(report.declared_package_value).map(([currency, value]) => (
                                            <div key={currency} className="font-semibold text-sm">
                                              {formatCurrency(value, currency)}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  {report.notes && (
                                    <div className="pt-2 border-t">
                                      <span className="text-xs text-gray-600 block mb-1">Notes</span>
                                      <p className="text-sm">{report.notes}</p>
                                    </div>
                                  )}
                                </div>

                                {delivery && (
                                  <div className="bg-white rounded-lg p-4">
                                    <h4 className="font-semibold text-sm text-gray-900 mb-3">
                                      Détails de la Livraison
                                    </h4>
                                    <div className="space-y-3">
                                      <div className="grid gap-3 md:grid-cols-2">
                                        <div>
                                          <span className="text-xs text-gray-600 block mb-1">Code colis</span>
                                          <span className="font-semibold text-[#2B015F]">{delivery.package_code}</span>
                                        </div>
                                        <div>
                                          <span className="text-xs text-gray-600 block mb-1">Statut</span>
                                          <Badge variant="secondary">{delivery.status}</Badge>
                                        </div>
                                      </div>
                                      <div className="grid gap-3 md:grid-cols-2">
                                        <div>
                                          <span className="text-xs text-gray-600 block mb-1">Client</span>
                                          <p className="text-sm font-medium">{delivery.customer.name}</p>
                                          <p className="text-xs text-gray-600">{delivery.customer.phone_number}</p>
                                        </div>
                                        <div>
                                          <span className="text-xs text-gray-600 block mb-1">Destinataire</span>
                                          <p className="text-sm font-medium">{delivery.recipient.name}</p>
                                          <p className="text-xs text-gray-600">{delivery.recipient.phone_number}</p>
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-xs text-gray-600 block mb-1">Adresse de ramassage</span>
                                        <p className="text-sm">{delivery.pickup_address}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-gray-600 block mb-1">Adresse de livraison</span>
                                        <p className="text-sm">{delivery.delivery_address}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-gray-600 block mb-1">Date de création</span>
                                        <p className="text-sm">
                                          {new Date(delivery.created_at).toLocaleDateString("fr-FR", {
                                            day: "2-digit",
                                            month: "long",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="h-[400px] flex items-center justify-center">
              <CardContent className="text-center">
                <p className="text-gray-500">Aucune donnée disponible pour ce livreur</p>
              </CardContent>
            </Card>
          )}

          {selectedDeliverer && !loadingReport && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#2B015F]" />
                  Historique des Rapports
                </CardTitle>
                <CardDescription>Rapports de paiement précédemment approuvés</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHistorical ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#2B015F]" />
                  </div>
                ) : historicalReports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">Aucun rapport historique disponible</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historicalReports.map((dailyReport) => {
                      const isExpanded = expandedHistorical.has(dailyReport.deliverer_daily_report_id)
                      const totals = calculateDailyReportTotal(dailyReport.daily_report?.payments)
                      const hasMissingAmount = dailyReport.missing_amount.some((m) => m.value > 0)

                      return (
                        <Card key={dailyReport.deliverer_daily_report_id} className="overflow-hidden">
                          <div
                            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleHistoricalExpansion(dailyReport.deliverer_daily_report_id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {/* @ts-ignore */}
                                    {formatDate(dailyReport.created_at)}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={
                                      dailyReport.approved_by === "management"
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                    }
                                  >
                                    {dailyReport.approved_by === "management" ? "Direction" : "Opérations"}
                                  </Badge>
                                  {hasMissingAmount && (
                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                      Écart signalé
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-3 text-sm">
                                  {totals.map((total, idx) => (
                                    <div key={idx} className="flex items-baseline gap-1">
                                      <span className="font-bold text-green-600">{total.total?.toLocaleString()}</span>
                                      <span className="text-gray-600">{total.currency}</span>
                                    </div>
                                  ))}
                                </div>
                                {hasMissingAmount && (
                                  <div className="flex flex-wrap gap-3 text-sm">
                                    {dailyReport.missing_amount.map(
                                      (missing, idx) =>
                                        missing.value > 0 && (
                                          <div key={idx} className="flex items-baseline gap-1 text-orange-600">
                                            <span className="font-semibold">-{missing.value?.toLocaleString()}</span>
                                            <span>{missing.currency} manquant</span>
                                          </div>
                                        ),
                                    )}
                                  </div>
                                )}
                                {dailyReport.remarks && (
                                  <p className="text-xs text-gray-600 italic">Note: {dailyReport.remarks}</p>
                                )}
                              </div>
                              <div className="ml-4">
                                {isExpanded ? (
                                  <ChevronUp className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t bg-gray-50 p-4 space-y-4">
                              <div className="grid gap-3 md:grid-cols-2">
                                {dailyReport.daily_report?.payments?.map((payment, idx) => (
                                  <Card key={idx}>
                                    <CardContent className="pt-4">
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Valeur des colis</span>
                                          <span className="font-semibold">
                                            {formatCurrency(payment.total_package_value, payment.currency)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Frais de livraison</span>
                                          <span className="font-semibold text-[#2B015F]">
                                            {formatCurrency(payment.total_delivery_fees, payment.currency)}
                                          </span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>

                              <div>
                                <h4 className="font-semibold text-sm text-gray-900 mb-2">
                                  Livraisons ({dailyReport.daily_report.deliveries.length})
                                </h4>
                                <div className="space-y-2">
                                  {dailyReport.daily_report.deliveries.map((delivery) => (
                                    <Card key={delivery.delivery_id}>
                                      <CardContent className="pt-3 pb-3">
                                        <div className="grid gap-2 text-xs">
                                          <div className="flex justify-between items-center">
                                            <span className="font-semibold text-[#2B015F]">
                                              {delivery.package_code}
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                              {delivery.status}
                                            </Badge>
                                          </div>
                                          <div className="text-gray-600">
                                            <div>Client: {delivery.customer.name}</div>
                                            <div>Destinataire: {delivery.recipient.name}</div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Confirmer l'Approbation
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir approuver le rapport de paiement de {selectedDeliverer?.name}{" "}
              {selectedDeliverer?.last_name} ?
            </DialogDescription>
          </DialogHeader>

          {paymentReport && (
            <div className="py-4 space-y-3">
              <p className="text-sm text-gray-600">
                Cette action confirmera que les montants suivants ont été récupérés :
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {calculateTotalByCurrency().map((total, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total {total.currency}</span>
                    <span className="text-lg font-bold text-green-600">
                      {total.total?.toLocaleString()} {total.currency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={isApproving}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                handleApproveReport()
                setShowApprovalDialog(false)
              }}
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approbation...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmer l'approbation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAmendDialog} onOpenChange={setShowAmendDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Signaler un Écart de Paiement
            </DialogTitle>
            <DialogDescription>
              Indiquez les montants manquants et ajoutez une remarque concernant le rapport de {selectedDeliverer?.name}{" "}
              {selectedDeliverer?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="missing-cdf">Montant manquant (CDF)</Label>
              <Input
                id="missing-cdf"
                type="number"
                placeholder="0"
                value={missingAmountCDF}
                onChange={(e) => setMissingAmountCDF(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="missing-usd">Montant manquant (USD)</Label>
              <Input
                id="missing-usd"
                type="number"
                placeholder="0"
                value={missingAmountUSD}
                onChange={(e) => setMissingAmountUSD(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Remarques (optionnel)</Label>
              <Textarea
                id="note"
                placeholder="Ajoutez des détails sur l'écart constaté..."
                value={amendmentNote}
                onChange={(e) => setAmendmentNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAmendDialog(false)
                setMissingAmountCDF("")
                setMissingAmountUSD("")
                setAmendmentNote("")
              }}
              disabled={isSubmittingAmendment}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAmendReport}
              disabled={isSubmittingAmendment || (!missingAmountCDF && !missingAmountUSD)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmittingAmendment ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Soumettre l'écart"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
