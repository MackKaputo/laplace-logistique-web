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
    <footer className="relative bg-gradient-to-br from-[#1a1009] via-[#2D1F16] to-[#1a1009] text-white overflow-hidden">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#22D3EE 1px,transparent 1px),linear-gradient(90deg,#22D3EE 1px,transparent 1px)", backgroundSize: "60px 60px" }}
      />
      {/* Top glow line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/40 to-transparent" />
      {/* Ambient orb */}
      <div className="absolute -bottom-20 left-1/4 w-80 h-80 bg-[#22D3EE]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative z-10 py-14 md:py-18">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start mb-12">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-[#22D3EE]/20 to-[#3B82F6]/10 rounded-lg flex items-center justify-center border border-[#22D3EE]/30">
                <span className="text-[#22D3EE] font-black text-lg">L</span>
              </div>
              <span className="text-xl font-black tracking-tight">Laplace Logistique</span>
            </div>
            <p className="text-[#B08968]/80 text-sm leading-relaxed max-w-sm mb-6">
              La logistique e-commerce réinventée par la précision des systèmes mathématiques.
              Moins de friction, plus de précision.
            </p>
            <div className="flex gap-3">
              {[
                { icon: <Facebook className="h-4 w-4" />, label: "Facebook" },
                { icon: <Instagram className="h-4 w-4" />, label: "Instagram" },
                { icon: <Linkedin className="h-4 w-4" />, label: "LinkedIn" },
              ].map((s) => (
                <Link
                  key={s.label}
                  href="#"
                  className="w-8 h-8 rounded-lg bg-[#4A3426]/50 border border-[#B08968]/20 flex items-center justify-center text-[#B08968] hover:text-[#22D3EE] hover:border-[#22D3EE]/40 hover:bg-[#22D3EE]/10 transition-all duration-200"
                >
                  {s.icon}
                  <span className="sr-only">{s.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#22D3EE] mb-5">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[#B08968]/80 text-sm">
                <MapPin className="h-4 w-4 text-[#22D3EE] shrink-0" />
                <span>Kinshasa</span>
              </div>
              <div className="flex items-center gap-3 text-[#B08968]/80 text-sm">
                <Phone className="h-4 w-4 text-[#22D3EE] shrink-0" />
                <span>+243 836 885 324</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#22D3EE]/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[#B08968]/50 text-xs">
            &copy; {new Date().getFullYear()} Laplace Logistique. Tous droits réservés.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
            <span className="text-[#22D3EE]/60 text-xs font-medium tracking-wide">Systèmes opérationnels</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
