"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileSpreadsheet,
  Link2,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Zap,
  ExternalLink,
  ShoppingBag,
  Table2,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Activity,
} from "lucide-react"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_SERVER_BASE_URL

// Our fixed fields that the user maps to
const OUR_FIELDS: { key: string; label: string; description: string; required: boolean }[] = [
  {
    key: "identifier_column",
    label: "Identifiant de commande",
    description: "Colonne contenant le numero unique de la commande",
    required: true,
  },
  {
    key: "recipient_name",
    label: "Nom du destinataire",
    description: "Colonne contenant le nom complet du destinataire",
    required: true,
  },
  {
    key: "recipient_phone_number",
    label: "Telephone du destinataire",
    description: "Colonne contenant le numero de telephone",
    required: true,
  },
  {
    key: "recipient_address_line",
    label: "Adresse du destinataire",
    description: "Colonne contenant l'adresse de livraison",
    required: true,
  },
  {
    key: "package_description",
    label: "Description du colis",
    description: "Colonne contenant la description du produit",
    required: true,
  },
  {
    key: "package_value_amount",
    label: "Montant de la commande",
    description: "Colonne contenant le montant total",
    required: true,
  },
]

interface SheetHeader {
  column_name: string
  index: number
}

interface ColumnMapping {
  [key: string]: {
    column_name: string
    index: number
  }
}

interface ExistingIntegration {
  _id: string
  merchant_integration_id: string
  merchant_id: string
  provider: string
  spreadsheet_url: string
  sheet_name: string
  column_mapping: ColumnMapping
  package_value_currency: string
  filter_criteria: string | null
  next_row_to_sync_identifier: string | null
  last_synced_row_identifier: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_synced_at: string | null
}

type Step = "connect" | "map" | "done"

