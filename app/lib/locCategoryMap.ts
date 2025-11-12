const LOC_CATEGORY_URLS: Record<string, string> = {
  archives: "https://www.loc.gov/collections/?q=archives",
  cemetery: "https://www.loc.gov/search/?q=cemetery&fo=json",
  cemeterys: "https://www.loc.gov/search/?q=cemetery&fo=json",
  church: "https://www.loc.gov/search/?q=church&fo=json",
  courthouse: "https://www.loc.gov/search/?q=courthouse&fo=json",
  library: "https://www.loc.gov/collections/?q=library",
  museum: "https://www.loc.gov/collections/?q=museum",
  monument: "https://www.loc.gov/search/?q=monument&fo=json",
  battlefield: "https://www.loc.gov/search/?q=battlefield&fo=json",
  park: "https://www.loc.gov/search/?q=park&fo=json",
  school: "https://www.loc.gov/search/?q=school&fo=json",
  university: "https://www.loc.gov/search/?q=university&fo=json",
  memorial: "https://www.loc.gov/search/?q=memorial&fo=json",
}

function normalizeCategory(category: string): string {
  return category.trim().toLowerCase()
}

export function getLocUrlForCategory(category?: string | null): string | null {
  if (!category) {
    return null
  }

  const normalized = normalizeCategory(category)

  if (normalized in LOC_CATEGORY_URLS) {
    return LOC_CATEGORY_URLS[normalized]
  }

  const encoded = encodeURIComponent(category.trim())
  return `https://www.loc.gov/search/?q=${encoded}&fo=json`
}


