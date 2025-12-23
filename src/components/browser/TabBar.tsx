import React, { useState } from 'react'
import { useBrowser } from '@/contexts/BrowserContext'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator
} from '@/components/ui/context-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, X, RotateCcw, Copy, Pin, PinOff, Files, PanelRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export const TabBar: React.FC = () => {
  const {
    state,
    createTab,
    cloneTab,
    closeTab,
    switchTab,
    refreshTab,
    reorderTabs,
    pinTab,
    unpinTab,
    sendTabToPanel
  } = useBrowser()
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [showPinConfirmDialog, setShowPinConfirmDialog] = useState<string | null>(null)

  const handleTabClick = (e: React.MouseEvent, tabId: string) => {
    if (e.button === 1) {
      e.preventDefault()
      const tab = state.tabs.find(t => t.id === tabId)
      if (tab?.pinned) {
        setShowPinConfirmDialog(tabId)
      } else {
        closeTab(tabId)
      }
    } else if (e.button === 0) {
      switchTab(tabId)
    }
  }

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    const tab = state.tabs.find(t => t.id === tabId)
    if (tab?.pinned) {
      setShowPinConfirmDialog(tabId)
    } else {
      closeTab(tabId)
    }
  }

  const handleNewTab = () => {
    createTab()
  }

  const handleCloneTab = (tabId: string) => {
    cloneTab(tabId)
  }

  const handlePinTab = (tabId: string) => {
    const tab = state.tabs.find(t => t.id === tabId)
    if (tab?.pinned) {
      unpinTab(tabId)
    } else {
      pinTab(tabId)
    }
  }

  const handleConfirmClosePinnedTab = () => {
    if (showPinConfirmDialog) {
      closeTab(showPinConfirmDialog)
      setShowPinConfirmDialog(null)
    }
  }

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTabId(tabId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', tabId)
  }

  const handleDragEnd = () => {
    setDraggedTabId(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    const draggedIndex = state.tabs.findIndex(tab => tab.id === draggedId)

    if (draggedIndex !== -1 && draggedIndex !== dropIndex) {
      reorderTabs(draggedIndex, dropIndex)
    }

    setDraggedTabId(null)
    setDragOverIndex(null)
  }

  const truncateTitle = (title: string, maxLength: number = 20) => {
    if (title.length <= maxLength) return title
    return title.substring(0, maxLength) + '...'
  }

  const pinnedTabs = state.tabs.filter(tab => tab.pinned)
  const unpinnedTabs = state.tabs.filter(tab => !tab.pinned)
  const allTabs = [...pinnedTabs, ...unpinnedTabs]

  return (
    <div className="flex items-center bg-background border-b">
      <ScrollArea className="flex-1">
        <div className="flex items-center">
          {allTabs.map((tab, index) => (
            <ContextMenu key={tab.id}>
              <ContextMenuTrigger>
                <div
                  className={cn(
                    "flex items-center gap-2 px-4 h-10 border-b-2 border-r cursor-pointer select-none min-w-0 group relative",
                    "hover:bg-muted/50 transition-colors",
                    tab.id === state.activeTabId
                      ? "bg-background border-b-primary"
                      : "bg-muted/20 border-transparent",
                    draggedTabId === tab.id && "opacity-50",
                    dragOverIndex === index && "border-l-2 border-l-primary",
                    tab.pinned ? "w-auto" : "w-[200px]",
                  )}
                  onClick={(e) => handleTabClick(e, tab.id)}
                  onMouseDown={(e) => e.button === 1 && e.preventDefault()}
                  onAuxClick={(e) => {
                    if (e.button === 1) {
                      e.preventDefault()
                      handleCloseTab(e as any, tab.id)
                    }
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, tab.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
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

                  {!tab.pinned && (
                    <span className="text-sm truncate flex-1 min-w-0">
                      {truncateTitle(tab.title)}
                    </span>
                  )}

                  {state.tabs.length > 1 && !tab.pinned && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-mr-2 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground flex-shrink-0"
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
                <ContextMenuItem onClick={() => handleCloneTab(tab.id)}>
                  <Files className="h-4 w-4 mr-2" />
                  Clone Tab
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => refreshTab(tab.id)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Refresh
                </ContextMenuItem>
                <ContextMenuItem onClick={() => sendTabToPanel(tab.id)}>
                  <PanelRight className="h-4 w-4 mr-2" />
                  Send to Panel
                </ContextMenuItem>

                <ContextMenuItem
                  onClick={() => navigator.clipboard.writeText(tab.url)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => handlePinTab(tab.id)}>
                  {tab.pinned ? (
                    <>
                      <PinOff className="h-4 w-4 mr-2" />
                      Unpin Tab
                    </>
                  ) : (
                    <>
                      <Pin className="h-4 w-4 mr-2" />
                      Pin Tab
                    </>
                  )}
                </ContextMenuItem>
                {state.tabs.length > 1 && (
                  <ContextMenuItem
                    onClick={() => handleCloseTab(new MouseEvent('click') as any, tab.id)}
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

      <AlertDialog open={!!showPinConfirmDialog} onOpenChange={() => setShowPinConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Pinned Tab</AlertDialogTitle>
            <AlertDialogDescription>
              This tab is pinned. Are you sure you want to close it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClosePinnedTab}>
              Close Tab
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
