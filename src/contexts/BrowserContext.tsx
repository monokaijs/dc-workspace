import React, {createContext, ReactNode, useContext, useEffect, useReducer} from 'react'
import {App, BrowserAction, BrowserSettings, BrowserState, HistoryEntry, NavigationState, Tab} from '@/types/browser'
import {getFaviconUrl} from '@/utils/url'
import {persistenceService} from '@/services/persistence'

interface BrowserContextType {
  state: BrowserState
  navigationState: NavigationState
  createTab: (url?: string, hideNavigationBar?: boolean) => void
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
  toggleTabNavigationBar: (tabId: string) => void
  setTabNavigationBar: (tabId: string, showNavigationBar: boolean) => void
  addToHistory: (entry: HistoryEntry) => void
  getHistory: () => HistoryEntry[]
  clearHistory: () => void
  addApp: (app: Omit<App, 'id'>) => void
  removeApp: (appId: string) => void
  updateApp: (appId: string, updates: Partial<App>) => void
  updateSettings: (settings: Partial<BrowserSettings>) => void
}

const generateId = () => Math.random().toString(36).substr(2, 9)

const createNewTab = (url: string = 'about:blank', hideNavigationBar: boolean = false): Tab => ({
  id: generateId(),
  url,
  title: url === 'about:blank' ? 'New Tab' : url,
  favicon: url !== 'about:blank' ? getFaviconUrl(url) : undefined,
  isLoading: false,
  canGoBack: false,
  canGoForward: false,
  history: [],
  currentHistoryIndex: -1,
  showNavigationBar: !hideNavigationBar
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
]

const defaultSettings: BrowserSettings = {
  restoreTabsOnStartup: true,
  defaultSearchEngine: 'google',
  showAppsInNewTab: true,
  startWithSystem: false,
  autoCheckUpdates: true,
  apps: defaultApps
}

const initialTab = createNewTab()
const initialState: BrowserState = {
  tabs: [initialTab],
  activeTabId: initialTab.id,
  globalHistory: [],
  settings: defaultSettings
}

const browserReducer = (state: BrowserState, action: BrowserAction): BrowserState => {
  switch (action.type) {
    case 'CREATE_TAB': {
      const newTab = createNewTab(action.payload.url, action.payload.hideNavigationBar)
      return {
        ...state,
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id
      }
    }

    case 'CLOSE_TAB': {
      const {tabId} = action.payload
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
      const {tabId, url} = action.payload
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
      const {tabId, url} = action.payload
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
      const {tabId} = action.payload
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
      const {tabId} = action.payload
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
      const {tabId} = action.payload
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab.id === tabId ? {...tab, isLoading: true} : tab
        )
      }
    }

    case 'UPDATE_TAB_LOADING': {
      const {tabId, isLoading} = action.payload
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab.id === tabId ? {...tab, isLoading} : tab
        )
      }
    }

    case 'UPDATE_TAB_TITLE': {
      const {tabId, title} = action.payload
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab.id === tabId ? {...tab, title} : tab
        )
      }
    }

    case 'UPDATE_TAB_FAVICON': {
      const {tabId, favicon} = action.payload
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab.id === tabId ? {...tab, favicon} : tab
        )
      }
    }

    case 'TOGGLE_TAB_NAVIGATION_BAR': {
      const {tabId} = action.payload
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab.id === tabId ? {...tab, showNavigationBar: !tab.showNavigationBar} : tab
        )
      }
    }

    case 'SET_TAB_NAVIGATION_BAR': {
      const {tabId, showNavigationBar} = action.payload
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab.id === tabId ? {...tab, showNavigationBar} : tab
        )
      }
    }

    case 'ADD_TO_HISTORY': {
      const {entry} = action.payload
      const existingIndex = state.globalHistory.findIndex(h => h.url === entry.url)

      if (existingIndex >= 0) {
        const updatedHistory = [...state.globalHistory]
        updatedHistory[existingIndex] = {...updatedHistory[existingIndex], timestamp: entry.timestamp}
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
              ? {...app, ...action.payload.updates}
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

export const BrowserProvider: React.FC<BrowserProviderProps> = ({children}) => {
  const [state, dispatch] = useReducer(browserReducer, initialState)

  useEffect(() => {
    if (state.tabs.length > 0 && !state.activeTabId) {
      dispatch({type: 'SWITCH_TAB', payload: {tabId: state.tabs[0].id}})
    }
  }, [state.tabs, state.activeTabId])

  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        // Try to migrate from localStorage first
        await persistenceService.migrateFromLocalStorage()

        // Load the saved state
        const savedState = await persistenceService.loadBrowserState()

        if (savedState) {
          // Merge with default settings to ensure new settings are available
          const mergedState = {
            ...savedState,
            settings: {
              ...defaultSettings,
              ...savedState.settings,
              apps: savedState.settings?.apps || defaultApps
            }
          }

          if (mergedState.settings.restoreTabsOnStartup && mergedState.tabs?.length > 0) {
            // Restore tabs but reset loading states and ensure showNavigationBar exists
            mergedState.tabs = mergedState.tabs.map((tab: Tab) => ({
              ...tab,
              isLoading: false, // Always reset loading state on restore - each tab manages its own loading
              showNavigationBar: tab.showNavigationBar ?? true // Default to true for existing tabs
            }))
            // Ensure activeTabId is valid
            if (!mergedState.activeTabId || !mergedState.tabs.find(tab => tab.id === mergedState.activeTabId)) {
              mergedState.activeTabId = mergedState.tabs[0]?.id || null
            }
            dispatch({type: 'LOAD_STATE', payload: {state: mergedState}})
          } else {
            // Don't restore tabs, but keep settings
            dispatch({type: 'UPDATE_SETTINGS', payload: {settings: mergedState.settings as Partial<BrowserSettings>}})
          }
        }
      } catch (error) {
        console.error('Failed to load browser state:', error)
      }
    }

    loadPersistedData()
  }, [])

  useEffect(() => {
    const saveState = async () => {
      try {
        await persistenceService.saveBrowserState(state)
      } catch (error) {
        console.error('Failed to save browser state:', error)
      }
    }

    // Debounce the save operation to avoid too frequent writes
    const timeoutId = setTimeout(saveState, 500)
    return () => clearTimeout(timeoutId)
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
    createTab: (url?: string, hideNavigationBar?: boolean) => dispatch({
      type: 'CREATE_TAB',
      payload: {url, hideNavigationBar}
    }),
    closeTab: (tabId: string) => dispatch({type: 'CLOSE_TAB', payload: {tabId}}),
    switchTab: (tabId: string) => dispatch({type: 'SWITCH_TAB', payload: {tabId}}),
    navigateTab: (tabId: string, url: string) => {
      dispatch({type: 'NAVIGATE_TAB', payload: {tabId, url}})
      dispatch({
        type: 'ADD_TO_HISTORY', payload: {
          entry: {id: generateId(), url, title: url, timestamp: Date.now(), favicon: getFaviconUrl(url)}
        }
      })
    },
    updateTabUrl: (tabId: string, url: string) => {
      dispatch({type: 'UPDATE_TAB_URL', payload: {tabId, url}})
      dispatch({
        type: 'ADD_TO_HISTORY', payload: {
          entry: {id: generateId(), url, title: url, timestamp: Date.now(), favicon: getFaviconUrl(url)}
        }
      })
    },
    goBack: (tabId: string) => dispatch({type: 'GO_BACK', payload: {tabId}}),
    goForward: (tabId: string) => dispatch({type: 'GO_FORWARD', payload: {tabId}}),
    refreshTab: (tabId: string) => dispatch({type: 'REFRESH_TAB', payload: {tabId}}),
    updateTabLoading: (tabId: string, isLoading: boolean, progress?: number) =>
      dispatch({type: 'UPDATE_TAB_LOADING', payload: {tabId, isLoading, progress}}),
    updateTabTitle: (tabId: string, title: string) =>
      dispatch({type: 'UPDATE_TAB_TITLE', payload: {tabId, title}}),
    updateTabFavicon: (tabId: string, favicon: string) =>
      dispatch({type: 'UPDATE_TAB_FAVICON', payload: {tabId, favicon}}),
    toggleTabNavigationBar: (tabId: string) =>
      dispatch({type: 'TOGGLE_TAB_NAVIGATION_BAR', payload: {tabId}}),
    setTabNavigationBar: (tabId: string, showNavigationBar: boolean) =>
      dispatch({type: 'SET_TAB_NAVIGATION_BAR', payload: {tabId, showNavigationBar}}),
    addToHistory: (entry: HistoryEntry) =>
      dispatch({type: 'ADD_TO_HISTORY', payload: {entry}}),
    getHistory: () => state.globalHistory,
    clearHistory: () => dispatch({type: 'CLEAR_HISTORY'}),
    addApp: (app: Omit<App, 'id'>) => {
      const newApp: App = {...app, id: generateId()}
      dispatch({type: 'ADD_APP', payload: {app: newApp}})
    },
    removeApp: (appId: string) => dispatch({type: 'REMOVE_APP', payload: {appId}}),
    updateApp: (appId: string, updates: Partial<App>) =>
      dispatch({type: 'UPDATE_APP', payload: {appId, updates}}),
    updateSettings: (settings: Partial<BrowserSettings>) =>
      dispatch({type: 'UPDATE_SETTINGS', payload: {settings}})
  }

  return (
    <BrowserContext.Provider value={contextValue}>
      {children}
    </BrowserContext.Provider>
  )
}
