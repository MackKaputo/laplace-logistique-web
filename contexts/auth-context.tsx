"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { AuthState, UserRole } from "@/types/auth"

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  checkUserRole: (allowedRoles: UserRole[]) => boolean
}

interface RegisterData {
  first_name: string
  last_name: string
  email: string
  password: string
  account_type: UserRole
  organizationName: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  })
  const router = useRouter()

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem("daredare_user")
        if (storedUser) {
          setState({
            user: JSON.parse(storedUser),
            isLoading: false,
            error: null,
          })
        } else {
          setState({
            user: null,
            isLoading: false,
            error: null,
          })
        }
      } catch (error) {
        setState({
          user: null,
          isLoading: false,
          error: "Erreur lors de la vérification de l'authentification",
        })
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setState({ ...state, isLoading: true, error: null })

    try {
      // Real API call with only email and password
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/auth/daredare-signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (result.success) {
        // Store user data from the response
        const userData = result.data

        // Make sure user_id is saved
        const userToStore = {
          ...userData,
          id: userData.user_id || userData.id, // Ensure id is set from user_id if available
        }

        setState({
          user: userToStore,
          isLoading: false,
          error: null,
        })

        // Save user data to localStorage for persistence
        localStorage.setItem("daredare_user", JSON.stringify(userToStore))

        // Redirect to dashboard
        router.push("/dashboard")
      } else {
        setState({
          user: null,
          isLoading: false,
          error: result.message || "Email ou mot de passe incorrect",
        })
      }
    } catch (error) {
      setState({
        user: null,
        isLoading: false,
        error: "Erreur lors de la connexion au serveur",
      })
    }
  }

  const logout = async () => {
    setState({ ...state, isLoading: true })

    try {
      // Remove user data from localStorage
      localStorage.removeItem("daredare_user")

      setState({
        user: null,
        isLoading: false,
        error: null,
      })

      router.push("/login")
    } catch (error) {
      setState({
        ...state,
        isLoading: false,
        error: "Erreur lors de la déconnexion",
      })
    }
  }

  const register = async (userData: RegisterData) => {
    setState({ ...state, isLoading: true, error: null })

    try {
      // Real API call
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER_BASE_URL}/auth/daredare-signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const result = await response.json()

      if (result.success) {
        // If the API returns user data after registration, store it
        if (result.data && result.data.user_id) {
          const userData = {
            ...result.data,
            id: result.data.user_id,
          }

          setState({
            user: userData,
            isLoading: false,
            error: null,
          })

          localStorage.setItem("daredare_user", JSON.stringify(userData))

          // Redirect to dashboard instead of login
          router.push("/dashboard")
        } else {
          setState({
            ...state,
            isLoading: false,
            error: null,
          })

          // Redirect to login page
          router.push("/login?registered=true")
        }
      } else {
        setState({
          ...state,
          isLoading: false,
          error: result.message || "Erreur lors de l'inscription",
        })
      }
    } catch (error) {
      setState({
        ...state,
        isLoading: false,
        error: "Erreur lors de la connexion au serveur",
      })
    }
  }

  const checkUserRole = (allowedRoles: UserRole[]): boolean => {
    if (!state.user) return false
    // Check account_type instead of role
    return allowedRoles.includes(state.user.account_type || state.user.role)
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        register,
        checkUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider")
  }
  return context
}
