"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, X, User, LogOut, Settings } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-[#3B2A1F] to-[#4A3426] rounded-lg flex items-center justify-center border border-[#B08968]/30">
            <span className="text-[#22D3EE] font-bold text-lg">L</span>
          </div>
          <span className="font-bold text-xl text-[#3B2A1F]">Laplace</span>
        </Link>


        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost">Tableau de bord</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                    <User className="h-4 w-4" />
                    <span>{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="h-4 w-4 mr-2" />
                      <span>Profil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      <span>Parametres</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Se connecter</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button type="button" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-4 py-3">
            <div className="pt-4 pb-3 border-t border-gray-200">
              {user ? (
                <>
                  <div className="flex items-center px-3 py-2">
                    <div className="bg-gray-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <div className="space-y-1 pl-3">
                    <Link
                      href="/dashboard"
                      className="block rounded-md px-3 py-2 text-base font-medium hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Tableau de bord
                    </Link>
                    <Link
                      href="/profile"
                      className="block rounded-md px-3 py-2 text-base font-medium hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profil
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="block rounded-md px-3 py-2 text-base font-medium hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Parametres
                    </Link>

                    <button
                      className="w-full text-left block rounded-md px-3 py-2 text-base font-medium hover:bg-gray-100"
                      onClick={() => {
                        logout()
                        setMobileMenuOpen(false)
                      }}
                    >
                      Déconnexion
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block rounded-md px-3 py-2 text-base font-medium hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Se connecter
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
