import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { BrowserState, Tab, HistoryEntry, NavigationState, App, BrowserSettings } from '@/types/browser'
import { getFaviconUrl } from '@/utils/url'

interface BrowserContextType {
  state: BrowserState
  navigationState: NavigationState
  createTab: (url?: string) => void
  closeTab: (tabId: string) => void
  switchTab: (tabId: string) => void
  navigateTab: (tabId: string, url: string) => void
  updateTabUrl: (tabId: string, url: string) => void
  goBack: (tabId: string) => void
  goForward: (tabId: string) => void
  refreshTab: (tabId: string) => void
  updateTabLoading: (tabId: string, isLoading: boolean, progress?: number) => void
  updateTabTitle: (tabId: string, title: string) => void
  updateTabFavicon: (tabId: string, favicon: string) => void
  addToHistory: (entry: HistoryEntry) => void
  getHistory: () => HistoryEntry[]
  clearHistory: () => void
  addApp: (app: Omit<App, 'id'>) => void
  removeApp: (appId: string) => void
  updateApp: (appId: string, updates: Partial<App>) => void
  updateSettings: (settings: Partial<BrowserSettings>) => void
}

type BrowserAction =
  | { type: 'CREATE_TAB'; payload: { url?: string } }
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
  | { type: 'ADD_TO_HISTORY'; payload: { entry: HistoryEntry } }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'ADD_APP'; payload: { app: App } }
  | { type: 'REMOVE_APP'; payload: { appId: string } }
  | { type: 'UPDATE_APP'; payload: { appId: string; updates: Partial<App> } }
  | { type: 'UPDATE_SETTINGS'; payload: { settings: Partial<BrowserSettings> } }
  | { type: 'LOAD_STATE'; payload: { state: BrowserState } }

const generateId = () => Math.random().toString(36).substr(2, 9)

const createNewTab = (url: string = 'about:blank'): Tab => ({
  id: generateId(),
  url,
  title: url === 'about:blank' ? 'New Tab' : url,
  favicon: url !== 'about:blank' ? getFaviconUrl(url) : undefined,
  isLoading: false,
  canGoBack: false,
  canGoForward: false,
  history: [],
  currentHistoryIndex: -1
})

const defaultApps: App[] = [
  {
    id: generateId(),
    name: 'Google',
    url: 'https://www.google.com',
    iconUrl: getFaviconUrl('https://www.google.com'),
    description: 'Search the web',
    category: 'Search'
  },
  {
    id: generateId(),
    name: 'GitHub',
    url: 'https://github.com',
    iconUrl: getFaviconUrl('https://github.com'),
    description: 'Code repository hosting',
    category: 'Development'
  },
  {
    id: generateId(),
    name: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    iconUrl: getFaviconUrl('https://stackoverflow.com'),
    description: 'Programming Q&A',
    category: 'Development'
  },
  {
    id: generateId(),
    name: 'MDN Web Docs',
    url: 'https://developer.mozilla.org',
    iconUrl: getFaviconUrl('https://developer.mozilla.org'),
    description: 'Web development documentation',
    category: 'Development'
  },
  {
    id: generateId(),
    name: 'YouTube',
    url: 'https://www.youtube.com',
    iconUrl: getFaviconUrl('https://www.youtube.com'),
    description: 'Video sharing platform',
    category: 'Entertainment'
  },
  {
    id: generateId(),
    name: 'Twitter',
    url: 'https://twitter.com',
    iconUrl: getFaviconUrl('https://twitter.com'),
    description: 'Social media platform',
    category: 'Social'
  }
]

const defaultSettings: BrowserSettings = {
  restoreTabsOnStartup: true,
  defaultSearchEngine: 'google',
  showAppsInNewTab: true,
  apps: defaultApps
}

const initialState: BrowserState = {
  tabs: [createNewTab()],
  activeTabId: null,
  globalHistory: [],
  settings: defaultSettings
}

