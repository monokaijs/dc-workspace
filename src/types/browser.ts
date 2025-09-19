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
  showNavigationBar: boolean
}

export interface App {
  id: string
  name: string
  url: string
  iconUrl: string
  description?: string
  category?: string
  hideNavigationBar?: boolean
}

export interface BrowserSettings {
  restoreTabsOnStartup: boolean
  defaultSearchEngine: string
  showAppsInNewTab: boolean
  startWithSystem: boolean
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

export type BrowserAction =
  | { type: 'CREATE_TAB'; payload: { url?: string; hideNavigationBar?: boolean } }
  | { type: 'CLOSE_TAB'; payload: { tabId: string } }
  | { type: 'SWITCH_TAB'; payload: { tabId: string } }
  | { type: 'NAVIGATE_TAB'; payload: { tabId: string; url: string } }
  | { type: 'UPDATE_TAB_URL'; payload: { tabId: string; url: string } }
  | { type: 'GO_BACK'; payload: { tabId: string } }
  | { type: 'GO_FORWARD'; payload: { tabId: string } }
  | { type: 'REFRESH_TAB'; payload: { tabId: string } }
  | { type: 'UPDATE_TAB_LOADING'; payload: { tabId: string; isLoading: boolean; progress?: number } }
  | { type: 'UPDATE_TAB_TITLE'; payload: { tabId: string; title: string } }
  | { type: 'UPDATE_TAB_FAVICON'; payload: { tabId: string; favicon: string } }
  | { type: 'TOGGLE_TAB_NAVIGATION_BAR'; payload: { tabId: string } }
  | { type: 'SET_TAB_NAVIGATION_BAR'; payload: { tabId: string; showNavigationBar: boolean } }
  | { type: 'ADD_TO_HISTORY'; payload: { entry: HistoryEntry } }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'UPDATE_SETTINGS'; payload: { settings: Partial<BrowserSettings> } }
  | { type: 'ADD_APP'; payload: { app: App } }
  | { type: 'REMOVE_APP'; payload: { appId: string } }
  | { type: 'UPDATE_APP'; payload: { appId: string; updates: Partial<App> } }
  | { type: 'LOAD_STATE'; payload: { state: BrowserState } }
