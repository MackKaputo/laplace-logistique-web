"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  Package,
  Truck,
  Users,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const sidebarItems = [
  {
    title: "Accueil",
    href: "/backoffice/home",
    icon: Home,
    allowedRoles: ["management", "operations"],
  },
  {
    title: "Produits",
    href: "/backoffice/products",
    icon: Package,
    allowedRoles: ["management", "operations"],
  },
  {
    title: "Livreurs",
    href: "/backoffice/deliverers",
    icon: Truck,
    allowedRoles: ["management", "operations"],
  },
  {
    title: "Closings",
    href: "/backoffice/closings",
    icon: Users,
    allowedRoles: ["management", "operations"],
  },
]

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = sessionStorage.getItem("backoffice_auth")
      const role = sessionStorage.getItem("backoffice_role")
      if (isAuth === "true") {
        setIsAuthenticated(true)
        setUserRole(role)
      }
      setIsLoading(false)
    }

    checkAuth()

    const collapsed = localStorage.getItem("backoffice_sidebar_collapsed")
    if (collapsed === "true") {
      setSidebarCollapsed(true)
    }
  }, [])

  const toggleCollapse = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem("backoffice_sidebar_collapsed", String(newState))
  }

  const handleLogout = () => {
    sessionStorage.removeItem("backoffice_auth")
    sessionStorage.removeItem("backoffice_role")
    router.push("/backoffice")
  }

  const visibleSidebarItems = sidebarItems.filter((item) => userRole && item.allowedRoles.includes(userRole))

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1a1009]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22D3EE]"></div>
      </div>
    )
  }

  if (pathname === "/backoffice") {
    return <>{children}</>
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1a1009]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22D3EE]"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#f8f6f4]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-gradient-to-b from-[#1a1009] to-[#2D1F16] shadow-2xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "lg:w-20" : "lg:w-64",
          "w-64"
        )}
      >
        <div className="flex items-center h-16 px-5 border-b border-[#B08968]/10">
          {!sidebarCollapsed ? (
            <Link href="/backoffice/home" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#22D3EE]/20 to-[#3B82F6]/10 border border-[#22D3EE]/30 flex items-center justify-center">
                <span className="text-[#22D3EE] font-black text-lg">L</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold leading-tight">Laplace</span>
                <span className="text-[#B08968] text-xs">Backoffice</span>
              </div>
            </Link>
          ) : (
            <div className="flex items-center justify-center w-full">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#22D3EE]/20 to-[#3B82F6]/10 border border-[#22D3EE]/30 flex items-center justify-center">
                <span className="text-[#22D3EE] font-black text-lg">L</span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-white/60 hover:text-white hover:bg-white/5 lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleSidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-[#22D3EE]/10 text-[#22D3EE] border-l-2 border-[#22D3EE]"
                    : "text-[#B08968]/80 hover:text-white hover:bg-white/5",
                  sidebarCollapsed && "justify-center"
                )}
                title={sidebarCollapsed ? item.title : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && item.title}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-[#B08968]/10 space-y-1">
          <Button
            onClick={toggleCollapse}
            variant="ghost"
            className={cn(
              "hidden lg:flex w-full text-[#B08968] hover:text-white hover:bg-white/5",
              sidebarCollapsed ? "justify-center" : "justify-start"
            )}
            title={sidebarCollapsed ? "Étendre" : "Réduire"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-3" />
                Réduire
              </>
            )}
          </Button>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className={cn(
              "w-full text-[#B08968] hover:text-white hover:bg-white/5",
              sidebarCollapsed ? "justify-center" : "justify-start"
            )}
            title={sidebarCollapsed ? "Déconnexion" : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!sidebarCollapsed && <span className="ml-3">Déconnexion</span>}
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-[#1a1009]/95 backdrop-blur border-b border-[#B08968]/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="text-white/70 hover:text-white hover:bg-white/5 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-[#B08968]">Administration</span>
            {userRole && (
              <Badge className="bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20">
                {userRole === "management" ? "Gestion" : "Opérations"}
              </Badge>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
