import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import { Suspense } from "react"

import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import { AuthProvider } from "@/contexts/auth-context"
import { AnalyticsProvider } from "@/contexts/analytics-context"
import { GA_TRACKING_ID } from "@/lib/gtag"

const inter = Inter({ subsets: ["latin"] })

const siteUrl = "https://www.laplacelogistique.com"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Laplace Logistique — Livraison & Logistique e-commerce à Kinshasa",
    template: "%s | Laplace Logistique",
  },
  description:
    "Laplace Logistique est une plateforme de livraison e-commerce à Kinshasa, RDC. Livraison express, suivi en temps réel, paiement à la livraison et fulfillment pour vendeurs en ligne. Optimisé par algorithmes, précis et fiable.",
  keywords: [
    "livraison Kinshasa",
    "logistique e-commerce RDC",
    "livraison Congo",
    "suivi colis Kinshasa",
    "paiement à la livraison",
    "fulfillment Kinshasa",
    "livraison express RDC",
    "plateforme logistique Afrique",
    "Laplace Logistique",
    "vendeur en ligne livraison",
    "gestion colis RDC",
    "last mile delivery Kinshasa",
  ],
  authors: [{ name: "Laplace Logistique", url: siteUrl }],
  creator: "Laplace Logistique",
  publisher: "Laplace Logistique",
  category: "Logistics & Delivery",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
    languages: { "fr-CD": siteUrl },
  },
  openGraph: {
    type: "website",
    locale: "fr_CD",
    url: siteUrl,
    siteName: "Laplace Logistique",
    title: "Laplace Logistique — Livraison & Logistique e-commerce à Kinshasa",
    description:
      "Plateforme de livraison intelligente pour les vendeurs en ligne à Kinshasa. Suivi temps réel, paiement à la livraison, fulfillment et analytics. La logistique RDC modélisée comme un système.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Laplace Logistique — Plateforme de livraison e-commerce à Kinshasa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Laplace Logistique — Livraison e-commerce à Kinshasa",
    description:
      "Livraison express, suivi en temps réel et paiement à la livraison pour vendeurs en ligne à Kinshasa, RDC.",
    images: ["/images/og-image.png"],
    creator: "@laplacelogistique",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  verification: {
    google: "",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Google Analytics */}
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`} strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Laplace Logistique",
                url: "https://www.laplacelogistique.com",
                logo: "https://www.laplacelogistique.com/apple-icon.png",
                description:
                  "Laplace Logistique est une plateforme de livraison e-commerce à Kinshasa, RDC. Livraison express, suivi en temps réel, paiement à la livraison et fulfillment pour vendeurs en ligne.",
                address: {
                  "@type": "PostalAddress",
                  addressLocality: "Kinshasa",
                  addressCountry: "CD",
                },
                contactPoint: {
                  "@type": "ContactPoint",
                  telephone: "+243-836-885-324",
                  contactType: "customer service",
                  availableLanguage: ["French"],
                },
                sameAs: [],
              },
              {
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                "@id": "https://www.laplacelogistique.com",
                name: "Laplace Logistique",
                description:
                  "Plateforme de livraison intelligente pour les vendeurs en ligne à Kinshasa. Suivi temps réel, paiement à la livraison, fulfillment et analytics.",
                url: "https://www.laplacelogistique.com",
                telephone: "+243-836-885-324",
                address: {
                  "@type": "PostalAddress",
                  addressLocality: "Kinshasa",
                  addressCountry: "CD",
                },
                areaServed: {
                  "@type": "City",
                  name: "Kinshasa",
                },
                serviceType: [
                  "Livraison express",
                  "Fulfillment e-commerce",
                  "Suivi de colis",
                  "Paiement à la livraison",
                  "Logistique last-mile",
                ],
                priceRange: "$$",
                openingHoursSpecification: {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                  opens: "08:00",
                  closes: "20:00",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Laplace Logistique",
                url: "https://www.laplacelogistique.com",
                description:
                  "Plateforme de livraison e-commerce à Kinshasa. La logistique RDC modélisée comme un système mathématique.",
                inLanguage: "fr-CD",
                publisher: {
                  "@type": "Organization",
                  name: "Laplace Logistique",
                },
              },
            ]),
          }}
        />

        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <AnalyticsProvider>
              <Suspense fallback={<div>Loading...</div>}>
                <div className="flex min-h-screen flex-col">
                  <Navbar />
                  <main className="flex-1">{children}</main>
                </div>
              </Suspense>
            </AnalyticsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