export function GoogleSheetsIntegration() {
  const { user } = useAuth()

  // Existing integration state
  const [existingIntegrations, setExistingIntegrations] = useState<ExistingIntegration[]>([])
  const [loadingExisting, setLoadingExisting] = useState(true)

  // Step 1: Connect sheet
  const [sheetUrl, setSheetUrl] = useState("")
  const [sheetName, setSheetName] = useState("")
  const [headers, setHeaders] = useState<SheetHeader[]>([])
  const [fetchingHeaders, setFetchingHeaders] = useState(false)
  const [headerError, setHeaderError] = useState<string | null>(null)

  // Step 2: Map columns
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [nextRowIdentifier, setNextRowIdentifier] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Current step
  const [currentStep, setCurrentStep] = useState<Step>("connect")
  const [addingNewSheet, setAddingNewSheet] = useState(false)

  // Sync state
  const [syncingIntegrationId, setSyncingIntegrationId] = useState<string | null>(null)
  const [syncResults, setSyncResults] = useState<Record<string, { success: boolean; message: string } | null>>({})

  // Fetch existing integration on mount
  const fetchExistingIntegration = useCallback(async () => {
    if (!user?.id) {
      setLoadingExisting(false)
      return
    }
    setLoadingExisting(true)
    try {
      const merchantId = user.user_id || user.id
      const url = `${API_BASE_URL}/deliveries/merchant-integration/get-merchant-integration-data?merchant_id=${merchantId}&provider=google_sheets`
      const res = await fetch(url)
      const result = await res.json()
      if (result.success && result.data) {
        const data = Array.isArray(result.data) ? result.data : [result.data]
        setExistingIntegrations(data)
      } else {
        setExistingIntegrations([])
      }
    } catch {
      setExistingIntegrations([])
    } finally {
      setLoadingExisting(false)
    }
  }, [user?.id, user?.user_id])

  useEffect(() => {
    fetchExistingIntegration()
  }, [fetchExistingIntegration])

  // Step 1: Fetch headers from Google Sheet
  const handleFetchHeaders = async () => {
    if (!sheetUrl || !sheetName) return
    setFetchingHeaders(true)
    setHeaderError(null)
    setHeaders([])
    try {
      const encodedUrl = encodeURIComponent(sheetUrl)
      const encodedName = encodeURIComponent(sheetName)
      const res = await fetch(
        `${API_BASE_URL}/deliveries/merchant-integration/get-google-sheet-headers?sheet_url=${encodedUrl}&sheet_name=${encodedName}`
      )
      const result = await res.json()
      if (result.success && result.data) {
        const mappedHeaders: SheetHeader[] = result.data.map(
          (name: string, index: number) => ({ column_name: name, index })
        )
        setHeaders(mappedHeaders)
        setCurrentStep("map")
      } else {
        setHeaderError(result.message || "Impossible de recuperer les en-tetes. Verifiez le lien et le nom de la feuille.")
      }
    } catch {
      setHeaderError("Erreur de connexion au serveur. Veuillez reessayer.")
    } finally {
      setFetchingHeaders(false)
    }
  }

  // Step 2: Save mapping
  const handleSaveIntegration = async () => {
    if (!user?.id) return
    setSaving(true)
    setSaveError(null)

    const mappingPayload: ColumnMapping = {}
    for (const field of OUR_FIELDS) {
      const selectedHeaderName = columnMapping[field.key]
      if (!selectedHeaderName) {
        setSaveError(`Veuillez mapper le champ "${field.label}"`)
        setSaving(false)
        return
      }
      const header = headers.find((h) => h.column_name === selectedHeaderName)
      if (!header) {
        setSaveError(`En-tete introuvable pour "${field.label}"`)
        setSaving(false)
        return
      }
      mappingPayload[field.key] = {
        column_name: header.column_name,
        index: header.index,
      }
    }

    if (!nextRowIdentifier) {
      setSaveError("Veuillez saisir la valeur de la prochaine ligne a synchroniser.")
      setSaving(false)
      return
    }

    const body = {
      user_id: user.id,
      spreadsheet_url: sheetUrl,
      sheet_name: sheetName,
      column_mapping: mappingPayload,
      next_row_to_sync_identifier: nextRowIdentifier,
      package_value_currency: currency,
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/deliveries/merchant-integration/create-google-sheet-integration-data`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )
      const result = await res.json()
      if (result.success) {
        setCurrentStep("done")
        setAddingNewSheet(true)
        await fetchExistingIntegration()
      } else {
        setSaveError(result.message || "Erreur lors de la sauvegarde. Veuillez reessayer.")
      }
    } catch {
      setSaveError("Erreur de connexion au serveur.")
    } finally {
      setSaving(false)
    }
  }

  // Trigger sync
  const handleSync = async (merchantIntegrationId: string) => {
    setSyncingIntegrationId(merchantIntegrationId)
    setSyncResults((prev) => ({ ...prev, [merchantIntegrationId]: null }))
    try {
      const res = await fetch(
        `${API_BASE_URL}/deliveries/merchant-integration/sync-merchant-integration-data?merchant_integration_id=${merchantIntegrationId}`
      )
      const result = await res.json()
      if (result.success) {
        setSyncResults((prev) => ({
          ...prev,
          [merchantIntegrationId]: { success: true, message: result.message || "Synchronisation reussie!" },
        }))
        // Refresh integration data to get updated sync identifiers
        await fetchExistingIntegration()
      } else {
        setSyncResults((prev) => ({
          ...prev,
          [merchantIntegrationId]: { success: false, message: result.message || "Echec de la synchronisation." },
        }))
      }
    } catch {
      setSyncResults((prev) => ({
        ...prev,
        [merchantIntegrationId]: { success: false, message: "Erreur de connexion. Veuillez reessayer." },
      }))
    } finally {
      setSyncingIntegrationId(null)
    }
  }

  // Reset to create/edit new integration
  const handleReconfigure = () => {
    setExistingIntegrations([])
    setCurrentStep("connect")
    setAddingNewSheet(false)
    setHeaders([])
    setColumnMapping({})
    setSheetUrl("")
    setSheetName("")
    setNextRowIdentifier("")
    setCurrency("USD")
    setHeaderError(null)
    setSaveError(null)
    setSyncResults({})
  }

  const handleAddNewSheet = () => {
    setAddingNewSheet(true)
    setCurrentStep("connect")
    setHeaders([])
    setColumnMapping({})
    setSheetUrl("")
    setSheetName("")
    setNextRowIdentifier("")
    setCurrency("USD")
    setHeaderError(null)
    setSaveError(null)
    setSyncResults({})
  }

  // Loading state
  if (loadingExisting) {
    return (
      <div className="space-y-6">
        <IntegrationPageHeader />
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-2xl bg-[#22D3EE]/10 flex items-center justify-center animate-pulse">
                <FileSpreadsheet className="h-6 w-6 text-[#22D3EE]" />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#22D3EE] animate-bounce" />
            </div>
            <p className="text-sm text-[#B08968]/60 animate-pulse">
              Chargement de vos integrations...
            </p>
          </div>
        </div>
      </div>
    )
  }

  const shouldShowCreateFlow = addingNewSheet || existingIntegrations.length === 0

  return (
    <div className="space-y-6">
      <IntegrationPageHeader
        connected={existingIntegrations.length > 0}
        onAddSheet={existingIntegrations.length > 0 ? handleAddNewSheet : undefined}
      />

      {shouldShowCreateFlow && (
        <>
          {/* Empty state / Intro card */}
      {currentStep === "connect" && headers.length === 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-[#B08968]/15 bg-gradient-to-br from-[#22D3EE]/[0.03] via-white to-[#B08968]/[0.04] p-8 md:p-10">
          {/* Decorative grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />

          <div className="relative flex flex-col lg:flex-row items-start gap-8">
            {/* Left: Content */}
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/30 bg-[#22D3EE]/10 px-3 py-1">
                <Zap className="h-3.5 w-3.5 text-[#22D3EE]" />
                <span className="text-xs font-semibold text-[#1a1009]">Import automatique</span>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-[#1a1009] text-balance leading-tight">
                  Importez vos commandes directement depuis Google Sheets
                </h3>
                <p className="text-[#B08968] leading-relaxed max-w-lg">
                  Connectez la feuille Google liee a votre boutique{" "}
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Shopify
                  </span>
                  , ou toute autre feuille Google personnelle contenant vos commandes.
                  DareDare se synchronise et importe vos livraisons en un clic.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 text-sm text-[#B08968]">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#22D3EE]/10 flex items-center justify-center">
                    <Check className="h-3 w-3 text-[#22D3EE]" />
                  </div>
                  <span>Shopify, WooCommerce, etc.</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#22D3EE]/10 flex items-center justify-center">
                    <Check className="h-3 w-3 text-[#22D3EE]" />
                  </div>
                  <span>Synchronisation instantanee</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#22D3EE]/10 flex items-center justify-center">
                    <Check className="h-3 w-3 text-[#22D3EE]" />
                  </div>
                  <span>Mapping personnalise</span>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="hidden lg:flex flex-col items-center gap-3 shrink-0">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center">
                  <ShoppingBag className="h-9 w-9 text-primary/40" />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                  <ArrowDownToLine className="h-5 w-5 text-[#FBC140]" />
                </div>
              </div>
              <div className="h-20 w-20 rounded-2xl bg-[#0F9D58]/10 border border-[#0F9D58]/20 flex items-center justify-center">
                <FileSpreadsheet className="h-9 w-9 text-[#0F9D58]" />
              </div>
              <div className="relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <ArrowDownToLine className="h-5 w-5 text-[#FBC140]" />
                </div>
                <div className="h-20 w-20 rounded-2xl bg-[#FBC140]/10 border border-[#FBC140]/20 flex items-center justify-center">
                  <img src="/logo.png" alt="DareDare" className="h-10 w-10 object-contain" onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.parentElement!.innerHTML = '<span class="text-lg font-black text-primary">DD</span>'
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step Indicator */}
      <div className="flex items-center gap-3">
        <StepIndicator
          stepNumber={1}
          label="Connexion"
          active={currentStep === "connect"}
          completed={currentStep === "map" || currentStep === "done"}
        />
        <div className="h-px flex-1 max-w-8 bg-border" />
        <StepIndicator
          stepNumber={2}
          label="Mapping"
          active={currentStep === "map"}
          completed={currentStep === "done"}
        />
        <div className="h-px flex-1 max-w-8 bg-border" />
        <StepIndicator
          stepNumber={3}
          label="Termine"
          active={currentStep === "done"}
          completed={false}
        />
      </div>

      {/* Step 1: Connect */}
      {currentStep === "connect" && (
        <Card className="border border-[#B08968]/15 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1a1009]">
              <div className="h-8 w-8 rounded-lg bg-[#22D3EE]/10 flex items-center justify-center">
                <Link2 className="h-4 w-4 text-[#22D3EE]" />
              </div>
              Connecter votre Google Sheet
            </CardTitle>
            <CardDescription>
              {"Entrez le lien de votre feuille Google et le nom de l'onglet pour commencer."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sheet-url">Lien de la feuille Google</Label>
              <Input
                id="sheet-url"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sheet-name">{"Nom de l'onglet"}</Label>
              <Input
                id="sheet-name"
                placeholder="Feuille 1"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
              />
            </div>

            {headerError && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{headerError}</span>
              </div>
            )}

            <Button
              className="bg-gradient-to-r from-[#22D3EE] to-[#06b6d4] text-white hover:from-[#06b6d4] hover:to-[#22D3EE] font-semibold border-0"
              onClick={handleFetchHeaders}
              disabled={!sheetUrl || !sheetName || fetchingHeaders}
            >
              {fetchingHeaders ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verification...
                </>
              ) : (
                <>
                  Valider et continuer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Map columns */}
      {currentStep === "map" && (
        <Card className="border border-[#B08968]/15 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1a1009]">
              <div className="h-8 w-8 rounded-lg bg-[#22D3EE]/10 flex items-center justify-center">
                <Table2 className="h-4 w-4 text-[#22D3EE]" />
              </div>
              Mapper les colonnes
            </CardTitle>
            <CardDescription>
              {"Associez les colonnes de votre Google Sheet aux champs DareDare. Nous avons detecte"}{" "}
              <strong>{headers.length}</strong> colonnes dans votre feuille.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#B08968] bg-[#f8fafc] rounded-lg p-3 border border-[#B08968]/10">
              <FileSpreadsheet className="h-4 w-4 text-[#0F9D58]" />
              <span className="font-medium text-[#1a1009]">{sheetName}</span>
              <span className="text-[#B08968]/60">-</span>
              <span className="truncate max-w-[300px] font-mono text-xs text-[#B08968]">{sheetUrl}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 text-xs"
                onClick={() => setCurrentStep("connect")}
              >
                Modifier
              </Button>
            </div>

            <Separator />

            <div className="space-y-4">
              {OUR_FIELDS.map((field) => (
                <div key={field.key} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <Label className="font-medium text-[#1a1009]">{field.label}</Label>
                      {field.required && (
                        <Badge variant="outline" className="text-xs border-[#22D3EE]/40 text-[#22D3EE]">
                          Requis
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#B08968]/60 mt-0.5">{field.description}</p>
                  </div>
                  <Select
                    value={columnMapping[field.key] || ""}
                    onValueChange={(val) =>
                      setColumnMapping((prev) => ({ ...prev, [field.key]: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionnez une colonne" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((h) => (
                        <SelectItem key={h.index} value={h.column_name}>
                          {h.column_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="next-row">Prochaine ligne a synchroniser</Label>
                <p className="text-xs text-[#B08968]/60">
                  {"La valeur de l'identifiant a partir de laquelle commencer (ex: #2787)"}
                </p>
                <Input
                  id="next-row"
                  placeholder="#2787"
                  value={nextRowIdentifier}
                  onChange={(e) => setNextRowIdentifier(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <p className="text-xs text-[#B08968]/60">
                  La devise utilisee pour les montants de commande.
                </p>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - Dollar americain</SelectItem>
                    <SelectItem value="CDF">CDF - Franc congolais</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {saveError && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("connect")}
              >
                Retour
              </Button>
              <Button
                className="bg-gradient-to-r from-[#22D3EE] to-[#06b6d4] text-white hover:from-[#06b6d4] hover:to-[#22D3EE] font-semibold border-0"
                onClick={handleSaveIntegration}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {"Sauvegarder l'integration"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Done */}
      {currentStep === "done" && (
        <Card className="border border-[#B08968]/15 shadow-sm overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#22D3EE]/5 via-transparent to-[#B08968]/5" />
            <CardContent className="relative flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-6">
                <div className="h-16 w-16 rounded-2xl bg-[#22D3EE]/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-[#22D3EE]" />
                </div>
                <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#22D3EE] flex items-center justify-center">
                  <Zap className="h-3 w-3 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#1a1009] mb-2">Integration configuree!</h3>
              <p className="text-[#B08968] max-w-md mb-8 leading-relaxed">
                {"Votre Google Sheet est maintenant connecte a DareDare. Vos commandes seront synchronisees automatiquement."}
              </p>
              <Button
                className="bg-gradient-to-r from-[#22D3EE] to-[#06b6d4] text-white hover:from-[#06b6d4] hover:to-[#22D3EE] font-semibold border-0"
                onClick={() => {
                  fetchExistingIntegration()
                  setAddingNewSheet(false)
                  setCurrentStep("connect")
                }}
              >
                {"Voir l'integration"}
              </Button>
            </CardContent>
          </div>
        </Card>
      )}
        </>
      )}

      {existingIntegrations.length > 0 && (
        <div className="space-y-4">
          {existingIntegrations.map((integration) => (
            <ExistingIntegrationView
              key={integration.merchant_integration_id}
              integration={integration}
              onReconfigure={handleReconfigure}
              onSync={() => handleSync(integration.merchant_integration_id)}
              syncing={syncingIntegrationId === integration.merchant_integration_id}
              syncResult={syncResults[integration.merchant_integration_id] || null}
              onDismissSyncResult={() =>
                setSyncResults((prev) => ({ ...prev, [integration.merchant_integration_id]: null }))
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Page-level header
function IntegrationPageHeader({ connected = false, onAddSheet }: { connected?: boolean; onAddSheet?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-[#1a1009] mb-1">Integrations</h2>
        <p className="text-sm text-[#B08968]">
          {connected
            ? "Gerez vos integrations et synchronisez vos commandes."
            : "Connectez vos plateformes pour importer automatiquement vos commandes."}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {connected && onAddSheet && (
          <Button variant="outline" size="sm" onClick={onAddSheet}>
            Ajouter une feuille
          </Button>
        )}
        {connected && (
          <Badge className="bg-[#0F9D58]/10 text-[#0F9D58] border border-[#0F9D58]/20 hover:bg-[#0F9D58]/10">
            <Activity className="h-3 w-3 mr-1" />
            Connecte
          </Badge>
        )}
      </div>
    </div>
  )
}

// Sub-component: Step indicator
function StepIndicator({
  stepNumber,
  label,
  active,
  completed,
}: {
  stepNumber: number
  label: string
  active: boolean
  completed: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
          completed
            ? "bg-[#22D3EE]/10 text-[#22D3EE] ring-2 ring-[#22D3EE]/20"
            : active
              ? "bg-[#22D3EE] text-white shadow-lg shadow-[#22D3EE]/20"
              : "bg-[#f1f5f9] text-[#B08968]"
        }`}
      >
        {completed ? <Check className="h-4 w-4" /> : stepNumber}
      </div>
      <span
        className={`text-sm font-medium transition-colors duration-300 ${
          active ? "text-[#1a1009]" : completed ? "text-[#22D3EE]" : "text-[#B08968]/60"
        }`}
      >
        {label}
      </span>
    </div>
  )
}

