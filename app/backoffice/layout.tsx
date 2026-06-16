"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  DollarSign,
  Truck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const sidebarItems = [
  {
    title: "Livraisons",
    href: "/backoffice/deliveries",
    icon: Package,
    allowedRoles: ["management", "operations"],
  },
  {
    title: "Dispatch",
    href: "/backoffice/dispatch",
    icon: Truck,
    allowedRoles: ["management", "operations"],
  },
  {
    title: "Suivi Livreurs",
    href: "/backoffice/deliverer-tracking",
    icon: Users,
    allowedRoles: ["management", "operations"],
  },
  {
    title: "Pré-Livraisons",
    href: "/backoffice/pre-deliveries",
    icon: Package,
    allowedRoles: ["management", "operations"],
  },
  {
    title: "Utilisateurs",
    href: "/backoffice/users",
    icon: Users,
    allowedRoles: ["management", "operations"],
  },
  {
    title: "Rapports Clients",
    href: "/backoffice/client-reports",
    icon: BarChart3,
    allowedRoles: ["management", "operations"],
  },
  {
    title: "Statistiques",
    href: "/backoffice/stats",
    icon: BarChart3,
    allowedRoles: ["management"],
  },
  {
    title: "Finance",
    href: "/backoffice/finance",
    icon: DollarSign,
    allowedRoles: ["management"],
  },
  {
    title: "Règlements",
    href: "/backoffice/settlements",
    icon: DollarSign,
    allowedRoles: ["management", "operations"],
  },
  {
    title: "Paramètres",
    href: "/backoffice/settings",
    icon: Settings,
    allowedRoles: ["management"],
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
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B015F]"></div>
      </div>
    )
  }

  if (pathname === "/backoffice") {
    return <>{children}</>
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B015F]"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div
        className={`
        fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        ${sidebarCollapsed ? "lg:w-20" : "lg:w-64"}
        w-64
      `}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#2B015F]">Backoffice</h1>
              {userRole && (
                <Badge variant={userRole === "management" ? "default" : "secondary"} className="text-xs">
                  {userRole === "management" ? "Gestion" : "Opérations"}
                </Badge>
              )}
            </div>
          )}
          {sidebarCollapsed && (
            <div className="flex items-center justify-center w-full">
              <Package className="h-6 w-6 text-[#2B015F]" />
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {visibleSidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${isActive ? "bg-[#2B015F] text-white" : "text-gray-700 hover:bg-gray-100"}
                  ${sidebarCollapsed ? "justify-center" : ""}
                `}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? item.title : undefined}
              >
                <Icon className={`h-5 w-5 ${!sidebarCollapsed ? "mr-3" : ""}`} />
                {!sidebarCollapsed && item.title}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t space-y-2">
          <Button
            onClick={toggleCollapse}
            variant="ghost"
            className={`w-full justify-start text-gray-700 hover:bg-gray-100 hidden lg:flex ${sidebarCollapsed ? "justify-center" : ""}`}
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
            className={`w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 ${sidebarCollapsed ? "justify-center" : ""}`}
            title={sidebarCollapsed ? "Déconnexion" : undefined}
          >
            <LogOut className={`h-4 w-4 ${!sidebarCollapsed ? "mr-3" : ""}`} />
            {!sidebarCollapsed && "Déconnexion"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-4 ml-auto">
            <span className="text-sm text-gray-600">Administration Daredare</span>
            {userRole && (
              <Badge variant={userRole === "management" ? "default" : "secondary"}>
                {userRole === "management" ? "Gestion" : "Opérations"}
              </Badge>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
