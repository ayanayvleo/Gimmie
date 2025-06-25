// Google Analytics tracking functions
declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void
  }
}

export const trackEvent = (eventName: string, parameters?: any) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, parameters)
  }
}

// Specific tracking functions for your app
export const trackSignup = (method: "email") => {
  trackEvent("sign_up", {
    method: method,
  })
}

export const trackLogin = (method: "email") => {
  trackEvent("login", {
    method: method,
  })
}

export const trackSearch = (searchTerm: string, resultsCount: number) => {
  trackEvent("search", {
    search_term: searchTerm,
    results_count: resultsCount,
  })
}

export const trackUpgrade = (plan: string, value: number) => {
  trackEvent("purchase", {
    currency: "USD",
    value: value,
    items: [
      {
        item_id: plan,
        item_name: `${plan} Plan`,
        category: "subscription",
        quantity: 1,
        price: value,
      },
    ],
  })
}

export const trackNameClaim = (businessName: string) => {
  trackEvent("claim_name", {
    business_name: businessName,
  })
}
