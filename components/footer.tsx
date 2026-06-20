"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Facebook, Instagram, Linkedin, MapPin, Mail, Phone } from "lucide-react"

export default function Footer() {

  const [showFooter, setShowFooter] = useState(true)

  useEffect(() => {
    if (window.location.pathname.includes("dashboard")) {
      setShowFooter(false)
    }
  }, [])

  if (!showFooter) return null
  
  return (
    <footer className="relative overflow-hidden border-t border-[#22D3EE]/10 bg-[#0f0a07]">
      {/* Subtle top aurora */}
      <div className="absolute -top-32 left-0 right-0 h-64 bg-gradient-to-b from-[#22D3EE]/10 to-transparent opacity-50 pointer-events-none" />

      {/* Corner glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#22D3EE]/5 rounded-full blur-3xl pointer-events-none -translate-x-1/3 translate-y-1/3" />

      <div className="container relative z-10">
        {/* Top brand strip */}
        <div className="py-12 md:py-16 text-center border-b border-[#B08968]/10">
          <div className="inline-flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#22D3EE]/20 to-[#3B82F6]/10 border border-[#22D3EE]/30 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(34,211,238,0.25)]">
              <span className="text-[#22D3EE] font-black text-2xl">L</span>
            </div>
            <span className="text-2xl md:text-3xl font-black tracking-tight text-white">Laplace Logistique</span>
          </div>
          <p className="max-w-xl mx-auto text-[#B08968]/80 text-sm md:text-base leading-relaxed">
            La logistique e-commerce réinventée par la précision des systèmes mathématiques.
            Moins de friction, plus de livraisons réussies.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {[
              { icon: <Facebook className="h-5 w-5" />, label: "Facebook" },
              { icon: <Instagram className="h-5 w-5" />, label: "Instagram" },
              { icon: <Linkedin className="h-5 w-5" />, label: "LinkedIn" },
            ].map((s) => (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                className="w-10 h-10 rounded-full bg-[#4A3426]/40 border border-[#B08968]/15 flex items-center justify-center text-[#B08968] hover:text-[#22D3EE] hover:border-[#22D3EE]/40 hover:bg-[#22D3EE]/10 hover:scale-105 transition-all duration-200"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Middle link grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-12 md:py-16">
          {/* Contact card */}
          <div className="md:col-span-5 relative">
            <div className="absolute inset-y-0 left-0 w-1 rounded-full bg-gradient-to-b from-[#22D3EE] to-[#3B82F6]/50" />
            <div className="pl-6">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#22D3EE] mb-5">Contactez-nous</h3>
              <div className="space-y-4">
                <a href="#" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full bg-[#4A3426]/40 border border-[#B08968]/15 flex items-center justify-center group-hover:border-[#22D3EE]/40 transition-colors">
                    <MapPin className="h-4 w-4 text-[#22D3EE]" />
                  </div>
                  <div>
                    <p className="text-[#B08968]/50 text-xs uppercase tracking-wider">Adresse</p>
                    <p className="text-white text-sm font-medium">Kinshasa, RDC</p>
                  </div>
                </a>
                <a href="tel:+243836885324" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full bg-[#4A3426]/40 border border-[#B08968]/15 flex items-center justify-center group-hover:border-[#22D3EE]/40 transition-colors">
                    <Phone className="h-4 w-4 text-[#22D3EE]" />
                  </div>
                  <div>
                    <p className="text-[#B08968]/50 text-xs uppercase tracking-wider">Téléphone</p>
                    <p className="text-white text-sm font-medium">+243 836 885 324</p>
                  </div>
                </a>
                <a href="mailto:contact@laplacelogistique.com" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full bg-[#4A3426]/40 border border-[#B08968]/15 flex items-center justify-center group-hover:border-[#22D3EE]/40 transition-colors">
                    <Mail className="h-4 w-4 text-[#22D3EE]" />
                  </div>
                  <div>
                    <p className="text-[#B08968]/50 text-xs uppercase tracking-wider">Email</p>
                    <p className="text-white text-sm font-medium">contact@laplacelogistique.com</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <div className="md:col-span-3 md:col-start-7">
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#22D3EE] mb-5">Navigation</h3>
            <ul className="space-y-2">
              {[
                { label: "Accueil", href: "/" },
                { label: "Tableau de bord", href: "/dashboard" },
                { label: "Suivre un colis", href: "/tracking" },
                { label: "Se connecter", href: "/login" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#B08968]/80 hover:text-[#22D3EE] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="md:col-span-3">
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#22D3EE] mb-5">Services</h3>
            <ul className="space-y-2">
              {[
                "Livraison express",
                "Suivi en temps réel",
                "Paiement à la livraison",
                "Fulfillment e-commerce",
              ].map((service) => (
                <li key={service} className="text-sm text-[#B08968]/80">
                  {service}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#B08968]/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#B08968]/50 text-xs text-center sm:text-left">
            &copy; {new Date().getFullYear()} Laplace Logistique. Tous droits réservés.
          </p>
          <div className="flex items-center gap-2 bg-[#22D3EE]/10 border border-[#22D3EE]/20 rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse" />
            <span className="text-[#22D3EE]/80 text-xs font-medium tracking-wide">Systèmes opérationnels</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
