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

// ─── City Abbreviation Map ─────────────────────────────────────────────────
const CITY_ALIASES: Record<string, string> = {
  // Islamabad
  'isb': 'islamabad', 'isl': 'islamabad', 'islo': 'islamabad', 'islmabad': 'islamabad',
  'islamabd': 'islamabad', 'islambad': 'islamabad',
  // Rawalpindi
  'rwp': 'rawalpindi', 'pindi': 'rawalpindi', 'rawalpndi': 'rawalpindi', 'rawal': 'rawalpindi',
  // Lahore
  'lhr': 'lahore', 'lhre': 'lahore', 'lahor': 'lahore',
  // Karachi
  'khi': 'karachi', 'krc': 'karachi', 'krchi': 'karachi', 'karchi': 'karachi',
  // Peshawar
  'pew': 'peshawar', 'pesh': 'peshawar', 'peshawr': 'peshawar',
  // Faisalabad
  'fsd': 'faisalabad', 'faisalbad': 'faisalabad', 'faisal': 'faisalabad',
  // Multan
  'mtn': 'multan', 'mltn': 'multan', 'multn': 'multan',
  // Quetta
  'qta': 'quetta', 'queta': 'quetta',
  // Sialkot
  'skot': 'sialkot', 'skt': 'sialkot',
  // Gujranwala
  'gwl': 'gujranwala', 'gujranwla': 'gujranwala', 'gujran': 'gujranwala',
}

export function normalizeQuery(input: string): string {
  let q = input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // remove special chars
    .replace(/\s+/g, ' ')   // collapse spaces

  // Common Pakistani food spelling variants:
  q = q
    .replace(/bryani|birani|biriyani|briyani|brnyani/g, 'biryani')
    .replace(/karahi|karaahi|krahi/g, 'karahi')
    .replace(/haleem|halim/g, 'haleem')
    .replace(/nihari|nehari/g, 'nihari')
    .replace(/paye|paaye|paee/g, 'paye')
    .replace(/daal|dall/g, 'dal')
    .replace(/rotti|rotii/g, 'roti')
    .replace(/naaan/g, 'naan')
    .replace(/pulao|plao|pilao/g, 'pulao')
    .replace(/qorma|korma|qurma/g, 'korma')
    .replace(/samosaa/g, 'samosa')
    .replace(/pratha/g, 'paratha')
    .replace(/laasi/g, 'lassi')
    .replace(/chiken|chickin|chikin/g, 'chicken')
    .replace(/chapati|chapatti|chapti/g, 'chapati')
    .replace(/seekh|sikh|seekh/g, 'seekh')
    .replace(/tikka|tika|tikah/g, 'tikka')

  return q
}

// Resolve city aliases to canonical name
export function resolveCityAlias(input: string): string | null {
  const normalized = input.toLowerCase().trim()
  // Direct alias match
  if (CITY_ALIASES[normalized]) return CITY_ALIASES[normalized]
  // Check if it's already a valid city name
  const validCities = new Set(Object.values(CITY_ALIASES))
  if (validCities.has(normalized)) return normalized
  return null
}

export function fuzzyScore(
  query: string,
  target: string
): number {
  const q = normalizeQuery(query)
  const t = normalizeQuery(target)

  if (!q || !t) return 0

  // Exact match
  if (q === t) return 100

  // Starts with (high intent signal)
  if (t.startsWith(q)) return 90
  if (q.startsWith(t)) return 85

  // Contains match
  if (t.includes(q)) return 80
  if (q.includes(t)) return 70

  // Word-level matching
  const qWords = q.split(' ')
  const tWords = t.split(' ')
  let wordMatchCount = 0
  let partialMatchCount = 0

  for (const qw of qWords) {
    if (qw.length < 2) continue
    for (const tw of tWords) {
      if (qw === tw) {
        wordMatchCount++
        break
      }
      if (tw.startsWith(qw) || qw.startsWith(tw)) {
        partialMatchCount++
        break
      }
      if (tw.includes(qw) || qw.includes(tw)) {
        partialMatchCount++
        break
      }
    }
  }

  if (wordMatchCount > 0) return 65 + (wordMatchCount * 5)
  if (partialMatchCount > 0) return 55 + (partialMatchCount * 3)

  // Levenshtein distance — only for short queries to avoid false positives
  if (q.length <= 15 && t.length <= 30) {
    const dist = levenshtein(q, t)
    const maxLen = Math.max(q.length, t.length)
    const similarity = (1 - dist / maxLen) * 100
    if (similarity > 55) return similarity
  }

  return 0
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

  const normalizedQ = normalizeQuery(query)

  // Check if query is a city search
  const cityAlias = resolveCityAlias(normalizedQ)

  return meals
    .map(meal => {
      // Score against meal name
      const mealNameScore = fuzzyScore(normalizedQ, meal.name)
      // Score against kitchen name
      const kitchenNameScore = fuzzyScore(normalizedQ, meal.kitchenName) * 0.8
      // Score against category
      const categoryScore = fuzzyScore(normalizedQ, meal.category) * 0.6

      // Score against city — exact match or alias match
      let cityScore = 0
      if (cityAlias) {
        const mealCity = meal.kitchenCity.toLowerCase().trim()
        if (mealCity === cityAlias || meal.kitchenCitySlug === cityAlias) {
          cityScore = 85
        }
      } else {
        // Direct city name fuzzy match
        const rawCityScore = fuzzyScore(normalizedQ, meal.kitchenCity)
        cityScore = rawCityScore * 0.7
      }

      const bestScore = Math.max(mealNameScore, kitchenNameScore, categoryScore, cityScore)

      return {
        ...meal,
        score: bestScore
      }
    })
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ score, ...meal }) => meal)
}