const browserReducer = (state: BrowserState, action: BrowserAction): BrowserState => {
  switch (action.type) {
    case 'CREATE_TAB': {
      const newTab = createNewTab(action.payload.url)
      return {
        ...state,
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id
      }
    }

    case 'CLOSE_TAB': {
      const { tabId } = action.payload
      const newTabs = state.tabs.filter(tab => tab.id !== tabId)
      
      if (newTabs.length === 0) {
        const newTab = createNewTab()
        return {
          ...state,
          tabs: [newTab],
          activeTabId: newTab.id
        }
      }

      let newActiveTabId = state.activeTabId
      if (state.activeTabId === tabId) {
        const closedTabIndex = state.tabs.findIndex(tab => tab.id === tabId)
        const nextIndex = closedTabIndex > 0 ? closedTabIndex - 1 : 0
        newActiveTabId = newTabs[nextIndex]?.id || newTabs[0]?.id
      }

      return {
        ...state,
        tabs: newTabs,
        activeTabId: newActiveTabId
      }
    }

    case 'SWITCH_TAB': {
      return {
        ...state,
        activeTabId: action.payload.tabId
      }
    }

    case 'NAVIGATE_TAB': {
      const { tabId, url } = action.payload
      return {
        ...state,
        tabs: state.tabs.map(tab => {
          if (tab.id === tabId) {
            const historyEntry: HistoryEntry = {
              id: generateId(),
              url,
              title: url,
              timestamp: Date.now(),
              favicon: getFaviconUrl(url)
            }

            const newHistory = [...tab.history.slice(0, tab.currentHistoryIndex + 1), historyEntry]

            return {
              ...tab,
              url,
              title: url,
              favicon: getFaviconUrl(url),
              history: newHistory,
              currentHistoryIndex: newHistory.length - 1,
              canGoBack: newHistory.length > 1,
              canGoForward: false,
              isLoading: true
            }
          }
          return tab
        })
      }
    }

    case 'UPDATE_TAB_URL': {
      const { tabId, url } = action.payload
      return {
        ...state,
        tabs: state.tabs.map(tab => {
          if (tab.id === tabId) {
            // Add to history if this is a new URL
            const historyEntry: HistoryEntry = {
              id: generateId(),
              url,
              title: tab.title || url,
              timestamp: Date.now()
            }

            const newHistory = [...tab.history.slice(0, tab.currentHistoryIndex + 1), historyEntry]

            return {
              ...tab,
              url,
              history: newHistory,
              currentHistoryIndex: newHistory.length - 1,
              canGoBack: newHistory.length > 1,
              canGoForward: false
            }
          }
          return tab
        })
      }
    }

    case 'GO_BACK': {
      const { tabId } = action.payload
      return {
        ...state,
        tabs: state.tabs.map(tab => {
          if (tab.id === tabId && tab.canGoBack) {
            const newIndex = tab.currentHistoryIndex - 1
            const historyEntry = tab.history[newIndex]
            
            return {
              ...tab,
              url: historyEntry.url,
              title: historyEntry.title,
              currentHistoryIndex: newIndex,
              canGoBack: newIndex > 0,
              canGoForward: true,
              isLoading: true
            }
          }
          return tab
        })
      }
    }

    case 'GO_FORWARD': {
      const { tabId } = action.payload
      return {
        ...state,
        tabs: state.tabs.map(tab => {
          if (tab.id === tabId && tab.canGoForward) {
            const newIndex = tab.currentHistoryIndex + 1
            const historyEntry = tab.history[newIndex]
            
            return {
              ...tab,
              url: historyEntry.url,
              title: historyEntry.title,
              currentHistoryIndex: newIndex,
              canGoBack: true,
              canGoForward: newIndex < tab.history.length - 1,
              isLoading: true
            }
          }
          return tab
        })
      }
    }

    case 'REFRESH_TAB': {
      const { tabId } = action.payload
      return {
        ...state,
        tabs: state.tabs.map(tab => 
          tab.id === tabId ? { ...tab, isLoading: true } : tab
        )
      }
    }

    case 'UPDATE_TAB_LOADING': {
      const { tabId, isLoading } = action.payload
      return {
        ...state,
        tabs: state.tabs.map(tab => 
          tab.id === tabId ? { ...tab, isLoading } : tab
        )
      }
    }

    case 'UPDATE_TAB_TITLE': {
      const { tabId, title } = action.payload
      return {
        ...state,
        tabs: state.tabs.map(tab => 
          tab.id === tabId ? { ...tab, title } : tab
        )
      }
    }

    case 'UPDATE_TAB_FAVICON': {
      const { tabId, favicon } = action.payload
      return {
        ...state,
        tabs: state.tabs.map(tab => 
          tab.id === tabId ? { ...tab, favicon } : tab
        )
      }
    }

    case 'ADD_TO_HISTORY': {
      const { entry } = action.payload
      const existingIndex = state.globalHistory.findIndex(h => h.url === entry.url)
      
      if (existingIndex >= 0) {
        const updatedHistory = [...state.globalHistory]
        updatedHistory[existingIndex] = { ...updatedHistory[existingIndex], timestamp: entry.timestamp }
        return {
          ...state,
          globalHistory: updatedHistory.sort((a, b) => b.timestamp - a.timestamp)
        }
      }
      
      return {
        ...state,
        globalHistory: [entry, ...state.globalHistory].slice(0, 1000)
      }
    }

    case 'CLEAR_HISTORY': {
      return {
        ...state,
        globalHistory: []
      }
    }

    case 'ADD_APP': {
      return {
        ...state,
        settings: {
          ...state.settings,
          apps: [...state.settings.apps, action.payload.app]
        }
      }
    }

    case 'REMOVE_APP': {
      return {
        ...state,
        settings: {
          ...state.settings,
          apps: state.settings.apps.filter(app => app.id !== action.payload.appId)
        }
      }
    }

    case 'UPDATE_APP': {
      return {
        ...state,
        settings: {
          ...state.settings,
          apps: state.settings.apps.map(app =>
            app.id === action.payload.appId
              ? { ...app, ...action.payload.updates }
              : app
          )
        }
      }
    }

    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload.settings
        }
      }
    }

    case 'LOAD_STATE': {
      return action.payload.state
    }

    default:
      return state
  }
}

