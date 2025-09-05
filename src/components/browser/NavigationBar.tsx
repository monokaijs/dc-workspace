import React, { useState, useEffect, useRef } from 'react'
import { useBrowser } from '@/contexts/BrowserContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { SearchSuggestions } from './SearchSuggestions'
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Home,
  Shield,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { normalizeUrl, formatUrlForDisplay, isValidUrl } from '@/utils/url'

export const NavigationBar: React.FC = () => {
  const {
    state,
    navigationState,
    navigateTab,
    goBack,
    goForward,
    refreshTab
  } = useBrowser()

  const [addressValue, setAddressValue] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeTab = state.tabs.find(tab => tab.id === state.activeTabId)

  useEffect(() => {
    if (!isEditing && activeTab) {
      setAddressValue(formatUrlForDisplay(activeTab.url))
    }
  }, [activeTab?.url, isEditing])

  useEffect(() => {
    if (navigationState.isLoading) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 100)

      return () => clearInterval(interval)
    } else {
      setProgress(100)
      const timeout = setTimeout(() => setProgress(0), 500)
      return () => clearTimeout(timeout)
    }
  }, [navigationState.isLoading])

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTab) return

    const url = normalizeUrl(addressValue)
    navigateTab(activeTab.id, url)
    setIsEditing(false)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const handleSuggestionSelect = (url: string) => {
    if (!activeTab) return

    navigateTab(activeTab.id, url)
    setIsEditing(false)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const handleAddressFocus = () => {
    setIsEditing(true)
    setShowSuggestions(true)
    if (activeTab?.url !== 'about:blank') {
      setAddressValue(activeTab?.url || '')
    }
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleAddressBlur = () => {
    setTimeout(() => {
      setIsEditing(false)
      setShowSuggestions(false)
      if (activeTab) {
        setAddressValue(formatUrlForDisplay(activeTab.url))
      }
    }, 150)
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressValue(e.target.value)
    setShowSuggestions(true)
  }

  const handleBack = () => {
    if (activeTab && navigationState.canGoBack) {
      goBack(activeTab.id)
    }
  }

  const handleForward = () => {
    if (activeTab && navigationState.canGoForward) {
      goForward(activeTab.id)
    }
  }

  const handleRefresh = () => {
    if (activeTab) {
      refreshTab(activeTab.id)
      // Also trigger a reload event for webview components to listen to
      window.dispatchEvent(new CustomEvent('browser-refresh', { detail: { tabId: activeTab.id } }))
    }
  }

  const handleHome = () => {
    if (activeTab) {
      navigateTab(activeTab.id, 'https://www.google.com')
    }
  }

  const getSecurityIcon = () => {
    if (!activeTab?.url || activeTab.url === 'about:blank') {
      return null
    }

    const isSecure = activeTab.url.startsWith('https://')
    return (
      <Shield
        className={cn(
          "h-4 w-4",
          isSecure ? "text-green-600" : "text-yellow-600"
        )}
      />
    )
  }

  const isSearchQuery = (input: string) => {
    return !isValidUrl(input) && !input.includes('.')
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-background border-b">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={!navigationState.canGoBack}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleForward}
          disabled={!navigationState.canGoForward}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={!activeTab}
          className="h-8 w-8 p-0"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleHome}
          disabled={!activeTab}
          className="h-8 w-8 p-0"
        >
          <Home className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 relative">
        <SearchSuggestions
          query={isEditing ? addressValue : ''}
          onSelect={handleSuggestionSelect}
          isOpen={showSuggestions && isEditing}
          onOpenChange={setShowSuggestions}
        >
          <form onSubmit={handleAddressSubmit} className="relative w-full">
            <div className="relative flex items-center">
              {getSecurityIcon() && (
                <div className="absolute left-3 z-10">
                  {getSecurityIcon()}
                </div>
              )}

              <Input
                ref={inputRef}
                value={addressValue}
                onChange={handleAddressChange}
                onFocus={handleAddressFocus}
                onBlur={handleAddressBlur}
                placeholder="Search or enter address"
                className={cn(
                  "pr-10",
                  getSecurityIcon() ? "pl-10" : "pl-3"
                )}
              />

              {isEditing && isSearchQuery(addressValue) && (
                <div className="absolute right-3 z-10">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          </form>
        </SearchSuggestions>

        {navigationState.isLoading && progress > 0 && progress < 100 && (
          <Progress
            value={progress}
            className="absolute bottom-0 left-0 right-0 h-1"
          />
        )}
      </div>


    </div>
  )
}
