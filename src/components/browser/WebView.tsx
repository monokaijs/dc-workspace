import React, {useEffect, useRef} from 'react'
import {useBrowser} from '@/contexts/BrowserContext'
import {Card} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {AlertCircle, Globe} from 'lucide-react'


interface TabWebViewProps {
  tab: any
  isActive: boolean
  onUpdateLoading: (tabId: string, isLoading: boolean) => void
  onUpdateTitle: (tabId: string, title: string) => void
  onUpdateFavicon: (tabId: string, favicon: string) => void
  onNavigate: (tabId: string, url: string) => void
  onUpdateUrl: (tabId: string, url: string) => void
}

const TabWebView: React.FC<TabWebViewProps> = React.memo(({
                                                 tab,
                                                 isActive,
                                                 onUpdateLoading,
                                                 onUpdateTitle,
                                                 onUpdateFavicon,
                                                 onNavigate,
                                                 onUpdateUrl
                                               }) => {
  const webviewRef = useRef<Electron.WebviewTag>(null)

  useEffect(() => {
    if (!tab || !webviewRef.current) return

    const webview = webviewRef.current

    const handleLoadStart = () => {
      onUpdateLoading(tab.id, true)
    }

    const handleLoadStop = () => {
      onUpdateLoading(tab.id, false)

      // Get page title
      const title = webview.getTitle() || tab.url
      onUpdateTitle(tab.id, title)
    }

    const handlePageTitleUpdated = (event: any) => {
      onUpdateTitle(tab.id, event.title)
    }

    const handlePageFaviconUpdated = (event: any) => {
      if (event.favicons && event.favicons.length > 0) {
        onUpdateFavicon(tab.id, event.favicons[0])
      }
    }

    const handleDidFailLoad = (event: any) => {
      onUpdateLoading(tab.id, false)
      console.error('Failed to load:', event.errorDescription)
    }

    const handleDidNavigate = (event: any) => {
      // Update the URL in the address bar when navigation occurs
      if (event.url !== tab.url) {
        onUpdateUrl(tab.id, event.url)
      }
    }

    const handleNewWindow = (event: any) => {
      // Handle new window requests by opening in a new tab
      event.preventDefault()
      onNavigate(tab.id, event.url)
    }



    // Add event listeners
    webview.addEventListener('did-start-loading', handleLoadStart)
    webview.addEventListener('did-stop-loading', handleLoadStop)
    webview.addEventListener('page-title-updated', handlePageTitleUpdated)
    webview.addEventListener('page-favicon-updated', handlePageFaviconUpdated)
    webview.addEventListener('did-fail-load', handleDidFailLoad)
    webview.addEventListener('did-navigate', handleDidNavigate)
    webview.addEventListener('new-window', handleNewWindow)


    return () => {
      webview.removeEventListener('did-start-loading', handleLoadStart)
      webview.removeEventListener('did-stop-loading', handleLoadStop)
      webview.removeEventListener('page-title-updated', handlePageTitleUpdated)
      webview.removeEventListener('page-favicon-updated', handlePageFaviconUpdated)
      webview.removeEventListener('did-fail-load', handleDidFailLoad)
      webview.removeEventListener('did-navigate', handleDidNavigate)
      webview.removeEventListener('new-window', handleNewWindow)

    }
  }, [tab?.id, onUpdateLoading, onUpdateTitle, onUpdateFavicon])

  // Track the last loaded URL to prevent unnecessary reloads - unique per tab
  const lastLoadedUrlRef = React.useRef<string>('')
  const hasInitializedRef = React.useRef<boolean>(false)
  const tabIdRef = React.useRef<string>(tab.id)

  useEffect(() => {
    if (tab && webviewRef.current && tab.url !== 'about:blank') {
      // Only load if this is a genuinely new URL for this specific tab
      if (lastLoadedUrlRef.current !== tab.url) {
        // Set loading state immediately when starting to load
        onUpdateLoading(tab.id, true)

        if (hasInitializedRef.current) {
          // Use loadURL for subsequent navigations to avoid reloading
          webviewRef.current.loadURL(tab.url)
        } else {
          // Use src for initial load
          webviewRef.current.src = tab.url
          hasInitializedRef.current = true
        }

        lastLoadedUrlRef.current = tab.url
      }
    } else if (tab && tab.url === 'about:blank') {
      // For about:blank tabs, clear the last loaded URL but don't load anything
      lastLoadedUrlRef.current = 'about:blank'
    }
  }, [tab?.url, tab?.id, onUpdateLoading])

  // Reset refs when tab changes to ensure proper initialization
  useEffect(() => {
    // Only reset if this is actually a different tab
    if (tabIdRef.current !== tab.id) {
      lastLoadedUrlRef.current = ''
      hasInitializedRef.current = false
      tabIdRef.current = tab.id
    }
  }, [tab?.id])

  useEffect(() => {
    const handleRefresh = (event: CustomEvent) => {
      if (tab && event.detail.tabId === tab.id && webviewRef.current) {
        webviewRef.current.reload()
      }
    }

    const handleShowDevTools = (event: CustomEvent) => {
      if (tab && event.detail.tabId === tab.id && webviewRef.current) {
        webviewRef.current.openDevTools()
      }
    }

    window.addEventListener('browser-refresh', handleRefresh as EventListener)
    window.addEventListener('browser-show-devtools', handleShowDevTools as EventListener)
    return () => {
      window.removeEventListener('browser-refresh', handleRefresh as EventListener)
      window.removeEventListener('browser-show-devtools', handleShowDevTools as EventListener)
    }
  }, [tab?.id])

  const handleRetry = () => {
    if (tab && webviewRef.current) {
      webviewRef.current.reload()
    }
  }

  return (
    <div
      className={`absolute inset-0 ${isActive ? 'block' : 'hidden'}`}
      style={{zIndex: isActive ? 1 : 0}}
    >
      {tab.isLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-background border rounded-lg px-4 py-2 shadow-lg flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      )}

      {/* Always render webview element to prevent unmounting/remounting, but hide for about:blank */}
      <webview
        ref={webviewRef}
        className={`w-full h-full bg-white ${tab.url === 'about:blank' ? 'hidden' : ''}`}
        allowpopups={true}
        webpreferences="contextIsolation=true, nodeIntegration=false, webSecurity=false"

        useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0"
      />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-4 right-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRetry}
            className="pointer-events-auto opacity-0 hover:opacity-100 transition-opacity"
          >
            <AlertCircle className="h-4 w-4 mr-2"/>
            Retry
          </Button>
        </div>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Only re-render if tab ID, URL, or active state changes
  return (
    prevProps.tab.id === nextProps.tab.id &&
    prevProps.tab.url === nextProps.tab.url &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.tab.isLoading === nextProps.tab.isLoading
  )
})

