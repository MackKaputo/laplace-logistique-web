"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Package, Share2, ShoppingCart, CheckCircle, Truck, Sparkles, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import RoleGuard from "@/components/role-guard"

export default function CataloguePage() {
  const router = useRouter()

  return (
    <RoleGuard allowedRoles={["enterprise", "hospital", "admin", "personal"]}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-yellow-50">
        {/* Header */}
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="text-[#2B015F] hover:bg-purple-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au tableau de bord
          </Button>
        </div>

        {/* Hero Section */}
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-[#FBC140]" />
              <Badge className="bg-[#FBC140] text-black hover:bg-[#FBC140]/90 text-sm px-4 py-1">
                Bientôt disponible
              </Badge>
              <Sparkles className="h-6 w-6 text-[#FBC140]" />
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-[#2B015F] leading-tight">Catalogue de Produits</h1>

            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
              Transformez votre façon de vendre avec un catalogue intelligent qui gère vos produits, vos commandes et
              vos livraisons automatiquement.
            </p>

            <div className="pt-4">
              <Button size="lg" className="bg-[#2B015F] text-white hover:bg-[#2B015F]/90 text-lg px-8 py-6" disabled>
                <Sparkles className="mr-2 h-5 w-5" />
                Notifiez-moi au lancement
              </Button>
            </div>
          </div>
        </div>

        {/* Process Flow Visualization */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-[#2B015F] mb-12">Comment ça marche ?</h2>

            <div className="grid md:grid-cols-4 gap-6 relative">
              {/* Step 1 */}
              <Card className="relative bg-white border-2 border-purple-100 hover:border-[#2B015F] transition-all">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="bg-gradient-to-br from-[#2B015F] to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 bg-[#FBC140] text-black font-bold w-8 h-8 rounded-full flex items-center justify-center">
                    1
                  </div>
                  <h3 className="font-bold text-lg text-[#2B015F]">Créez vos produits</h3>
                  <p className="text-sm text-gray-600">
                    Ajoutez vos produits avec photos, descriptions, prix et gérez votre inventaire automatiquement
                  </p>
                </CardContent>
              </Card>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <div className="w-full h-1 bg-gradient-to-r from-[#2B015F] to-purple-400"></div>
              </div>

              {/* Step 2 */}
              <Card className="relative bg-white border-2 border-purple-100 hover:border-[#2B015F] transition-all">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="bg-gradient-to-br from-[#2B015F] to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <Share2 className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 bg-[#FBC140] text-black font-bold w-8 h-8 rounded-full flex items-center justify-center">
                    2
                  </div>
                  <h3 className="font-bold text-lg text-[#2B015F]">Partagez vos liens</h3>
                  <p className="text-sm text-gray-600">
                    Partagez des liens de produits individuels ou votre catalogue complet avec vos clients
                  </p>
                </CardContent>
              </Card>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <div className="w-full h-1 bg-gradient-to-r from-purple-400 to-[#FBC140]"></div>
              </div>

              {/* Step 3 */}
              <Card className="relative bg-white border-2 border-purple-100 hover:border-[#2B015F] transition-all">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="bg-gradient-to-br from-[#2B015F] to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <ShoppingCart className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 bg-[#FBC140] text-black font-bold w-8 h-8 rounded-full flex items-center justify-center">
                    3
                  </div>
                  <h3 className="font-bold text-lg text-[#2B015F]">Recevez des commandes</h3>
                  <p className="text-sm text-gray-600">
                    Vos clients commandent directement depuis votre catalogue en ligne
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Step 4 - Full Width */}
            <div className="mt-8 flex justify-center">
              <Card className="relative bg-gradient-to-br from-[#2B015F] to-purple-600 border-0 max-w-md w-full">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="bg-[#FBC140] w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <Truck className="h-8 w-8 text-[#2B015F]" />
                  </div>
                  <div className="absolute -top-3 -right-3 bg-[#FBC140] text-black font-bold w-8 h-8 rounded-full flex items-center justify-center">
                    4
                  </div>
                  <h3 className="font-bold text-lg text-white">Livraison automatique</h3>
                  <p className="text-sm text-purple-100">
                    Chaque commande crée automatiquement une demande de livraison. Plus besoin de saisir manuellement !
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-[#2B015F] mb-12">
              Tout ce dont vous avez besoin pour vendre en ligne
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-white border-2 border-purple-100 hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-[#2B015F]" />
                  </div>
                  <h3 className="font-bold text-lg text-[#2B015F]">Gestion de produits</h3>
                  <p className="text-gray-600">
                    Créez et gérez facilement vos produits avec photos, descriptions détaillées, variantes et prix
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-2 border-purple-100 hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-[#2B015F]" />
                  </div>
                  <h3 className="font-bold text-lg text-[#2B015F]">Gestion d'inventaire</h3>
                  <p className="text-gray-600">
                    Suivez automatiquement votre stock. Recevez des alertes quand les quantités sont faibles
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-2 border-purple-100 hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center">
                    <Share2 className="h-6 w-6 text-[#2B015F]" />
                  </div>
                  <h3 className="font-bold text-lg text-[#2B015F]">Partage facile</h3>
                  <p className="text-gray-600">
                    Partagez des liens de produits individuels ou votre catalogue complet sur WhatsApp, Facebook, etc.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-2 border-purple-100 hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-[#2B015F]" />
                  </div>
                  <h3 className="font-bold text-lg text-[#2B015F]">Commandes en ligne</h3>
                  <p className="text-gray-600">
                    Vos clients commandent directement depuis votre catalogue. Recevez les notifications instantanément
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-2 border-purple-100 hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-[#2B015F]" />
                  </div>
                  <h3 className="font-bold text-lg text-[#2B015F]">Confirmation de commandes</h3>
                  <p className="text-gray-600">
                    Confirmez ou refusez les commandes facilement. Communiquez avec vos clients en temps réel
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-2 border-purple-100 hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center">
                    <Truck className="h-6 w-6 text-[#2B015F]" />
                  </div>
                  <h3 className="font-bold text-lg text-[#2B015F]">Livraison automatique</h3>
                  <p className="text-gray-600">
                    Chaque commande confirmée crée automatiquement une demande de livraison. Zéro saisie manuelle !
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-[#2B015F] to-purple-600 border-0">
            <CardContent className="p-12 text-center space-y-6">
              <Sparkles className="h-12 w-12 text-[#FBC140] mx-auto" />
              <h2 className="text-3xl md:text-4xl font-bold text-white">Prêt à transformer votre business ?</h2>
              <p className="text-xl text-purple-100">
                Le catalogue Daredare arrive bientôt. Soyez parmi les premiers à en profiter !
              </p>
              <div className="pt-4">
                <Button size="lg" className="bg-[#FBC140] text-black hover:bg-[#FBC140]/90 text-lg px-8 py-6" disabled>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Notifiez-moi au lancement
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  )
}
