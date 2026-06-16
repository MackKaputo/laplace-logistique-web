declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js",
      targetId: string | Date,
      config?: {
        page_location?: string
        event_category?: string
        event_label?: string
        value?: number
        [key: string]: any
      },
    ) => void
    dataLayer: any[]
  }
}

export {}
