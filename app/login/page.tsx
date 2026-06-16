"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { login, isLoading, error, user } = useAuth()
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Check if user was redirected from successful registration
    if (searchParams.get("registered") === "true") {
      setRegistrationSuccess(true)
    }
  }, [searchParams])

  useEffect(() => {
    // Redirect to dashboard if user is already logged in
    if (!isLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(email, password)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#2D1F16] via-[#3B2A1F] to-[#1a1009]">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#22D3EE 1px,transparent 1px),linear-gradient(90deg,#22D3EE 1px,transparent 1px)", backgroundSize: "60px 60px" }}
      />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-[#22D3EE]/8 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/6 w-72 h-72 bg-[#3B82F6]/8 rounded-full blur-3xl pointer-events-none animate-float delay-1500" />

      {/* Speed streaks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[30%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/30 to-transparent animate-streak" />
        <div className="absolute top-[70%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6]/20 to-transparent animate-streak delay-1200" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 py-12 animate-fade-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="w-11 h-11 bg-gradient-to-br from-[#22D3EE]/20 to-[#3B82F6]/10 rounded-xl flex items-center justify-center border border-[#22D3EE]/30 group-hover:border-[#22D3EE]/60 transition-colors duration-200">
              <span className="text-[#22D3EE] font-black text-xl">L</span>
            </div>
            <span className="text-white font-black text-xl tracking-tight">Laplace Logistique</span>
          </Link>
          <h1 className="text-3xl font-black text-white mb-2">Connexion</h1>
          <p className="text-[#B08968]/70 text-sm">Accédez à votre tableau de bord</p>
        </div>

        {/* Card */}
        <div className="relative">
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[#22D3EE]/20 to-[#3B82F6]/10 blur-sm" />
          <div className="relative bg-[#2D1F16]/80 backdrop-blur-md rounded-2xl border border-[#22D3EE]/15 p-8">

            {registrationSuccess && (
              <div className="mb-5 flex items-start gap-3 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/25 px-4 py-3">
                <CheckCircle className="h-4 w-4 text-[#22D3EE] mt-0.5 shrink-0" />
                <p className="text-[#22D3EE] text-sm">Compte créé avec succès. Vous pouvez maintenant vous connecter.</p>
              </div>
            )}

            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-bold tracking-[0.1em] uppercase text-[#B08968]/80">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#1a1009]/60 border border-[#B08968]/20 focus:border-[#22D3EE]/50 focus:ring-0 focus:outline-none rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm transition-colors duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-bold tracking-[0.1em] uppercase text-[#B08968]/80">
                    Mot de passe
                  </label>
                  <Link href="/forgot-password" className="text-xs text-[#22D3EE]/70 hover:text-[#22D3EE] transition-colors duration-200">
                    Oublié ?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#1a1009]/60 border border-[#B08968]/20 focus:border-[#22D3EE]/50 focus:ring-0 focus:outline-none rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm transition-colors duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#22D3EE] hover:bg-[#22D3EE]/90 disabled:opacity-60 disabled:cursor-not-allowed text-[#111827] font-bold rounded-xl px-4 py-3 text-sm transition-all duration-200 shadow-lg shadow-[#22D3EE]/20 hover:shadow-[#22D3EE]/35 flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Se connecter
              </button>
            </form>

          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[#B08968]/50 text-xs mt-6">
          &copy; {new Date().getFullYear()} Laplace Logistique
        </p>

      </div>
    </div>
  )
}