// Sub-component: Existing integration view (premium design)
function ExistingIntegrationView({
  integration,
  onReconfigure,
  onSync,
  syncing,
  syncResult,
  onDismissSyncResult,
}: {
  integration: ExistingIntegration
  onReconfigure: () => void
  onSync: () => void
  syncing: boolean
  syncResult: { success: boolean; message: string } | null
  onDismissSyncResult: () => void
}) {
  const fieldLabels: Record<string, string> = {
    identifier_column: "Identifiant de commande",
    recipient_name: "Nom du destinataire",
    recipient_phone_number: "Telephone du destinataire",
    recipient_address_line: "Adresse du destinataire",
    package_description: "Description du colis",
    package_value_amount: "Montant de la commande",
  }

  const hasSyncedBefore = !!integration.last_synced_row_identifier

  return (
    <div className="space-y-4">
      {/* Main integration card */}
      <div className="relative overflow-hidden rounded-2xl border border-[#B08968]/15 bg-white shadow-sm">
        {/* Top gradient accent */}
        <div className="h-1 w-full bg-gradient-to-r from-[#22D3EE] via-[#06b6d4] to-[#1a1009]" />

        <div className="p-6 space-y-6">
          {/* Header with status */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-14 w-14 rounded-2xl bg-[#0F9D58]/10 border border-[#0F9D58]/20 flex items-center justify-center">
                  <FileSpreadsheet className="h-7 w-7 text-[#0F9D58]" />
                </div>
                {/* Pulse dot */}
                <div className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#0F9D58] flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-[#0F9D58] animate-ping" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-[#1a1009] text-lg">Google Sheets</h3>
                <p className="text-sm text-[#B08968]">{integration.sheet_name}</p>
              </div>
            </div>
            <Badge
              className={`${
                integration.is_active
                  ? "bg-[#0F9D58]/10 text-[#0F9D58] border-[#0F9D58]/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              } border`}
            >
              {integration.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Sync status banner */}
          <div className="rounded-xl bg-[#f8fafc] border border-[#B08968]/10 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#22D3EE]/10 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-[#22D3EE]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#B08968]/60 uppercase tracking-wider">Prochaine ligne</p>
                  <p className="text-sm font-semibold text-[#1a1009] mt-0.5 truncate">
                    {integration.next_row_to_sync_identifier || "---"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#0F9D58]/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-[#0F9D58]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#B08968]/60 uppercase tracking-wider">Derniere sync</p>
                  <p className="text-sm font-semibold text-[#1a1009] mt-0.5 truncate">
                    {integration.last_synced_row_identifier || "Aucune"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#B08968]/10 flex items-center justify-center shrink-0">
                  <Activity className="h-4 w-4 text-[#B08968]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#B08968]/60 uppercase tracking-wider">Devise</p>
                  <p className="text-sm font-semibold text-[#1a1009] mt-0.5">{integration.package_value_currency}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#22D3EE]/10 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-[#22D3EE]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#B08968]/60 uppercase tracking-wider">Synchronise le </p>
                  <p className="text-sm font-semibold text-[#1a1009] mt-0.5 truncate">
                    {integration.last_synced_at
                      ? new Date(integration.last_synced_at).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Jamais"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sync result toast */}
          {syncResult && (
            <div
              className={`flex items-center justify-between gap-3 rounded-xl p-4 border ${
                syncResult.success
                  ? "bg-[#0F9D58]/5 border-[#0F9D58]/20 text-[#0F9D58]"
                  : "bg-destructive/5 border-destructive/20 text-destructive"
              }`}
            >
              <div className="flex items-center gap-2">
                {syncResult.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span className="text-sm font-medium">{syncResult.message}</span>
              </div>
              <button onClick={onDismissSyncResult} className="text-xs underline opacity-70 hover:opacity-100 shrink-0">
                Fermer
              </button>
            </div>
          )}

          {/* Sync CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              onClick={onSync}
              disabled={syncing}
              className="flex-1 sm:flex-initial bg-[#FBC140] text-primary font-semibold hover:bg-[#FBC140]/90 h-11 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Synchronisation en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {hasSyncedBefore ? "Resynchroniser maintenant" : "Lancer la synchronisation"}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-xl"
              onClick={() => window.open(integration.spreadsheet_url, "_blank")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Ouvrir la feuille
            </Button>
          </div>

          <Separator />

          {/* Column mapping - collapsible style */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Table2 className="h-4 w-4 text-primary" />
              Mapping des colonnes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(integration.column_mapping).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-2.5 group hover:bg-muted/60 transition-colors duration-150"
                >
                  <span className="text-sm text-muted-foreground">
                    {fieldLabels[key] || key}
                  </span>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                    <Badge variant="outline" className="font-mono text-xs bg-card">
                      {value.column_name}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Spreadsheet URL */}
          <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3 border border-border">
            <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground font-mono truncate flex-1">
              {integration.spreadsheet_url}
            </p>
          </div>

          {/* Metadata + Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>
                {"Cree le "}
                {new Date(integration.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="hidden sm:inline text-border">|</span>
              <span>
                {"Mis a jour le "}
                {new Date(integration.updated_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary h-8 text-xs"
              onClick={onReconfigure}
            >
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Reconfigurer
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
