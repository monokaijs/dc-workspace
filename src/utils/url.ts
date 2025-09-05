export const isValidUrl = (string: string): boolean => {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

export const normalizeUrl = (input: string): string => {
  const trimmed = input.trim()
  
  if (!trimmed) {
    return 'about:blank'
  }

  if (trimmed === 'about:blank') {
    return trimmed
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    return `https://${trimmed}`
  }

  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`
}

export const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch (_) {
    return url
  }
}

export const getFaviconUrl = (url: string, size: number = 32): string => {
  try {
    const urlObj = new URL(url)
    return `https://www.google.com/s2/favicons?sz=${size}&domain_url=${encodeURIComponent(urlObj.origin)}`
  } catch (_) {
    return ''
  }
}

export const formatUrlForDisplay = (url: string): string => {
  if (url === 'about:blank') {
    return ''
  }
  
  try {
    const urlObj = new URL(url)
    return urlObj.href
  } catch (_) {
    return url
  }
}

export const getSearchSuggestions = async (query: string): Promise<string[]> => {
  if (!query.trim()) {
    return []
  }

  try {
    const response = await fetch(
      `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`
    )
    const data = await response.json()
    return data[1] || []
  } catch (error) {
    console.error('Failed to fetch search suggestions:', error)
    return []
  }
}
