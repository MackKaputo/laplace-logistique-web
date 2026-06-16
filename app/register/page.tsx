"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2 } from "lucide-react"
import type { UserRole } from "@/types/auth"
import Image from "next/image"
import { useRouter } from "next/navigation"

function transformPhoneNumber(phoneNumber: string): string {
  if (phoneNumber.startsWith("0")) {
    return "+243" + phoneNumber.slice(1)
  }
  return phoneNumber
}

export default function RegisterPage() {
  const [first_name, setFirstName] = useState("")
  const [last_name, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone_number, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<UserRole>("enterprise")
  const [organizationName, setOrganizationName] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  const { register, isLoading, error, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard if user is already logged in
    if (!isLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    // Client-side validation for password confirmation
    if (password !== confirmPassword) {
      setValidationError("Les mots de passe ne correspondent pas")
      return
    }

    if (password.length < 6) {
      setValidationError("Le mot de passe doit contenir au moins 6 caractères")
      return
    }

    // Clean and transform phone number
    const cleanedPhoneNumber = phone_number.replace(/\s+/g, "") // Remove all spaces
    const transformedPhoneNumber = transformPhoneNumber(cleanedPhoneNumber)

    // Call register with the updated DTO structure
    await register({
      first_name,
      last_name,
      email,
      phone_number: transformedPhoneNumber, // Use the transformed phone number
      password,
      account_type: role, // Using role state but sending as account_type
      organizationName: role !== "personal" ? organizationName : undefined,
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <Image
              src="/images/design-mode/daredare_logo.png"
              alt="Daredare Logo"
              width={60}
              height={60}
              className="mx-auto rounded-md"
            />
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-[#2B015F]">Créer un compte</h2>
          <p className="mt-2 text-gray-600">Rejoignez Daredare pour gérer vos livraisons</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inscription</CardTitle>
            <CardDescription>Remplissez le formulaire pour créer votre compte</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    placeholder="Votre prénom"
                    value={first_name}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2 flex-1">
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    placeholder="Votre nom"
                    value={last_name}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Numéro de téléphone</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  placeholder="+243 XX XXX XXXX"
                  value={phone_number}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Type de compte</Label>
                <RadioGroup
                  value={role}
                  onValueChange={(value) => setRole(value as UserRole)}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="enterprise" id="enterprise" />
                    <Label htmlFor="enterprise" className="cursor-pointer">
                      Entreprise
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="personal" id="personal" />
                    <Label htmlFor="personal" className="cursor-pointer">
                      Personnel
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {role !== "personal" && (
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Nom de l'entreprise</Label>
                  <Input
                    id="organizationName"
                    placeholder="Nom de votre entreprise"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required={role !== "personal"}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-[#2B015F] hover:bg-[#2B015F]/90" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Créer un compte
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              Vous avez déjà un compte?{" "}
              <Link href="/login" className="font-medium text-[#2B015F] hover:underline">
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
