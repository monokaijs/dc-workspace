import React, { useState, useEffect, useRef } from 'react'
import { useBrowser } from '@/contexts/BrowserContext'
import { SearchSuggestion } from '@/types/browser'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Clock, Search, Globe } from 'lucide-react'
import { getSearchSuggestions, normalizeUrl, isValidUrl } from '@/utils/url'

interface SearchSuggestionsProps {
  query: string
  onSelect: (suggestion: string) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  query,
  onSelect,
  isOpen,
  onOpenChange,
  children
}) => {
  const { getHistory } = useBrowser()
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!query.trim() || !isOpen) {
      setSuggestions([])
      return
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)

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
  }

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'history':
        return <Clock className="h-4 w-4 text-muted-foreground" />
      case 'search':
        return <Search className="h-4 w-4 text-muted-foreground" />
      case 'bookmark':
        return <Globe className="h-4 w-4 text-muted-foreground" />
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />
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
      <PopoverContent
        className="w-[600px] p-0"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <Command>
          <CommandList>
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading suggestions...
              </div>
            ) : suggestions.length === 0 ? (
              <CommandEmpty>
                {query.trim() ? 'No suggestions found' : 'Start typing to see suggestions'}
              </CommandEmpty>
            ) : (
              Object.entries(groupedSuggestions).map(([type, typeSuggestions]) => (
                <CommandGroup key={type} heading={getGroupTitle(type)}>
                  {typeSuggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.id}
                      value={suggestion.text}
                      onSelect={() => handleSelect(suggestion)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
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
                      </div>

                      {suggestion.type === 'search' && (
                        <div className="text-xs text-muted-foreground flex-shrink-0">
                          Search
                        </div>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
