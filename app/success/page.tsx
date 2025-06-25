"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { getCurrentUser, saveUser } from "@/lib/storage"
import { createBillingRecord } from "@/lib/billing"
import type { User } from "@/lib/types"

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(true)
  const [updateComplete, setUpdateComplete] = useState(false)
  const [planName, setPlanName] = useState("")
  const [redirectCountdown, setRedirectCountdown] = useState(5)

  useEffect(() => {
    const updateUserPlan = async () => {
      try {
        // Get plan from URL parameters
        const plan = searchParams.get("plan") // 'professional' or 'enterprise'

        if (!plan || !["professional", "enterprise"].includes(plan)) {
          setIsUpdating(false)
          return
        }

        // Get current user
        const currentUser = getCurrentUser()
        if (!currentUser) {
          setIsUpdating(false)
          return
        }

        // Simulate processing delay (like a real API call)
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Create billing record
        createBillingRecord(currentUser, plan as "professional" | "enterprise")

        // Update user plan
        const updatedUser: User = {
          ...currentUser,
          plan: plan as "professional" | "enterprise",
          billingDate: new Date().toISOString(),
          searchesUsed: 0, // Reset searches for new billing cycle
          searchesResetDate: getNextMonthDate(new Date().toISOString()),
        }

        // Save updated user
        saveUser(updatedUser)

        // Set plan name for display
        setPlanName(plan === "professional" ? "Professional" : "Enterprise")
        setUpdateComplete(true)
      } catch (error) {
        console.error("Failed to update user plan:", error)
      } finally {
        setIsUpdating(false)
      }
    }

    updateUserPlan()
  }, [searchParams])

  // Auto-redirect effect
  useEffect(() => {
    if (!isUpdating && updateComplete) {
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            router.push("/")
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isUpdating, updateComplete, router])

  const getNextMonthDate = (dateString: string): string => {
    const date = new Date(dateString)
    date.setMonth(date.getMonth() + 1)
    return date.toISOString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            {isUpdating ? (
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-600" />
            )}
          </div>
          <CardTitle className="text-2xl">{isUpdating ? "Processing..." : "Payment Successful!"}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {isUpdating ? (
            <div className="space-y-2">
              <p className="text-gray-600">Activating your subscription...</p>
              <div className="text-sm text-gray-500">This will just take a moment</div>
            </div>
          ) : (
            <>
              <p className="text-gray-600">
                {updateComplete
                  ? `Thank you for your purchase! Your ${planName} plan is now active. Redirecting in ${redirectCountdown}...`
                  : "Thank you for your purchase! Your subscription is now active."}
              </p>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">
                  {updateComplete ? "Your Account Has Been Upgraded!" : "Next Steps:"}
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {updateComplete ? (
                    <>
                      <li>✓ {planName} plan activated</li>
                      <li>✓ Unlimited searches unlocked</li>
                      <li>✓ All premium features enabled</li>
                      <li>✓ Search counter reset</li>
                    </>
                  ) : (
                    <>
                      <li>✓ Return to Snatch to start searching</li>
                      <li>✓ Enjoy unlimited name searches</li>
                      <li>✓ Access all premium features</li>
                    </>
                  )}
                </ul>
              </div>

              <Link href="/" className="block">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  {updateComplete ? `Continue (${redirectCountdown})` : "Back to Snatch"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
