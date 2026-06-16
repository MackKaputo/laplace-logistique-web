"use client"

import type React from "react"
import { createContext, useContext, type ReactNode } from "react"
import { useAnalytics } from "@/hooks/use-analytics"

interface AnalyticsContextType {
  trackEvent: (params: {
    action: string
    category: string
    label?: string
    value?: number
  }) => void
  trackOrderCreated: (orderType: string, price: number) => void
  trackPriceCalculated: (deliveryType: string, price: number) => void
  trackUserRegistration: (accountType: string) => void
  trackUserLogin: (accountType: string) => void
  trackAddressSearch: (searchType: "pickup" | "dropoff") => void
  trackFormSubmission: (formType: string, success: boolean) => void
  trackPageView: (pageName: string) => void
  trackButtonClick: (buttonName: string, location: string) => void
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

export const AnalyticsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const analytics = useAnalytics()

  return <AnalyticsContext.Provider value={analytics}>{children}</AnalyticsContext.Provider>
}

export const useAnalyticsContext = () => {
  const context = useContext(AnalyticsContext)
  if (context === undefined) {
    throw new Error("useAnalyticsContext must be used within an AnalyticsProvider")
  }
  return context
}
