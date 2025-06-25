export interface User {
  id: string
  email: string
  plan: "free" | "professional" | "enterprise"
  createdAt: string
  searchesUsed: number
  searchesResetDate: string
  billingDate?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}

export interface NameResult {
  name: string
  available: boolean
  domain: boolean
  trademark: boolean
  business: boolean
  social: boolean
  score: number
}

export interface SearchRecord {
  id: string
  userId: string
  searchTerm: string
  results: NameResult[]
  timestamp: string
  availableCount: number
  totalCount: number
}

export interface BillingRecord {
  id: string
  userId: string
  amount: number
  plan: string
  date: string
  status: "paid" | "pending" | "failed"
}
