import type { User, BillingRecord } from "./types"
import { saveBillingRecord, saveUser } from "./storage"

export const createBillingRecord = (user: User, plan: "professional" | "enterprise"): BillingRecord => {
  const amounts = {
    professional: 19.0,
    enterprise: 49.0,
  }

  const billingRecord: BillingRecord = {
    id: `billing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: user.id,
    amount: amounts[plan],
    plan: plan.charAt(0).toUpperCase() + plan.slice(1) + " Plan",
    date: new Date().toISOString(),
    status: "paid",
  }

  saveBillingRecord(billingRecord)
  return billingRecord
}

export const upgradUserPlan = async (user: User, newPlan: "professional" | "enterprise"): Promise<User> => {
  // Simulate payment processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Create billing record
  createBillingRecord(user, newPlan)

  // Update user plan
  const updatedUser: User = {
    ...user,
    plan: newPlan,
    billingDate: new Date().toISOString(),
    searchesUsed: 0, // Reset searches for new billing cycle
    searchesResetDate: getNextMonthDate(new Date().toISOString()),
  }

  saveUser(updatedUser)
  return updatedUser
}

const getNextMonthDate = (dateString: string): string => {
  const date = new Date(dateString)
  date.setMonth(date.getMonth() + 1)
  return date.toISOString()
}
