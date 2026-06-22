"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, X, User, LogOut, Settings, Zap } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const showDashboardLink = user && (pathname === "/" || pathname?.startsWith("/dashboard"))

  return (
    <>
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl">
        <div className="relative rounded-2xl border border-[#B08968]/15 bg-[#1a1009]/80 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Top cyan highlight */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/60 to-transparent" />

          <div className="relative flex h-16 items-center justify-between px-4 md:px-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#22D3EE]/20 to-[#3B82F6]/10 border border-[#22D3EE]/30 flex items-center justify-center group-hover:border-[#22D3EE]/60 transition-colors">
                <span className="text-[#22D3EE] font-black text-lg">L</span>
              </div>
              <span className="font-bold text-lg text-white tracking-tight">Laplace</span>
            </Link>

            {/* Desktop center links */}
            <nav className="hidden md:flex items-center gap-1">
              {showDashboardLink && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[#B08968]/80 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                >
                  <Zap className="h-4 w-4" />
                  Tableau de bord
                </Link>
              )}
            </nav>

            {/* Desktop auth */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full border border-[#B08968]/20 bg-[#4A3426]/40 text-white hover:border-[#22D3EE]/40 hover:bg-[#22D3EE]/10 transition-all duration-200">
                      <div className="w-7 h-7 rounded-full bg-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE]">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{user.name}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#1a1009] border-[#B08968]/20 text-white">
                    <DropdownMenuLabel className="text-[#B08968]">Mon compte</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[#B08968]/20" />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="hover:bg-white/5 cursor-pointer">
                        <User className="h-4 w-4 mr-2 text-[#22D3EE]" />
                        <span>Profil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="hover:bg-white/5 cursor-pointer">
                        <Settings className="h-4 w-4 mr-2 text-[#22D3EE]" />
                        <span>Parametres</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#B08968]/20" />
                    <DropdownMenuItem onClick={() => logout()} className="hover:bg-white/5 cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2 text-[#22D3EE]" />
                      <span>Déconnexion</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button className="rounded-full bg-[#22D3EE] text-[#111827] hover:bg-[#22D3EE]/90 font-semibold px-5 shadow-lg shadow-[#22D3EE]/20 hover:shadow-[#22D3EE]/40 transition-all duration-200">
                    Se connecter
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-[#B08968]/20 text-[#B08968] hover:text-white hover:border-[#22D3EE]/40 hover:bg-[#22D3EE]/10 transition-all duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile slide-out menu */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[min(80vw,320px)] bg-[#1a1009] border-l border-[#B08968]/20 shadow-2xl shadow-black/50 transform transition-transform duration-300 ease-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-[#B08968]/10">
          <span className="font-bold text-white tracking-tight">Menu</span>
          <button
            type="button"
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-[#B08968]/20 text-[#B08968] hover:text-white hover:border-[#22D3EE]/40 hover:bg-[#22D3EE]/10 transition-all duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Mobile nav links */}
          <nav className="space-y-1">
            {showDashboardLink && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#B08968]/80 hover:text-white hover:bg-white/5 transition-all duration-200"
              >
                <span className="text-[#22D3EE]"><Zap className="h-4 w-4" /></span>
                Tableau de bord
              </Link>
            )}
          </nav>

          <div className="h-px bg-[#B08968]/10" />

          {/* Mobile auth section */}
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-3">
                <div className="w-10 h-10 rounded-full bg-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE]">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{user.name}</p>
                  <p className="text-[#B08968]/60 text-xs">{user.email}</p>
                </div>
              </div>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#B08968]/80 hover:text-white hover:bg-white/5 transition-all duration-200"
              >
                <Zap className="h-4 w-4 text-[#22D3EE]" />
                Tableau de bord
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#B08968]/80 hover:text-white hover:bg-white/5 transition-all duration-200"
              >
                <User className="h-4 w-4 text-[#22D3EE]" />
                Profil
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#B08968]/80 hover:text-white hover:bg-white/5 transition-all duration-200"
              >
                <Settings className="h-4 w-4 text-[#22D3EE]" />
                Parametres
              </Link>
              <button
                onClick={() => {
                  logout()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 text-left"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#22D3EE] text-[#111827] font-bold py-3 hover:bg-[#22D3EE]/90 transition-all duration-200"
            >
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
