function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from(
    { length: m + 1 },
    (_, i) => Array.from({ length: n + 1 },
      (_, j) => i === 0 ? j : j === 0 ? i : 0)
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(
            dp[i-1][j],
            dp[i][j-1],
            dp[i-1][j-1]
          )
    }
  }
  return dp[m][n]
}

export function normalizeQuery(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // remove special chars
    .replace(/\s+/g, ' ')   // collapse spaces
    // Common Pakistani food spelling variants:
    .replace(/bryani|birani|biriyani|briyani/g, 'biryani')
    .replace(/karahi|karaahi|krahi/g, 'karahi')
    .replace(/haleem|halim|haleem/g, 'haleem')
    .replace(/nihari|nehari/g, 'nihari')
    .replace(/paye|paaye|paee/g, 'paye')
    .replace(/daal|daal|dall/g, 'dal')
    .replace(/rotti|rotii|roti/g, 'roti')
    .replace(/naan|naaan/g, 'naan')
    .replace(/pulao|plao|pilao/g, 'pulao')
    .replace(/qorma|korma|qurma/g, 'korma')
    .replace(/samosa|samosaa/g, 'samosa')
    .replace(/paratha|paratha|pratha/g, 'paratha')
    .replace(/lassi|laasi/g, 'lassi')
}

export function fuzzyScore(
  query: string,
  target: string
): number {
  const q = normalizeQuery(query)
  const t = normalizeQuery(target)
  
  // Exact match
  if (q === t) return 100
  
  // Contains match
  if (t.includes(q) || q.includes(t)) return 80
  
  // Word-level match (any word in query matches
  // any word in target)
  const qWords = q.split(' ')
  const tWords = t.split(' ')
  for (const qw of qWords) {
    for (const tw of tWords) {
      if (qw === tw) return 75
      if (tw.includes(qw) || qw.includes(tw)) return 65
    }
  }
  
  // Levenshtein distance
  const dist = levenshtein(q, t)
  const maxLen = Math.max(q.length, t.length)
  const similarity = (1 - dist / maxLen) * 100
  
  // Only return if similarity > 50%
  return similarity > 50 ? similarity : 0
}

export function fuzzySearchMeals(
  query: string,
  meals: Array<{
    id: string
    name: string
    kitchenName: string
    kitchenId: string
    price: number
    category: string
    lat: number | null
    lng: number | null
    kitchenCity: string
    kitchenCitySlug: string
  }>
): typeof meals {
  if (!query || query.length < 2) return []
  
  return meals
    .map(meal => ({
      ...meal,
      score: fuzzyScore(query, meal.name)
    }))
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ score, ...meal }) => meal)
}
