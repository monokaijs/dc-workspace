import React, {useEffect, useRef, useState} from 'react'
import {useBrowser} from '@/contexts/BrowserContext'
import {SearchSuggestion} from '@/types/browser'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {Clock, Globe, Search} from 'lucide-react'
import {getSearchSuggestions, isValidUrl, normalizeUrl} from '@/utils/url'
import {cn} from '@/lib/utils'

interface SearchSuggestionsProps {
  query: string
  onSelect: (suggestion: string) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  isInteractingRef?: React.MutableRefObject<boolean>
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
                                                                      query,
                                                                      onSelect,
                                                                      isOpen,
                                                                      onOpenChange,
                                                                      children,
                                                                      isInteractingRef
                                                                    }) => {
  const {getHistory} = useBrowser()
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const debounceRef = useRef<NodeJS.Timeout>()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query.trim() || !isOpen) {
      setSuggestions([])
      setSelectedIndex(-1)
      return
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      setSelectedIndex(-1)

      try {
        const allSuggestions: SearchSuggestion[] = []

        const history = getHistory()
        const historySuggestions = history
          .filter(entry =>
            entry.url.toLowerCase().includes(query.toLowerCase()) ||
            entry.title.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 5)
          .map(entry => ({
            id: `history-${entry.id}`,
            text: entry.title,
            url: entry.url,
            type: 'history' as const,
            favicon: entry.favicon
          }))

        allSuggestions.push(...historySuggestions)

        if (!isValidUrl(query) && !query.includes('.')) {
          try {
            const searchSuggestions = await getSearchSuggestions(query)
            const searchItems = searchSuggestions
              .slice(0, 8)
              .map((suggestion, index) => ({
                id: `search-${index}`,
                text: suggestion,
                url: `https://www.google.com/search?q=${encodeURIComponent(suggestion)}`,
                type: 'search' as const
              }))

            allSuggestions.push(...searchItems)
          } catch (error) {
            console.error('Failed to fetch search suggestions:', error)
          }
        }

        if (query.includes('.') && !query.startsWith('http')) {
          allSuggestions.unshift({
            id: 'direct-url',
            text: `Go to ${query}`,
            url: normalizeUrl(query),
            type: 'bookmark'
          })
        }

        setSuggestions(allSuggestions)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, isOpen, getHistory])

  const handleSelect = (suggestion: SearchSuggestion) => {
    onSelect(suggestion.url)
    onOpenChange(false)
    setSelectedIndex(-1)
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (isInteractingRef) {
      isInteractingRef.current = true
    }
    handleSelect(suggestion)
    setTimeout(() => {
      if (isInteractingRef) {
        isInteractingRef.current = false
      }
    }, 100)
  }



  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'history':
        return <Clock className="h-4 w-4 text-muted-foreground"/>
      case 'search':
        return <Search className="h-4 w-4 text-muted-foreground"/>
      case 'bookmark':
        return <Globe className="h-4 w-4 text-muted-foreground"/>
      default:
        return <Search className="h-4 w-4 text-muted-foreground"/>
    }
  }

  const groupedSuggestions = suggestions.reduce((groups, suggestion) => {
    if (!groups[suggestion.type]) {
      groups[suggestion.type] = []
    }
    groups[suggestion.type].push(suggestion)
    return groups
  }, {} as Record<string, SearchSuggestion[]>)

  const getGroupTitle = (type: string) => {
    switch (type) {
      case 'history':
        return 'Recently visited'
      case 'search':
        return 'Search suggestions'
      case 'bookmark':
        return 'Go to site'
      default:
        return 'Suggestions'
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      {query && (
        <PopoverContent
          className="w-[600px] p-0"
          align="start"
          side="bottom"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div
            ref={dropdownRef}
            className="max-h-[300px] overflow-y-auto overflow-x-hidden bg-popover text-popover-foreground rounded-md scrollbar-thin"
          >
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading suggestions...
              </div>
            ) : suggestions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {query.trim() ? 'No suggestions found' : 'Start typing to see suggestions'}
              </div>
            ) : (
              <div>
                {Object.entries(groupedSuggestions).map(([type, typeSuggestions]) => (
                  <div key={type} className="p-1">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      {getGroupTitle(type)}
                    </div>
                    {typeSuggestions.map((suggestion) => {
                      const globalIndex = suggestions.findIndex(s => s.id === suggestion.id)
                      const isSelected = globalIndex === selectedIndex

                      return (
                        <div
                          key={suggestion.id}
                          className={cn(
                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            isSelected && "bg-accent text-accent-foreground"
                          )}
                          onClick={() => handleSuggestionClick(suggestion)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                        >
                          <div className="flex items-center gap-3 px-2 py-2 flex-1 min-w-0">
                            {suggestion.favicon ? (
                              <img
                                src={suggestion.favicon}
                                alt=""
                                className="w-4 h-4 flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              getSuggestionIcon(suggestion.type)
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {suggestion.text}
                              </div>
                              {suggestion.type === 'history' && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {suggestion.url}
                                </div>
                              )}
                            </div>

                            {suggestion.type === 'search' && (
                              <div className="text-xs text-muted-foreground flex-shrink-0">
                                Search
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      )}
    </Popover>
  )
}
