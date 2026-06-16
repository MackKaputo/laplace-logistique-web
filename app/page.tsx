"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Package, ArrowRight, CheckCircle, Zap, BarChart3, Route, Shield, Truck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import Footer from "@/components/footer"

export default function Home() {
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false)


  return (
    <div className="flex flex-col">
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D1F16] via-[#3B2A1F] to-[#1a1009] z-0" />

        {/* Animated grid overlay */}
        <div className="absolute inset-0 z-0 opacity-[0.07]"
          style={{ backgroundImage: "linear-gradient(#22D3EE 1px,transparent 1px),linear-gradient(90deg,#22D3EE 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/6 w-[28rem] h-[28rem] bg-[#22D3EE]/10 rounded-full blur-3xl z-0 animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-[#3B82F6]/10 rounded-full blur-3xl z-0 animate-float delay-1500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-[#B08968]/5 rounded-full blur-3xl z-0 animate-float-slow delay-1000" />

        {/* Speed streaks */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[28%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/60 to-transparent animate-streak" />
          <div className="absolute top-[55%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6]/40 to-transparent animate-streak delay-1200" />
          <div className="absolute top-[72%] left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#22D3EE]/30 to-transparent animate-streak delay-2000" />
        </div>

        <div className="container relative z-20 py-24">
          <div className="flex flex-col items-center text-center">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/30 mb-8 animate-fade-up animate-pulse-glow-ring">
              <Zap className="h-4 w-4 text-[#22D3EE]" />
              <span className="text-[#22D3EE] text-sm font-medium tracking-wide">Systèmes dynamiques · Optimisation · Précision</span>
            </div>

            {/* Title */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-none text-white max-w-5xl animate-fade-up delay-100"
              style={{ textShadow: "0 0 60px rgba(34,211,238,0.18), 0 0 120px rgba(34,211,238,0.08)" }}>
              Laplace
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] via-[#B08968] to-[#22D3EE]"
                style={{ backgroundSize: "200% auto", animation: "gradient-pan 4s linear infinite" }}>
                Logistique
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-2xl md:text-3xl text-[#B08968] font-light mb-5 max-w-3xl animate-fade-up delay-200">
              La logistique e-commerce modélisée comme un système
            </p>
            <p className="text-lg md:text-xl mb-14 text-white/60 max-w-2xl animate-fade-up delay-300">
              Transformez chaque commande en un flux optimisé. Analyse, anticipation et exécution
              avec la précision des systèmes mathématiques.
            </p>

            {/* Single stat card — centered, wider */}
            <div className="animate-fade-up delay-400 w-full max-w-sm">
              <div className="relative group cursor-default">
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[#22D3EE]/40 to-[#3B82F6]/20 blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-[#4A3426]/50 backdrop-blur-md rounded-2xl p-8 border border-[#22D3EE]/20 text-white text-center animate-border-glow">
                  <div className="w-14 h-14 bg-[#22D3EE]/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                    <BarChart3 className="h-7 w-7 text-[#22D3EE]" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">Données actionnables</h3>
                  <p className="text-white/60 text-sm">Analytics et rapports pour optimiser vos opérations en temps réel</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

     
      <Footer />
    </div>
  )
}
