"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Search,
  Sparkles,
  Shield,
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Star,
  ExternalLink,
  Globe,
  FileText,
  Award,
  Heart,
  CloudLightningIcon as Lightning,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { AccountModal } from "@/components/account-modal"
import type { User, NameResult, SearchRecord } from "@/lib/types"
import { getCurrentUser, clearCurrentUser, saveSearch } from "@/lib/storage"
import { createUser, signInUser, canUserSearch, incrementUserSearches } from "@/lib/auth"
import { generateBusinessNames, checkNameAvailability } from "@/lib/name-checker"
import { trackSignup, trackLogin, trackSearch, trackUpgrade, trackNameClaim } from "@/lib/analytics"

// Simple payment links - redirect to homepage
const PAYMENT_LINKS = {
  professional: "https://buy.stripe.com/test_00wfZheqD32Oely9Ib5AQ02",
  enterprise: "https://buy.stripe.com/test_9B600j3LZ0UGcdq8E75AQ01",
}

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<NameResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const [showPricing, setShowPricing] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [selectedName, setSelectedName] = useState<string>("")
  const [claimedNames, setClaimedNames] = useState<string[]>([])
  const [showClaimSuccess, setShowClaimSuccess] = useState(false)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)

  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState("")

  // Sassy motivational quotes
  const motivationalQuotes = [
    "Your business name is your first impression - make it count, queen! 👑",
    "The perfect name is out there waiting for you to snatch it! ✨",
    "You're about to build an empire - start with a name that slays! 💪",
    "Dream big, search smart, claim that name! 🚀",
    "Your future customers are waiting to fall in love with your brand! 💕",
    "Success starts with a name that makes people say 'WOW!' ⭐",
    "You've got this, boss babe! Time to find your perfect match! 🔥",
    "Every great business started with someone brave enough to begin! 💎",
  ]

  // Load user and check for recent payments
  useEffect(() => {
    const loadUser = () => {
      const currentUser = getCurrentUser()
      if (currentUser) {
        setUser(currentUser)

        // Load claimed names
        const claimed = JSON.parse(localStorage.getItem("claimed_names") || "[]")
        const userClaimed = claimed
          .filter((claim: any) => claim.userId === currentUser.id)
          .map((claim: any) => claim.name)
        setClaimedNames(userClaimed)

        // Check if user just returned from payment (simple detection)
        const lastActivity = localStorage.getItem("last_payment_attempt")
        const now = Date.now()

        if (lastActivity && now - Number.parseInt(lastActivity) < 300000) {
          // 5 minutes
          // User recently attempted payment, show success message
          if (currentUser.plan !== "free") {
            setShowUpgradeSuccess(true)
            localStorage.removeItem("last_payment_attempt")
          }
        }
      }
    }

    loadUser()

    // Listen for focus events (when user returns from payment)
    const handleFocus = () => {
      loadUser()
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [])

  const performSearch = async (term: string): Promise<NameResult[]> => {
    if (!user) {
      setShowAuthModal(true)
      setAuthMode("signup")
      return []
    }

    if (!canUserSearch(user)) {
      setShowPricing(true)
      return []
    }

    // Generate business name variations
    const nameVariations = generateBusinessNames(term)

    if (nameVariations.length === 0) {
      return []
    }

    // Check availability for each name
    const results = await checkNameAvailability(nameVariations)

    // Save search record with proper structure
    const searchRecord: SearchRecord = {
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      searchTerm: term,
      results: results, // Make sure this is the full results array
      timestamp: new Date().toISOString(),
      availableCount: results.filter((r) => r.available).length,
      totalCount: results.length,
    }

    saveSearch(searchRecord)

    // Track the search
    trackSearch(term, results.length)

    // Increment user's search count
    const updatedUser = incrementUserSearches(user)
    setUser(updatedUser)

    return results
  }

  const handleAuth = async (email: string, password: string, mode: "signin" | "signup") => {
    setAuthLoading(true)
    setAuthError("")

    try {
      let authenticatedUser: User

      if (mode === "signup") {
        authenticatedUser = await createUser(email, password)
        trackSignup("email") // Track signup
        setShowWelcomeModal(true)
      } else {
        authenticatedUser = await signInUser(email, password)
        trackLogin("email") // Track login
      }

      setUser(authenticatedUser)
      setShowAuthModal(false)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed")
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignOut = () => {
    setUser(null)
    clearCurrentUser()
    setResults([])
    setHasSearched(false)
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setHasSearched(true)

    try {
      const searchResults = await performSearch(searchTerm.trim())
      setResults(searchResults)
    } catch (error) {
      console.error("Search failed:", error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const generateRandom = async () => {
    const randomTerms = [
      "Innovate",
      "Nexus",
      "Vertex",
      "Catalyst",
      "Pinnacle",
      "Zenith",
      "Fusion",
      "Quantum",
      "Synergy",
      "Velocity",
      "Momentum",
      "Elevate",
    ]
    const randomTerm = randomTerms[Math.floor(Math.random() * randomTerms.length)]
    setSearchTerm(randomTerm)

    setIsSearching(true)
    setHasSearched(true)

    try {
      const searchResults = await performSearch(randomTerm)
      setResults(searchResults)
    } catch (error) {
      console.error("Search failed:", error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Track payment attempt and redirect to Stripe
  const handlePlanUpgrade = (plan: "professional" | "enterprise") => {
    const value = plan === "professional" ? 19 : 49
    trackUpgrade(plan, value) // Track upgrade attempt

    // Store timestamp of payment attempt
    localStorage.setItem("last_payment_attempt", Date.now().toString())
    localStorage.setItem("attempted_plan", plan)

    const paymentUrl = PAYMENT_LINKS[plan]
    window.open(paymentUrl, "_blank")
  }

  // Manual upgrade function for testing
  const handleManualUpgrade = () => {
    if (!user) return

    const attemptedPlan = localStorage.getItem("attempted_plan") || "professional"

    // Simulate successful payment upgrade
    const updatedUser: User = {
      ...user,
      plan: attemptedPlan as "professional" | "enterprise",
      billingDate: new Date().toISOString(),
      searchesUsed: 0,
      searchesResetDate: getNextMonthDate(new Date().toISOString()),
    }

    // Save updated user
    localStorage.setItem("snatch_current_user", JSON.stringify(updatedUser))
    setUser(updatedUser)

    // Close pricing modal and show success
    setShowPricing(false)
    setShowUpgradeSuccess(true)

    // Clean up
    localStorage.removeItem("last_payment_attempt")
    localStorage.removeItem("attempted_plan")
  }

  // Handle claiming a name
  const handleClaimName = (name: string) => {
    setSelectedName(name)
    setShowClaimModal(true)
  }

  const getNextMonthDate = (dateString: string): string => {
    const date = new Date(dateString)
    date.setMonth(date.getMonth() + 1)
    return date.toISOString()
  }

  const getSearchLimitText = () => {
    if (!user || user.plan !== "free") return null

    const remaining = 3 - user.searchesUsed
    if (remaining <= 0) return "Search limit reached - upgrade to continue"

    return `${remaining} searches remaining this month`
  }

  const handleFinalClaim = (name: string) => {
    // Add to claimed names
    setClaimedNames((prev) => [...prev, name])

    // Track name claim
    trackNameClaim(name)

    // Save to localStorage for persistence
    const existingClaimed = JSON.parse(localStorage.getItem("claimed_names") || "[]")
    const updatedClaimed = [
      ...existingClaimed,
      {
        name,
        claimedAt: new Date().toISOString(),
        userId: user?.id,
      },
    ]
    localStorage.setItem("claimed_names", JSON.stringify(updatedClaimed))

    // Close claim modal and show success
    setShowClaimModal(false)
    setShowClaimSuccess(true)
  }

  // Welcome Modal Component
  const WelcomeModal = () => {
    const [currentQuote, setCurrentQuote] = useState(0)

    useEffect(() => {
      if (showWelcomeModal) {
        setCurrentQuote(Math.floor(Math.random() * motivationalQuotes.length))
      }
    }, [showWelcomeModal])

    return (
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4 relative">
              <Heart className="w-10 h-10 text-white animate-pulse" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <Lightning className="w-3 h-3 text-yellow-800" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              You Betta Get That Name! 💅
            </DialogTitle>
          </DialogHeader>

          <div className="text-center space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100">
              <p className="text-lg font-medium text-gray-800 mb-3">Welcome to the squad, gorgeous! ✨</p>
              <p className="text-purple-600 font-semibold italic text-base leading-relaxed">
                "{motivationalQuotes[currentQuote]}"
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>You've got 3 free searches to get started</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Full trademark & domain checking included</span>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3"
              onClick={() => {
                setShowWelcomeModal(false)
                // Focus on search input after closing
                setTimeout(() => {
                  document.querySelector("input")?.focus()
                }, 100)
              }}
            >
              Let's Find My Perfect Name! 🚀
            </Button>

            <p className="text-xs text-gray-500">Ready to build something amazing? Let's go! 💪</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Auth Modal Component
  const AuthModal = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()

      if (authMode === "signup" && password !== confirmPassword) {
        setAuthError("Passwords don't match!")
        return
      }

      if (password.length < 6) {
        setAuthError("Password must be at least 6 characters")
        return
      }

      await handleAuth(email, password, authMode)
    }

    return (
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {authMode === "signin" ? "Welcome Back!" : "Join Gimmie Today!"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {authError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{authError}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {authMode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}
            <Button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {authMode === "signin" ? "Sign In" : "Create Account"}
            </Button>
            <div className="text-center text-sm text-gray-600">
              {authMode === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup")
                      setAuthError("")
                    }}
                    className="text-purple-600 hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signin")
                      setAuthError("")
                    }}
                    className="text-purple-600 hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  // Claim Name Modal Component
  const ClaimNameModal = () => {
    const domainName = selectedName.toLowerCase().replace(/[^a-z0-9]/g, "")

    return (
      <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Claim "{selectedName}"</DialogTitle>
            <p className="text-center text-gray-600">Follow these steps to secure your business name</p>
          </DialogHeader>

          <div className="space-y-6">
            {/* Domain Registration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  1. Register Domain
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">Secure your online presence with a domain name</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() =>
                      window.open(
                        `https://www.namecheap.com/domains/registration/results/?domain=${domainName}.com`,
                        "_blank",
                      )
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Namecheap
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() =>
                      window.open(`https://domains.google.com/registrar/search?searchTerm=${domainName}.com`, "_blank")
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Google Domains
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() =>
                      window.open(
                        `https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=${domainName}.com`,
                        "_blank",
                      )
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    GoDaddy
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => window.open(`https://www.cloudflare.com/products/registrar/`, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Cloudflare
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Business Registration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  2. Register Business
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">Legally establish your business entity</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => window.open("https://www.legalzoom.com/business/business-formation", "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    LegalZoom
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => window.open("https://www.incfile.com/", "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Incfile
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => window.open("https://www.nolo.com/legal-encyclopedia/llc", "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Nolo
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() =>
                      window.open(
                        "https://www.sba.gov/business-guide/launch-your-business/choose-business-structure",
                        "_blank",
                      )
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    SBA.gov
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Trademark Protection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  3. Protect with Trademark
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">Secure exclusive rights to your business name</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => window.open(`https://www.uspto.gov/trademarks/search`, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    USPTO
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() =>
                      window.open("https://www.legalzoom.com/trademarks/trademark-registration-overview.html", "_blank")
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    LegalZoom TM
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => window.open("https://www.trademarkia.com/", "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Trademarkia
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() =>
                      window.open("https://www.rocketlawyer.com/business/intellectual-property/trademarks", "_blank")
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Rocket Lawyer
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-orange-600" />
                  4. Secure Social Media
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">Claim your brand across social platforms</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => window.open(`https://www.instagram.com/${selectedName.toLowerCase()}`, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Instagram
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => window.open(`https://twitter.com/${selectedName.toLowerCase()}`, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Twitter/X
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => window.open(`https://www.facebook.com/${selectedName.toLowerCase()}`, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() =>
                      window.open(`https://www.linkedin.com/company/${selectedName.toLowerCase()}`, "_blank")
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">💡 Pro Tip</h3>
              <p className="text-sm text-gray-600">
                Start with domain registration as it's usually the quickest. Then move to business registration and
                trademark protection for complete coverage.
              </p>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => handleFinalClaim(selectedName)}
            >
              Got it! Let's claim this name
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Claim Success Modal Component
  const ClaimSuccessModal = () => (
    <Dialog open={showClaimSuccess} onOpenChange={setShowClaimSuccess}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <DialogTitle className="text-center text-2xl">Name Claimed Successfully!</DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-4">
          <p className="text-gray-600">"{selectedName}" has been added to your claimed names list!</p>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">✅ Next Steps:</h3>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li>• Register your domain within 24-48 hours</li>
              <li>• File business registration within 30 days</li>
              <li>• Apply for trademark protection within 90 days</li>
              <li>• Secure social media handles ASAP</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowClaimSuccess(false)}>
              Continue Searching
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => {
                setShowClaimSuccess(false)
                setShowAccount(true)
              }}
            >
              View My Claims
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  // Success Modal Component
  const UpgradeSuccessModal = () => (
    <Dialog open={showUpgradeSuccess} onOpenChange={setShowUpgradeSuccess}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <DialogTitle className="text-center text-2xl">Upgrade Successful!</DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            Your {user?.plan === "professional" ? "Professional" : "Enterprise"} plan is now active!
          </p>
          <div className="bg-purple-50 p-4 rounded-lg">
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Unlimited searches unlocked</li>
              <li>✓ All premium features enabled</li>
              <li>✓ Search counter reset</li>
            </ul>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() => setShowUpgradeSuccess(false)}
          >
            Start Searching!
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  // Pricing Modal Component
  const PricingModal = () => (
    <Dialog open={showPricing} onOpenChange={setShowPricing}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Choose Your Plan</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-3 gap-6 py-6">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader className="text-center">
              <CardTitle>Starter</CardTitle>
              <div className="text-3xl font-bold">Free</div>
              <p className="text-gray-600">Perfect for trying out</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />3 name searches per month
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Basic availability check
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Domain availability
                </li>
              </ul>
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-purple-200 bg-purple-50/50">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">Most Popular</Badge>
            </div>
            <CardHeader className="text-center">
              <CardTitle>Professional</CardTitle>
              <div className="text-3xl font-bold">
                $19<span className="text-lg font-normal">/month</span>
              </div>
              <p className="text-gray-600">For serious entrepreneurs</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Unlimited name searches
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Full availability reports
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Trademark & business checks
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Social media availability
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Save favorite names
                </li>
              </ul>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => handlePlanUpgrade("professional")}
              >
                Subscribe Now
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Enterprise</CardTitle>
              <div className="text-3xl font-bold">
                $49<span className="text-lg font-normal">/month</span>
              </div>
              <p className="text-gray-600">For agencies & teams</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Everything in Professional
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Team collaboration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Custom integrations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  White-label options
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => handlePlanUpgrade("enterprise")}>
                Subscribe Now
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Testing Helper */}
        <div className="border-t pt-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              For testing: After completing payment, click below to simulate upgrade
            </p>
            <Button variant="outline" size="sm" onClick={handleManualUpgrade} className="text-purple-600">
              Simulate Successful Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Gimmie
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowPricing(true)}
              className="hidden sm:flex text-purple-600 hover:text-purple-700"
            >
              Pricing
            </Button>
            {user ? (
              <div className="flex items-center gap-3">
                {user.plan !== "free" && (
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    {user.plan === "professional" ? "Pro" : "Enterprise"}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  onClick={() => setShowAccount(true)}
                  className="hidden sm:flex text-purple-600 hover:text-purple-700"
                >
                  My Account
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAuthMode("signin")
                    setShowAuthModal(true)
                  }}
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => {
                    setAuthMode("signup")
                    setShowAuthModal(true)
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            Gimmie That Name!
          </h1>

          {/* Social Proof Stats */}
          <div className="flex justify-center items-center gap-8 mb-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>2,847 names claimed this month</span>
            </div>
            <div>•</div>
            <div>15,000+ entrepreneurs served</div>
            <div>•</div>
            <div>98% success rate</div>
          </div>

          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Find legitimate, available business names that aren't taken. We check domains, trademarks, and business
            registrations instantly - because when you see the perfect name, you gotta say "Gimmie!"
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex flex-col gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Enter a keyword or business idea..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 h-12 text-lg w-full"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
                className="h-12 w-full sm:w-auto px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Search Names
                  </>
                )}
              </Button>
            </div>

            {/* Search limit indicator */}
            {user && <div className="mt-2 text-sm text-gray-600 text-center">{getSearchLimitText()}</div>}

            <Button
              variant="ghost"
              onClick={generateRandom}
              disabled={isSearching}
              className="mt-3 text-purple-600 hover:text-purple-700 w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Random Ideas
            </Button>
          </div>

          {/* Example Searches */}
          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-3">Popular searches:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["Tech", "Coffee", "Fitness", "Marketing", "Consulting", "Creative"].map((term) => (
                <Button
                  key={term}
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setSearchTerm(term)
                    setIsSearching(true)
                    setHasSearched(true)

                    try {
                      const searchResults = await performSearch(term)
                      setResults(searchResults)
                    } catch (error) {
                      console.error("Search failed:", error)
                      setResults([])
                    } finally {
                      setIsSearching(false)
                    }
                  }}
                  disabled={isSearching}
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="flex flex-col items-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl">
              <Shield className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Legitimacy Check</h3>
              <p className="text-gray-600 text-center">Verify business registration and trademark availability</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl">
              <Zap className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Instant Results</h3>
              <p className="text-gray-600 text-center">Get availability status across multiple platforms instantly</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl">
              <Star className="w-12 h-12 text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Smart Suggestions</h3>
              <p className="text-gray-600 text-center">AI-powered name variations and creative alternatives</p>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {hasSearched && (
        <section className="container mx-auto px-4 pb-12">
          <div className="max-w-4xl mx-auto">
            {isSearching ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
                <h3 className="text-xl font-semibold mb-2">Searching for available names...</h3>
                <p className="text-gray-600">Checking domains, trademarks, and business registrations</p>
              </div>
            ) : results.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-center">
                  Found {results.filter((r) => r.available).length} available names for "{searchTerm}"
                </h2>
                <div className="grid gap-4">
                  {results.map((result, index) => (
                    <Card
                      key={index}
                      className={`transition-all hover:shadow-lg ${result.available ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl flex items-center gap-2">
                            {result.name}
                            {result.available ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={result.available ? "default" : "destructive"}>
                              {result.available ? "Available" : "Taken"}
                            </Badge>
                            <Badge variant="outline">Score: {result.score}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${result.domain ? "bg-green-500" : "bg-red-500"}`} />
                            <span className="text-sm">Domain</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${result.trademark ? "bg-green-500" : "bg-red-500"}`}
                            />
                            <span className="text-sm">Trademark</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${result.business ? "bg-green-500" : "bg-red-500"}`}
                            />
                            <span className="text-sm">Business Reg</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${result.social ? "bg-green-500" : "bg-red-500"}`} />
                            <span className="text-sm">Social Media</span>
                          </div>
                        </div>
                        {result.available && (
                          <Button
                            className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            onClick={() => handleClaimName(result.name)}
                          >
                            Claim This Name
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-gray-600">Try a different search term or generate random ideas</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What Entrepreneurs Are Saying</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Found the perfect name for my startup in under 10 minutes. The trademark check saved me from a huge
                  legal headache!"
                </p>
                <div>
                  <p className="font-semibold">Sarah Chen</p>
                  <p className="text-sm text-gray-500">Tech Startup Founder</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "As a marketing consultant, I recommend this to all my clients. It's comprehensive and saves so much
                  time."
                </p>
                <div>
                  <p className="font-semibold">Marcus Rodriguez</p>
                  <p className="text-sm text-gray-500">Marketing Director</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Love the sass and attitude! Finally a business tool that doesn't take itself too seriously but gets
                  the job done."
                </p>
                <div>
                  <p className="font-semibold">Jessica Park</p>
                  <p className="text-sm text-gray-500">Small Business Owner</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center bg-white/60 backdrop-blur-sm rounded-3xl p-8">
          <div className="mb-4">
            <Badge className="bg-red-100 text-red-600 border-red-200">🔥 Trending Now</Badge>
          </div>
          <h2 className="text-3xl font-bold mb-4">Ready to find your perfect business name?</h2>
          <p className="text-gray-600 mb-6">
            Join thousands of entrepreneurs who've found their ideal business name with Gimmie.
            <strong> Over 500 names claimed just this week!</strong>
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() => document.querySelector("input")?.focus()}
          >
            Start Searching Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-xs text-gray-500 mt-3">⚡ Free searches available • No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>&copy; 2024 Gimmie That Name. All rights reserved. Find your perfect business name today.</p>
      </footer>

      {/* Modals */}
      <WelcomeModal />
      <AuthModal />
      <PricingModal />
      <UpgradeSuccessModal />
      <ClaimNameModal />
      <ClaimSuccessModal />
      <AccountModal
        open={showAccount}
        onOpenChange={setShowAccount}
        user={user}
        searchesUsed={user?.searchesUsed || 0}
        onUpgrade={() => {
          setShowAccount(false)
          setShowPricing(true)
        }}
        onSignOut={handleSignOut}
        onPlanUpgrade={handlePlanUpgrade}
        upgradeLoading={false}
      />
    </div>
  )
}
