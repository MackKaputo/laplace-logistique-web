import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#2B015F]/90 to-[#2B015F]/70 z-10" />
        <Image
          src="/bustling-african-logistics-hub.png"
          alt="À propos de Daredare"
          width={1920}
          height={600}
          className="w-full h-[400px] object-cover"
          priority
        />
        <div className="container relative z-20 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">À propos de Daredare</h1>
            <p className="text-xl text-white/90 mb-8">
              Daredare est une entreprise de logistique urbaine basée en Afrique, spécialisée dans la livraison du
              dernier kilomètre. Nous proposons des solutions rapides, fiables et traçables pour les particuliers comme
              pour les entreprises.
            </p>
          </div>
        </div>
      </section>

      {/* Notre Histoire Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#2B015F] mb-6">Notre Histoire</h2>
              <p className="text-lg text-gray-700 mb-6">
                Daredare est né à Kinshasa, non pas d'un business plan, mais d'un ras-le-bol. En tant qu'e-commerçants,
                nous avons vécu l'enfer des livraisons ratées, des clients perdus et des compensations répétées. Chaque
                jour, nous perdions nos revenus parce que le dernier kilomètre ne suivait pas. Jusqu'à 40 % de nos
                revenus partaient en fumée.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Alors, nous avons décidé d'arrêter de subir. Daredare est une réponse professionnelle à un problème vécu
                par tous : livrer vite, bien, et surtout de manière fiable.
              </p>
              <p className="text-lg text-gray-700 mb-8">
                Aujourd'hui, Daredare est une entreprise de logistique urbaine spécialisée dans la livraison du dernier
                kilomètre. Nous mettons la technologie, les motos, vélos et l'humain au service de l'efficacité. Notre
                ambition est simple : réparer la logistique en ville, une course après l'autre.
              </p>

              <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-[#FBC140]">
                <h3 className="text-xl font-bold text-[#2B015F] mb-4">Chiffres clés :</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-[#FBC140] rounded-full mr-3"></div>
                    <span className="text-gray-700">
                      <strong>2023</strong> – Lancement MVP
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-[#FBC140] rounded-full mr-3"></div>
                    <span className="text-gray-700">Partenaire de la poste RDC</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-[#FBC140] rounded-full mr-3"></div>
                    <span className="text-gray-700">
                      <strong>+500</strong> clients e-commerce servis
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Image
                src="/vibrant-african-startup.png"
                alt="L'équipe Daredare en réunion"
                width={600}
                height={500}
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Nos Valeurs Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2B015F] mb-4">Nos Valeurs</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Les principes qui nous définissent et orientent chaque décision, chaque course, chaque relation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-[#FBC140] rounded-full flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-[#2B015F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Diligence</h3>
                <p className="text-gray-600">
                  Nous exécutons chaque course avec soin, rigueur et sens du devoir. Être diligent, c'est livrer à
                  temps, respecter nos engagements et traiter chaque demande avec sérieux, quelle que soit sa taille. La
                  confiance se mérite dans les détails.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-[#FBC140] rounded-full flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-[#2B015F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Adaptabilité</h3>
                <p className="text-gray-600">
                  Nous sommes nés dans un contexte urbain complexe. Chaque jour, nous nous ajustons aux réalités du
                  terrain, aux contraintes des clients et aux imprévus de la ville. L'agilité, c'est notre quotidien.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-[#FBC140] rounded-full flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-[#2B015F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Responsabilité</h3>
                <p className="text-gray-600">
                  Nous prenons nos responsabilités : envers nos clients, envers nos livreurs, et envers la ville. Chaque
                  course est un engagement, et chaque erreur est une occasion d'apprendre et de s'améliorer.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Notre Équipe Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2B015F] mb-4">Notre Équipe</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Rencontrez les personnes engagées qui font de Daredare une entreprise ambitieuse, enracinée dans le
              terrain et tournée vers l'avenir.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Membre d'équipe 1 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="relative flex-shrink-0 w-40 h-40 overflow-hidden rounded-full mb-6 ring-4 ring-[#FBC140]/20">
                    <Image
                      src="/confident-african-entrepreneur.png"
                      alt="Hénock Mukendi - Co-fondateur & CEO"
                      width={160}
                      height={160}
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Hénock Mukendi</h3>
                  <p className="text-[#FBC140] font-semibold text-lg mb-4">Co-fondateur & CEO</p>
                  <p className="text-gray-600 leading-relaxed">
                    Entrepreneur et passionné de logistique, Hénock a lancé Daredare après avoir expérimenté les limites
                    des services de livraison en tant qu'e-commerçant. Ancien incubé d'Orange Corners, il pilote la
                    vision stratégique et opérationnelle de l'entreprise, avec pour mission de structurer une nouvelle
                    manière de circuler en ville.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Membre d'équipe 2 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="relative flex-shrink-0 w-40 h-40 overflow-hidden rounded-full mb-6 ring-4 ring-[#FBC140]/20">
                    <Image
                      src="/images/design-mode/mack_kaputo_CTO.jpg"
                      alt="Mack Kaputo - Co-fondateur & CTO"
                      width={160}
                      height={160}
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Mack Kaputo</h3>
                  <p className="text-[#FBC140] font-semibold text-lg mb-4">Co-fondateur & CTO</p>
                  <p className="text-gray-600 leading-relaxed">
                    Fort de son expertise technique, Mack conçoit et orchestre des solutions logicielles robustes chez
                    Daredare. Il définit l'architecture des systèmes, supervise leur intégration, et veille à ce que la
                    technologie serve pleinement les objectifs stratégiques de l'entreprise.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Nos Réussites Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2B015F] mb-4">Nos Réussites</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Quelques chiffres qui témoignent de notre impact et de notre croissance
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-[#2B015F] mb-2">+40K</div>
              <p className="text-xl text-gray-600">LIVRAISONS EFFECTUÉES</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-[#2B015F] mb-2">+80%</div>
              <p className="text-xl text-gray-600">DE SATISFACTIONS</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-[#2B015F] mb-2">+500</div>
              <p className="text-xl text-gray-600">clients e-commerce servis</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#2B015F] text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6">Rejoignez l'aventure Daredare</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Que vous soyez client, partenaire ou candidat, nous serions ravis de vous compter parmi nous
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-[#FBC140] text-black hover:bg-[#FBC140]/90">
                Créer un compte
              </Button>
            </Link>
            <Link href="/careers">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 bg-transparent">
                Nous rejoindre <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
