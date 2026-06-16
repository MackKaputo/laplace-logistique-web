"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Eye, EyeOff } from "lucide-react"

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
      router.push("/backoffice/deliveries")
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
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B015F] mx-auto"></div>
          <p className="mt-2 text-gray-600">Redirection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-[#2B015F] rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#2B015F]">Accès Backoffice</CardTitle>
          <CardDescription>Entrez le mot de passe pour accéder au tableau de bord administrateur</CardDescription>
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
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <Button type="submit" className="w-full bg-[#2B015F] hover:bg-[#2B015F]/90">
              Accéder
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
