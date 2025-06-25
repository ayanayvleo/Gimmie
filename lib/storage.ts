import type { User, SearchRecord, BillingRecord } from "./types"

// Local storage keys
const USERS_KEY = "snatch_users"
const SEARCHES_KEY = "snatch_searches"
const BILLING_KEY = "snatch_billing"
const CURRENT_USER_KEY = "snatch_current_user"

// User management
export const saveUser = (user: User): void => {
  const users = getUsers()
  const existingIndex = users.findIndex((u) => u.id === user.id)

  if (existingIndex >= 0) {
    users[existingIndex] = user
  } else {
    users.push(user)
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
}

export const getUsers = (): User[] => {
  const users = localStorage.getItem(USERS_KEY)
  return users ? JSON.parse(users) : []
}

export const getUserByEmail = (email: string): User | null => {
  const users = getUsers()
  return users.find((u) => u.email === email) || null
}

export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem(CURRENT_USER_KEY)
  return user ? JSON.parse(user) : null
}

export const clearCurrentUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY)
}

// Search management
export const saveSearch = (search: SearchRecord): void => {
  const searches = getSearches()
  searches.unshift(search) // Add to beginning
  localStorage.setItem(SEARCHES_KEY, JSON.stringify(searches))
}

export const getSearches = (): SearchRecord[] => {
  const searches = localStorage.getItem(SEARCHES_KEY)
  return searches ? JSON.parse(searches) : []
}

export const getUserSearches = (userId: string): SearchRecord[] => {
  const searches = getSearches()
  return searches.filter((s) => s.userId === userId)
}

// Billing management
export const saveBillingRecord = (billing: BillingRecord): void => {
  const records = getBillingRecords()
  records.unshift(billing)
  localStorage.setItem(BILLING_KEY, JSON.stringify(records))
}

export const getBillingRecords = (): BillingRecord[] => {
  const records = localStorage.getItem(BILLING_KEY)
  return records ? JSON.parse(records) : []
}

export const getUserBillingRecords = (userId: string): BillingRecord[] => {
  const records = getBillingRecords()
  return records.filter((r) => r.userId === userId)
}
