import React, { useState, useEffect, useRef } from 'react'
import { useBrowser } from '@/contexts/BrowserContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchSuggestions } from './SearchSuggestions'
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Home,
  Shield,
  Search,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { normalizeUrl, formatUrlForDisplay, isValidUrl } from '@/utils/url'

export const SidePanel: React.FC = () => {
  const { state, setPanelUrl } = useBrowser()
  const [addressValue, setAddressValue] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const webviewRef = useRef<any>(null)
  const isInteractingWithSuggestions = useRef(false)

  useEffect(() => {
    if (!isEditing && state.panelUrl) {
      setAddressValue(formatUrlForDisplay(state.panelUrl))
    }
  }, [state.panelUrl, isEditing])

  useEffect(() => {
    const webview = webviewRef.current
    if (!webview) return

    const handleLoadStart = () => setIsLoading(true)
    const handleLoadStop = () => {
      setIsLoading(false)
      setCanGoBack(webview.canGoBack())
      setCanGoForward(webview.canGoForward())
    }
    const handleNavigate = (event: any) => {
      if (event.url && event.url !== state.panelUrl) {
        setPanelUrl(event.url)
      }
      setCanGoBack(webview.canGoBack())
      setCanGoForward(webview.canGoForward())
    }

    const handleDomReady = () => {
      setCanGoBack(webview.canGoBack())
      setCanGoForward(webview.canGoForward())
    }

    webview.addEventListener('loadstart', handleLoadStart)
    webview.addEventListener('loadstop', handleLoadStop)
    webview.addEventListener('did-navigate', handleNavigate)
    webview.addEventListener('did-navigate-in-page', handleNavigate)
    webview.addEventListener('dom-ready', handleDomReady)

    return () => {
      webview.removeEventListener('loadstart', handleLoadStart)
      webview.removeEventListener('loadstop', handleLoadStop)
      webview.removeEventListener('did-navigate', handleNavigate)
      webview.removeEventListener('did-navigate-in-page', handleNavigate)
      webview.removeEventListener('dom-ready', handleDomReady)
    }
  }, [state.panelUrl, setPanelUrl])

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const url = normalizeUrl(addressValue)
    setPanelUrl(url)
    setIsEditing(false)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const handleSuggestionSelect = (url: string) => {
    setPanelUrl(url)
    setIsEditing(false)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const handleAddressFocus = () => {
    setIsEditing(true)
    setShowSuggestions(true)
    if (state.panelUrl !== 'about:blank') {
      setAddressValue(state.panelUrl || '')
    } else {
      setAddressValue('')
    }
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleAddressBlur = (e: React.FocusEvent) => {
    if (isInteractingWithSuggestions.current ||
        (e.relatedTarget && e.relatedTarget.closest('[data-radix-popper-content-wrapper]'))) {
      return
    }

    setTimeout(() => {
      if (!isInteractingWithSuggestions.current) {
        setIsEditing(false)
        setShowSuggestions(false)
        if (state.panelUrl) {
          setAddressValue(formatUrlForDisplay(state.panelUrl))
        }
      }
    }, 150)
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressValue(e.target.value)
    setShowSuggestions(true)
  }

  const handleBack = () => {
    if (webviewRef.current && canGoBack) {
      webviewRef.current.goBack()
    }
  }

  const handleForward = () => {
    if (webviewRef.current && canGoForward) {
      webviewRef.current.goForward()
    }
  }

  const handleRefresh = () => {
    if (webviewRef.current) {
      webviewRef.current.reload()
    }
  }

  const handleHome = () => {
    setPanelUrl('https://www.google.com')
  }

  const handleClose = () => {
    setPanelUrl(null)
  }

  const getSecurityIcon = () => {
    if (!state.panelUrl || state.panelUrl === 'about:blank') {
      return null
    }

    const isSecure = state.panelUrl.startsWith('https://')
    return (
      <Shield
        className={cn(
          "h-4 w-4",
          isSecure ? "text-green-600" : "text-yellow-600"
        )}
      />
    )
  }

  const isSearchQuery = (value: string) => {
    return !isValidUrl(value) && !value.includes('.')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-2 bg-background border-b">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={!canGoBack}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleForward}
            disabled={!canGoForward}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={!state.panelUrl}
            className="h-8 w-8 p-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleHome}
            disabled={!state.panelUrl}
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
            isInteractingRef={isInteractingWithSuggestions}
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
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-8 w-8 p-0 hover:bg-red-500/20 text-muted-foreground hover:text-red-600"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <webview
          ref={webviewRef}
          src={state.panelUrl || undefined}
          allowpopups={true}
          webpreferences="contextIsolation=true, nodeIntegration=false, webSecurity=false"
          className="w-full h-full bg-white"
        />
      </div>
    </div>
  )
}
