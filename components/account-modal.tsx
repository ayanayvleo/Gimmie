"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, CreditCard, History, Settings, Crown, CheckCircle, TrendingUp, Loader2 } from "lucide-react"
import { getUserSearches, getUserBillingRecords } from "@/lib/storage"

interface AccountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: { email: string; plan: string; id: string; createdAt: string } | null
  searchesUsed: number
  onUpgrade: () => void
  onSignOut: () => void
  onPlanUpgrade?: (plan: "professional" | "enterprise") => Promise<void>
  upgradeLoading?: boolean
}

export function AccountModal({
  open,
  onOpenChange,
  user,
  searchesUsed,
  onUpgrade,
  onSignOut,
  onPlanUpgrade,
  upgradeLoading = false,
}: AccountModalProps) {
  const [activeTab, setActiveTab] = useState("overview")

  if (!user) return null

  // Calculate accurate statistics from saved search data
  const userSearches = getUserSearches(user.id)
  const billingRecords = getUserBillingRecords(user.id)

  // ACCURATE CALCULATIONS
  const totalSearchQueries = userSearches.length // Number of search queries performed
  const totalNamesGenerated = userSearches.reduce((acc, search) => {
    // Use totalCount from saved search record
    return acc + (search.totalCount || 0)
  }, 0)
  const totalAvailableNames = userSearches.reduce((acc, search) => {
    // Use availableCount from saved search record
    return acc + (search.availableCount || 0)
  }, 0)

  // Success rate calculation
  const successRate = totalNamesGenerated > 0 ? Math.round((totalAvailableNames / totalNamesGenerated) * 100) : 0

  const planDetails = {
    free: {
      name: "Starter",
      price: "$0",
      searches: 3,
      features: ["3 searches/month", "Basic availability", "Domain check"],
    },
    professional: {
      name: "Professional",
      price: "$19",
      searches: "Unlimited",
      features: ["Unlimited searches", "Full reports", "Trademark check", "Social media check", "Save favorites"],
    },
    enterprise: {
      name: "Enterprise",
      price: "$49",
      searches: "Unlimited",
      features: ["Everything in Pro", "Team collaboration", "Priority support", "Custom integrations"],
    },
  }

  const currentPlan = planDetails[user.plan as keyof typeof planDetails]

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <User className="w-6 h-6" />
            My Account
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Account Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600">Email</Label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Plan</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.plan === "free" ? "secondary" : "default"}>{currentPlan.name}</Badge>
                      {user.plan !== "free" && <Crown className="w-4 h-4 text-yellow-500" />}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Member Since</Label>
                    <p className="font-medium">{memberSince}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Usage This Month
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600">Searches Used This Month</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{searchesUsed}</p>
                      {user.plan === "free" && <span className="text-gray-500">/ {currentPlan.searches}</span>}
                    </div>
                    {user.plan === "free" && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${Math.min((searchesUsed / 3) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Total Search Queries</Label>
                    <p className="text-2xl font-bold">{totalSearchQueries}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Names Generated</Label>
                    <p className="text-2xl font-bold">{totalNamesGenerated}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Available Names Found</Label>
                    <p className="text-2xl font-bold text-green-600">{totalAvailableNames}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Success Rate</Label>
                    <p className="text-2xl font-bold text-blue-600">{successRate}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {user.plan === "free" && (
                    <Button
                      onClick={onUpgrade}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setActiveTab("history")}>
                    <History className="w-4 h-4 mr-2" />
                    View History
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Current Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold text-lg">{currentPlan.name} Plan</h3>
                    <p className="text-gray-600">{currentPlan.price}/month</p>
                  </div>
                  <Badge variant={user.plan === "free" ? "secondary" : "default"}>
                    {user.plan === "free" ? "Free" : "Active"}
                  </Badge>
                </div>

                <div>
                  <Label className="text-sm font-medium">Plan Features</Label>
                  <ul className="mt-2 space-y-2">
                    {currentPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {user.plan !== "free" && (
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Next Billing Date</Label>
                    <p className="font-medium">February 15, 2024</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plan Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Available Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {Object.entries(planDetails).map(([key, plan]) => (
                    <div
                      key={key}
                      className={`p-4 border rounded-lg ${user.plan === key ? "border-purple-500 bg-purple-50" : ""}`}
                    >
                      <div className="text-center mb-4">
                        <h3 className="font-semibold">{plan.name}</h3>
                        <p className="text-2xl font-bold">{plan.price}</p>
                        <p className="text-sm text-gray-600">per month</p>
                      </div>
                      <ul className="space-y-1 text-sm mb-4">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {user.plan === key ? (
                        <Button variant="outline" className="w-full" disabled>
                          Current Plan
                        </Button>
                      ) : key === "free" ? (
                        <Button variant="outline" className="w-full">
                          Downgrade
                        </Button>
                      ) : (
                        <Button
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          onClick={() => onPlanUpgrade?.(key as "professional" | "enterprise")}
                          disabled={upgradeLoading}
                        >
                          {upgradeLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          {user.plan === "free" ? "Upgrade" : "Switch Plan"}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            {user.plan !== "free" && (
              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                </CardHeader>
                <CardContent>
                  {billingRecords.length > 0 ? (
                    <div className="space-y-3">
                      {billingRecords.map((record, index) => (
                        <div key={record.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{record.plan}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(record.date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${record.amount.toFixed(2)}</p>
                            <Badge variant={record.status === "paid" ? "default" : "secondary"} className="text-xs">
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No billing history</p>
                      <p className="text-sm">Billing records will appear here after your first payment</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Search History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userSearches.length > 0 ? (
                  userSearches.slice(0, 10).map((search, index) => (
                    <div key={search.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{search.searchTerm}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(search.timestamp).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          <span className="font-medium text-green-600">{search.availableCount}</span> available
                          {" / "}
                          <span className="text-gray-600">{search.totalCount} total</span>
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-purple-600"
                          onClick={() => {
                            // Could implement view results functionality
                            console.log("View results for:", search.searchTerm)
                          }}
                        >
                          View Results
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No search history yet</p>
                    <p className="text-sm">Start searching for business names to see your history here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" value={user.email} disabled />
                  </div>
                  <div>
                    <Label htmlFor="password">Change Password</Label>
                    <Input id="password" type="password" placeholder="Enter new password" />
                  </div>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Update Settings
                  </Button>
                </div>

                <hr />

                <div className="space-y-4">
                  <h3 className="font-medium text-red-600">Danger Zone</h3>
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <h4 className="font-medium mb-2">Delete Account</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      This action cannot be undone. This will permanently delete your account and remove your data.
                    </p>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onSignOut}>
            Sign Out
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