const BrowserContext = createContext<BrowserContextType | undefined>(undefined)

export const useBrowser = () => {
  const context = useContext(BrowserContext)
  if (!context) {
    throw new Error('useBrowser must be used within a BrowserProvider')
  }
  return context
}

interface BrowserProviderProps {
  children: ReactNode
}

export const BrowserProvider: React.FC<BrowserProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(browserReducer, initialState)

  useEffect(() => {
    if (state.tabs.length > 0 && !state.activeTabId) {
      dispatch({ type: 'SWITCH_TAB', payload: { tabId: state.tabs[0].id } })
    }
  }, [state.tabs, state.activeTabId])

  useEffect(() => {
    const savedState = localStorage.getItem('browserState')
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        // Merge with default settings to ensure new settings are available
        const mergedState = {
          ...parsedState,
          settings: {
            ...defaultSettings,
            ...parsedState.settings,
            apps: parsedState.settings?.apps || defaultApps
          }
        }

        if (mergedState.settings.restoreTabsOnStartup && mergedState.tabs?.length > 0) {
          // Restore tabs but reset loading states
          mergedState.tabs = mergedState.tabs.map((tab: Tab) => ({
            ...tab,
            isLoading: false
          }))
          dispatch({ type: 'LOAD_STATE', payload: { state: mergedState } })
        } else {
          // Don't restore tabs, but keep settings
          dispatch({ type: 'UPDATE_SETTINGS', payload: { settings: mergedState.settings } })
        }
      } catch (error) {
        console.error('Failed to load browser state:', error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('browserState', JSON.stringify(state))
  }, [state])

  const activeTab = state.tabs.find(tab => tab.id === state.activeTabId)
  
  const navigationState: NavigationState = {
    isLoading: activeTab?.isLoading || false,
    progress: 0,
    canGoBack: activeTab?.canGoBack || false,
    canGoForward: activeTab?.canGoForward || false,
    currentUrl: activeTab?.url || '',
    currentTitle: activeTab?.title || ''
  }

  const contextValue: BrowserContextType = {
    state,
    navigationState,
    createTab: (url?: string) => dispatch({ type: 'CREATE_TAB', payload: { url } }),
    closeTab: (tabId: string) => dispatch({ type: 'CLOSE_TAB', payload: { tabId } }),
    switchTab: (tabId: string) => dispatch({ type: 'SWITCH_TAB', payload: { tabId } }),
    navigateTab: (tabId: string, url: string) => {
      dispatch({ type: 'NAVIGATE_TAB', payload: { tabId, url } })
      dispatch({ type: 'ADD_TO_HISTORY', payload: {
        entry: { id: generateId(), url, title: url, timestamp: Date.now(), favicon: getFaviconUrl(url) }
      }})
    },
    updateTabUrl: (tabId: string, url: string) => {
      dispatch({ type: 'UPDATE_TAB_URL', payload: { tabId, url } })
      dispatch({ type: 'ADD_TO_HISTORY', payload: {
        entry: { id: generateId(), url, title: url, timestamp: Date.now(), favicon: getFaviconUrl(url) }
      }})
    },
    goBack: (tabId: string) => dispatch({ type: 'GO_BACK', payload: { tabId } }),
    goForward: (tabId: string) => dispatch({ type: 'GO_FORWARD', payload: { tabId } }),
    refreshTab: (tabId: string) => dispatch({ type: 'REFRESH_TAB', payload: { tabId } }),
    updateTabLoading: (tabId: string, isLoading: boolean, progress?: number) =>
      dispatch({ type: 'UPDATE_TAB_LOADING', payload: { tabId, isLoading, progress } }),
    updateTabTitle: (tabId: string, title: string) =>
      dispatch({ type: 'UPDATE_TAB_TITLE', payload: { tabId, title } }),
    updateTabFavicon: (tabId: string, favicon: string) =>
      dispatch({ type: 'UPDATE_TAB_FAVICON', payload: { tabId, favicon } }),
    addToHistory: (entry: HistoryEntry) =>
      dispatch({ type: 'ADD_TO_HISTORY', payload: { entry } }),
    getHistory: () => state.globalHistory,
    clearHistory: () => dispatch({ type: 'CLEAR_HISTORY' }),
    addApp: (app: Omit<App, 'id'>) => {
      const newApp: App = { ...app, id: generateId() }
      dispatch({ type: 'ADD_APP', payload: { app: newApp } })
    },
    removeApp: (appId: string) => dispatch({ type: 'REMOVE_APP', payload: { appId } }),
    updateApp: (appId: string, updates: Partial<App>) =>
      dispatch({ type: 'UPDATE_APP', payload: { appId, updates } }),
    updateSettings: (settings: Partial<BrowserSettings>) =>
      dispatch({ type: 'UPDATE_SETTINGS', payload: { settings } })
  }

  return (
    <BrowserContext.Provider value={contextValue}>
      {children}
    </BrowserContext.Provider>
  )
}
