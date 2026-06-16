export const GA_TRACKING_ID = "G-1XZYHCBHWF"

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== "undefined") {
    window.gtag("config", GA_TRACKING_ID, {
      page_location: url,
    })
  }
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== "undefined") {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Custom tracking events for the app
export const trackOrderCreated = (orderType: string, price: number) => {
  event({
    action: "order_created",
    category: "ecommerce",
    label: orderType,
    value: price,
  })
}

export const trackPriceCalculated = (deliveryType: string, price: number) => {
  event({
    action: "price_calculated",
    category: "engagement",
    label: deliveryType,
    value: price,
  })
}

export const trackUserRegistration = (accountType: string) => {
  event({
    action: "user_registration",
    category: "user",
    label: accountType,
  })
}

export const trackUserLogin = (accountType: string) => {
  event({
    action: "user_login",
    category: "user",
    label: accountType,
  })
}

export const trackAddressSearch = (searchType: "pickup" | "dropoff") => {
  event({
    action: "address_search",
    category: "engagement",
    label: searchType,
  })
}

export const trackFormSubmission = (formType: string, success: boolean) => {
  event({
    action: "form_submission",
    category: "engagement",
    label: `${formType}_${success ? "success" : "error"}`,
  })
}

export const trackPageView = (pageName: string) => {
  event({
    action: "page_view",
    category: "navigation",
    label: pageName,
  })
}

export const trackButtonClick = (buttonName: string, location: string) => {
  event({
    action: "button_click",
    category: "engagement",
    label: `${buttonName}_${location}`,
  })
}
