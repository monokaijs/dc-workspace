import React, { useState } from 'react'
import { useBrowser } from '@/contexts/BrowserContext'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import { Plus, X, RotateCcw, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

export const TabBar: React.FC = () => {
  const { state, createTab, closeTab, switchTab, refreshTab } = useBrowser()
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null)

  const handleTabClick = (tabId: string) => {
    switchTab(tabId)
  }

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    closeTab(tabId)
  }

  const handleNewTab = () => {
    createTab()
  }

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTabId(tabId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedTabId(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const truncateTitle = (title: string, maxLength: number = 20) => {
    if (title.length <= maxLength) return title
    return title.substring(0, maxLength) + '...'
  }

  return (
    <div className="flex items-center bg-background border-b">
      <ScrollArea className="flex-1">
        <div className="flex items-center">
          {state.tabs.map((tab) => (
            <ContextMenu key={tab.id}>
              <ContextMenuTrigger>
                <div
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 border-r cursor-pointer select-none min-w-0 w-[200px] group relative",
                    "hover:bg-muted/50 transition-colors",
                    tab.id === state.activeTabId
                      ? "bg-background border-b-2 border-b-primary"
                      : "bg-muted/20",
                    draggedTabId === tab.id && "opacity-50"
                  )}
                  onClick={() => handleTabClick(tab.id)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, tab.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                >

                  {tab.isLoading && (
                    <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  )}

                  {tab.favicon && !tab.isLoading ? (
                    <img
                      src={tab.favicon}
                      alt=""
                      className="w-4 h-4 flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : !tab.isLoading && (
                    <div className="w-4 h-4 bg-muted rounded-sm flex-shrink-0" />
                  )}

                  <span className="text-sm truncate flex-1 min-w-0">
                    {truncateTitle(tab.title)}
                  </span>

                  {state.tabs.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground flex-shrink-0"
                      onClick={(e) => handleCloseTab(e, tab.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </ContextMenuTrigger>

              <ContextMenuContent>
                <ContextMenuItem onClick={() => createTab()}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Tab
                </ContextMenuItem>
                <ContextMenuItem onClick={() => refreshTab(tab.id)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Refresh
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => navigator.clipboard.writeText(tab.url)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </ContextMenuItem>
                {state.tabs.length > 1 && (
                  <ContextMenuItem
                    onClick={() => closeTab(tab.id)}
                    className="text-destructive"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Close Tab
                  </ContextMenuItem>
                )}
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      </ScrollArea>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleNewTab}
        className="flex-shrink-0 mx-2"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
