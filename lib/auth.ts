import type { User } from "./types"
import { saveUser, getUserByEmail } from "./storage"

export const createUser = async (email: string, password: string): Promise<User> => {
  // Check if user already exists
  const existingUser = getUserByEmail(email)
  if (existingUser) {
    throw new Error("User already exists with this email")
  }

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const now = new Date().toISOString()
  const user: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email,
    plan: "free",
    createdAt: now,
    searchesUsed: 0,
    searchesResetDate: getNextMonthDate(now),
  }

  saveUser(user)
  return user
}

export const signInUser = async (email: string, password: string): Promise<User> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const user = getUserByEmail(email)
  if (!user) {
    throw new Error("No account found with this email")
  }

  // In real app, you'd verify password hash
  // For demo, we'll just return the user
  return user
}

export const updateUserPlan = async (userId: string, plan: User["plan"]): Promise<User> => {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const users = JSON.parse(localStorage.getItem("snatch_users") || "[]")
  const userIndex = users.findIndex((u: User) => u.id === userId)

  if (userIndex === -1) {
    throw new Error("User not found")
  }

  users[userIndex].plan = plan
  users[userIndex].billingDate = new Date().toISOString()

  // Reset searches for new billing cycle
  if (plan !== "free") {
    users[userIndex].searchesUsed = 0
    users[userIndex].searchesResetDate = getNextMonthDate(new Date().toISOString())
  }

  localStorage.setItem("snatch_users", JSON.stringify(users))
  saveUser(users[userIndex])

  return users[userIndex]
}

const getNextMonthDate = (dateString: string): string => {
  const date = new Date(dateString)
  date.setMonth(date.getMonth() + 1)
  return date.toISOString()
}

export const canUserSearch = (user: User): boolean => {
  if (user.plan !== "free") return true

  // Check if it's a new month (reset searches)
  const now = new Date()
  const resetDate = new Date(user.searchesResetDate)

  if (now >= resetDate) {
    // Reset searches for new month
    user.searchesUsed = 0
    user.searchesResetDate = getNextMonthDate(now.toISOString())
    saveUser(user)
    return true
  }

  return user.searchesUsed < 3
}

export const incrementUserSearches = (user: User): User => {
  user.searchesUsed += 1
  saveUser(user)
  return user
}
