import React, { useState } from 'react'
import { BrowserProvider } from '@/contexts/BrowserContext'
import { TabBar } from './TabBar'
import { NavigationBar } from './NavigationBar'
import { WebView } from './WebView'
import { HistoryPanel } from './HistoryPanel'
import { SettingsPage } from './SettingsPage'
import { Button } from '@/components/ui/button'
import { Menu, Settings, Minus, Square, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

interface BrowserMenuProps {
  onOpenSettings: () => void
}

const BrowserMenu: React.FC<BrowserMenuProps> = ({ onOpenSettings }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
          <Menu className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={onOpenSettings}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <HistoryPanel
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              History
            </DropdownMenuItem>
          }
        />
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          <div className="font-medium mb-1">Keyboard Shortcuts:</div>
          <div className="space-y-0.5">
            <div>Ctrl+T - New Tab</div>
            <div>Ctrl+W - Close Tab</div>
            <div>Ctrl+1-9 - Switch Tab</div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          About Browser
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const WindowControls: React.FC = () => {
  const handleMinimize = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.minimize()
    }
  }

  const handleMaximize = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.maximize()
    }
  }

  const handleClose = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.close()
    }
  }

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleMinimize}
        className="h-8 w-8 p-0 hover:bg-yellow-500/20 text-muted-foreground hover:text-yellow-600"
      >
        <Minus className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleMaximize}
        className="h-8 w-8 p-0 hover:bg-green-500/20 text-muted-foreground hover:text-green-600"
      >
        <Square className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClose}
        className="h-8 w-8 p-0 hover:bg-red-500/20 text-muted-foreground hover:text-red-600"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

const BrowserContent: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false)

  // Enable keyboard shortcuts
  useKeyboardShortcuts()

  if (showSettings) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div
          className="flex items-center justify-between px-2 py-1 border-b bg-muted/20 select-none"
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(false)}
              className="h-8 px-3"
            >
              ← Back to Browser
            </Button>
            <span className="text-sm font-medium">Settings</span>
          </div>

          <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <WindowControls />
          </div>
        </div>

        <SettingsPage />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div
        className="flex items-center justify-between px-2 py-1 border-b bg-muted/20 select-none"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <BrowserMenu onOpenSettings={() => setShowSettings(true)} />
          <span className="text-sm font-medium">Browser</span>
        </div>

        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <WindowControls />
        </div>
      </div>

      <TabBar />
      <NavigationBar />
      <WebView />
    </div>
  )
}

export const Browser: React.FC = () => {
  return (
    <BrowserProvider>
      <BrowserContent />
    </BrowserProvider>
  )
}
