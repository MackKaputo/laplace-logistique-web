"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import * as gtag from "@/lib/gtag"

export const useAnalytics = () => {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) {
      gtag.pageview(pathname)
    }
  }, [pathname])

  return {
    trackEvent: gtag.event,
    trackOrderCreated: gtag.trackOrderCreated,
    trackPriceCalculated: gtag.trackPriceCalculated,
    trackUserRegistration: gtag.trackUserRegistration,
    trackUserLogin: gtag.trackUserLogin,
    trackAddressSearch: gtag.trackAddressSearch,
    trackFormSubmission: gtag.trackFormSubmission,
    trackPageView: gtag.trackPageView,
    trackButtonClick: gtag.trackButtonClick,
  }
}
