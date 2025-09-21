import React, { useState, useMemo } from 'react'
import { useBrowser } from '@/contexts/BrowserContext'
import { HistoryEntry } from '@/types/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Clock, Search, Trash2, ExternalLink, MoreVertical } from 'lucide-react'
import { extractDomain, formatUrlForDisplay } from '@/utils/url'

interface HistoryPanelProps {
  trigger?: React.ReactNode
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ trigger }) => {
  const { getHistory, clearHistory, navigateTab, state } = useBrowser()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('all')

  const history = getHistory()

  const filteredHistory = useMemo(() => {
    let filtered = history

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(query) || 
        entry.url.toLowerCase().includes(query)
      )
    }

    const now = Date.now()
    const timeRanges = {
      today: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      all: Infinity
    }

    if (selectedTimeRange !== 'all') {
      const cutoff = now - timeRanges[selectedTimeRange]
      filtered = filtered.filter(entry => entry.timestamp > cutoff)
    }

    return filtered
  }, [history, searchQuery, selectedTimeRange])

  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: HistoryEntry[] } = {}
    
    filteredHistory.forEach(entry => {
      const date = new Date(entry.timestamp)
      const dateKey = date.toDateString()
      
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(entry)
    })

    return Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    )
  }, [filteredHistory])

  const handleNavigateToUrl = (url: string) => {
    if (state.activeTabId) {
      navigateTab(state.activeTabId, url)
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Clock className="h-4 w-4 mr-2" />
            History
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Navigation History
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {selectedTimeRange === 'all' ? 'All time' : 
                   selectedTimeRange === 'today' ? 'Today' :
                   selectedTimeRange === 'week' ? 'This week' : 'This month'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedTimeRange('today')}>
                  Today
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedTimeRange('week')}>
                  This week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedTimeRange('month')}>
                  This month
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedTimeRange('all')}>
                  All time
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="destructive" 
              size="sm"
              onClick={clearHistory}
              disabled={history.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>

          <ScrollArea className="h-[500px]">
            {groupedHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No matching history found' : 'No navigation history'}
              </div>
            ) : (
              <div className="space-y-6">
                {groupedHistory.map(([dateString, entries]) => (
                  <div key={dateString}>
                    <div className="sticky top-0 bg-background py-2">
                      <h3 className="font-semibold text-sm text-muted-foreground">
                        {formatRelativeDate(dateString)}
                      </h3>
                      <Separator className="mt-2" />
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      {entries.map((entry) => (
                        <div 
                          key={entry.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer group"
                          onClick={() => handleNavigateToUrl(entry.url)}
                        >
                          {entry.favicon ? (
                            <img 
                              src={entry.favicon} 
                              alt="" 
                              className="w-4 h-4 flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-4 h-4 bg-muted rounded-sm flex-shrink-0" />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {entry.title}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {formatUrlForDisplay(entry.url)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {extractDomain(entry.url)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(entry.timestamp)}
                            </span>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleNavigateToUrl(entry.url)
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Open
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigator.clipboard.writeText(entry.url)
                                  }}
                                >
                                  Copy URL
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
