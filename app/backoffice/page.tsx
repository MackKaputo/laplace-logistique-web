"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"

export default function BackofficePage() {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if already authenticated
    const isAuth = sessionStorage.getItem("backoffice_auth")
    if (isAuth === "true") {
      setIsAuthenticated(true)
      router.push("/backoffice/home")
    }
  }, [router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (password === "@management#") {
      sessionStorage.setItem("backoffice_auth", "true")
      sessionStorage.setItem("backoffice_role", "management")
      setIsAuthenticated(true)
      window.location.reload()
    } else if (password === "#operations@daredare") {
      sessionStorage.setItem("backoffice_auth", "true")
      sessionStorage.setItem("backoffice_role", "operations")
      setIsAuthenticated(true)
      window.location.reload()
    } else {
      setError("Mot de passe incorrect")
      setPassword("")
    }
  }

  if (isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1a1009]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22D3EE] mx-auto"></div>
          <p className="mt-2 text-[#B08968]">Redirection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#1a1009] via-[#2D1F16] to-[#1a1009]">
      <Card className="w-full max-w-md bg-[#1a1009]/80 border-[#B08968]/10 backdrop-blur text-white shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-lg bg-gradient-to-br from-[#22D3EE]/20 to-[#3B82F6]/10 border border-[#22D3EE]/30 flex items-center justify-center">
            <span className="text-[#22D3EE] font-black text-xl">L</span>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">Accès Backoffice</CardTitle>
            <CardDescription className="text-[#B08968]">
              Entrez le mot de passe pour accéder au tableau de bord administrateur
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError("")
                }}
                className="pr-10 bg-[#2D1F16]/50 border-[#B08968]/20 text-white placeholder:text-[#B08968]/50 focus-visible:ring-[#22D3EE]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#B08968] hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-[#22D3EE] text-[#111827] hover:bg-[#22D3EE]/90 font-semibold"
            >
              Accéder
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
