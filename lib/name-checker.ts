import type { NameResult } from "./types"

// Common business name patterns
const NAME_PATTERNS = [
  (t: string) => `${t}`,
  (t: string) => `${t}Co`,
  (t: string) => `${t}Inc`,
  (t: string) => `${t}LLC`,
  (t: string) => `${t}Group`,
  (t: string) => `${t}Solutions`,
  (t: string) => `${t}Services`,
  (t: string) => `${t}Systems`,
  (t: string) => `${t}Tech`,
  (t: string) => `${t}Labs`,
  (t: string) => `${t}Works`,
  (t: string) => `${t}Hub`,
  (t: string) => `${t}Pro`,
  (t: string) => `${t}Plus`,
  (t: string) => `${t}Edge`,
  (t: string) => `Smart${t}`,
  (t: string) => `Quick${t}`,
  (t: string) => `Prime${t}`,
  (t: string) => `Elite${t}`,
]

// --- Mock availability helpers ---------------------------------------------

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

const checkDomain = async (): Promise<boolean> => {
  await delay(100)
  return Math.random() > 0.3
}
const checkTrademark = async (): Promise<boolean> => {
  await delay(150)
  return Math.random() > 0.4
}
const checkBizReg = async (): Promise<boolean> => {
  await delay(120)
  return Math.random() > 0.5
}
const checkSocial = async (): Promise<boolean> => {
  await delay(80)
  return Math.random() > 0.6
}

// ---------------------------------------------------------------------------

const score = ({ domain, trademark, business, social }: Omit<NameResult, "name" | "score" | "available">) =>
  (domain ? 30 : 0) + (trademark ? 25 : 0) + (business ? 25 : 0) + (social ? 20 : 0)

export const generateBusinessNames = (term: string): string[] => {
  const clean = term.trim().replace(/[^a-z0-9]/gi, "")
  if (!clean) return []

  const names = [...new Set([...NAME_PATTERNS.map((fn) => fn(clean)), `The${clean}`, `${clean}Ventures`])]
  return names.slice(0, 12)
}

export const checkNameAvailability = async (names: string[]): Promise<NameResult[]> => {
  const results: NameResult[] = []

  for (const name of names) {
    const [domain, trademark, business, social] = await Promise.all([
      checkDomain(),
      checkTrademark(),
      checkBizReg(),
      checkSocial(),
    ])

    results.push({
      name,
      domain,
      trademark,
      business,
      social,
      available: domain && trademark && business,
      score: 0, // placeholder, filled below
    })
  }

  for (const r of results) r.score = score(r)
  return results.sort((a, b) => b.score - a.score)
}
