export interface HistoryEntry {
  id: string
  url: string
  title: string
  timestamp: number
  favicon?: string
}

export interface Tab {
  id: string
  url: string
  title: string
  favicon?: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
  history: HistoryEntry[]
  currentHistoryIndex: number
}

export interface App {
  id: string
  name: string
  url: string
  iconUrl: string
  description?: string
  category?: string
}

export interface BrowserSettings {
  restoreTabsOnStartup: boolean
  defaultSearchEngine: string
  showAppsInNewTab: boolean
  apps: App[]
}

export interface BrowserState {
  tabs: Tab[]
  activeTabId: string | null
  globalHistory: HistoryEntry[]
  settings: BrowserSettings
}

export interface NavigationState {
  isLoading: boolean
  progress: number
  canGoBack: boolean
  canGoForward: boolean
  currentUrl: string
  currentTitle: string
}

export interface SearchSuggestion {
  id: string
  text: string
  url: string
  type: 'history' | 'search' | 'bookmark'
  favicon?: string
}