export const WebView: React.FC = () => {
  const {state, updateTabLoading, updateTabTitle, updateTabFavicon, navigateTab, updateTabUrl, setTabNavigationBar} = useBrowser()

  const activeTab = state.tabs.find(tab => tab.id === state.activeTabId)

  const handleAppClick = (app: any) => {
    if (activeTab) {
      // Navigate to the app in the current tab
      navigateTab(activeTab.id, app.url)
      // Set the navigation bar visibility based on the app setting
      setTabNavigationBar(activeTab.id, !app.hideNavigationBar)
    }
  }

  if (!activeTab) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-4">
          <Globe className="h-12 w-12 mx-auto text-muted-foreground"/>
          <p className="text-muted-foreground">No active tab</p>
        </div>
      </div>
    )
  }

  const apps = state.settings.apps
  const groupedApps = apps.reduce((groups, app) => {
    const category = app.category || 'Other'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(app)
    return groups
  }, {} as Record<string, any[]>)

  return (
    <div className="flex-1 relative bg-background">
      {/* Always render all tabs to prevent unmounting/remounting */}
      {state.tabs.map(tab => (
        <TabWebView
          key={`tab-${tab.id}`} // Ensure unique key per tab
          tab={tab}
          isActive={tab.id === state.activeTabId}
          onUpdateLoading={updateTabLoading}
          onUpdateTitle={updateTabTitle}
          onUpdateFavicon={updateTabFavicon}
          onNavigate={navigateTab}
          onUpdateUrl={updateTabUrl}
        />
      ))}

      {/* Overlay new tab page when active tab is about:blank */}
      {activeTab.url === 'about:blank' && (
        <div className="absolute inset-0 flex-1 overflow-auto bg-background z-10">
          <div className="max-w-6xl mx-auto p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">New Tab</h1>
              <p className="text-muted-foreground">
                Choose an app below or enter a URL in the address bar
              </p>
            </div>

            {state.settings.showAppsInNewTab && (
              <div className="space-y-8">
                {Object.entries(groupedApps).map(([category, categoryApps]) => (
                  <div key={category}>
                    <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
                      {category}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {categoryApps.map((app) => (
                        <Card
                          key={app.id}
                          className="p-4 cursor-pointer hover:bg-muted/50 transition-all hover:scale-105 group"
                          onClick={() => handleAppClick(app)}
                        >
                          <div className="text-center space-y-3">
                            <div className="w-12 h-12 mx-auto rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                              <img
                                src={app.iconUrl}
                                alt={app.name}
                                className="w-10 h-10 object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.parentElement!.innerHTML = `
                                    <svg class="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
                                    </svg>
                                  `
                                }}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-medium truncate group-hover:text-primary">
                                {app.name}
                              </p>
                              {app.description && (
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                  {app.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!state.settings.showAppsInNewTab && (
              <div className="text-center py-16">
                <Globe className="h-16 w-16 mx-auto text-muted-foreground mb-4"/>
                <p className="text-muted-foreground">
                  Apps are hidden. Enable them in Settings to see your quick access apps.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
