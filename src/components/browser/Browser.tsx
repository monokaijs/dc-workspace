import React, {useState, useEffect} from 'react'
import {BrowserProvider, useBrowser} from '@/contexts/BrowserContext'
import {NotificationProvider} from '@/contexts/NotificationContext'
import {TabBar} from './TabBar'
import {NavigationBar} from './NavigationBar'
import {WebView} from './WebView'
import {HistoryPanel} from './HistoryPanel'
import {SettingsPage} from './SettingsPage'
import {DataManagement} from './DataManagement'
import {SidePanel} from './SidePanel'
import {NotificationButton} from '@/components/notifications/NotificationButton'
import {UpdateNotification} from '../UpdateNotification'
import {Button} from '@/components/ui/button'
import {
  Menu,
  Minus,
  Navigation,
  Settings,
  Square,
  X,
  Database,
  Code,
  ChevronLeft,
  PanelLeftOpen,
  HistoryIcon, Info
} from 'lucide-react'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import {useKeyboardShortcuts} from '@/hooks/useKeyboardShortcuts'


interface BrowserMenuProps {
  onOpenSettings: () => void
}

const BrowserMenu: React.FC<BrowserMenuProps> = ({onOpenSettings}) => {
  const {state, toggleTabNavigationBar, setPanelUrl} = useBrowser()
  const activeTab = state.tabs.find(tab => tab.id === state.activeTabId)

  const handleToggleNavigationBar = () => {
    if (activeTab) {
      toggleTabNavigationBar(activeTab.id)
    }
  }

  const handleShowDevTools = () => {
    if (activeTab) {
      window.dispatchEvent(new CustomEvent('browser-show-devtools', { detail: { tabId: activeTab.id } }))
    }
  }

  const handleOpenSidePanel = () => {
    setPanelUrl('https://www.google.com')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
          <Menu className="h-4 w-4"/>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuCheckboxItem
          checked={activeTab?.showNavigationBar ?? true}
          onCheckedChange={handleToggleNavigationBar}
          disabled={!activeTab}
        >
          <Navigation className="h-4 w-4 mr-2"/>
          Show Navigation Bar
        </DropdownMenuCheckboxItem>
        <DropdownMenuItem onClick={handleOpenSidePanel}>
          <PanelLeftOpen className="h-4 w-4 mr-2"/>
          Open Side Panel
        </DropdownMenuItem>
        <DropdownMenuSeparator/>
        <DropdownMenuItem onClick={onOpenSettings}>
          <Settings className="h-4 w-4 mr-2"/>
          Settings
        </DropdownMenuItem>
        <DataManagement
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Database className="h-4 w-4 mr-2"/>
              Data Management
            </DropdownMenuItem>
          }
        />
        <DropdownMenuSeparator/>
        <HistoryPanel
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <HistoryIcon className="h-4 w-4 mr-2"/>
              History
            </DropdownMenuItem>
          }
        />
        <DropdownMenuItem
          onClick={handleShowDevTools}
          disabled={!activeTab || activeTab.url === 'about:blank'}
        >
          <Code className="h-4 w-4 mr-2"/>
          Show DevTools
        </DropdownMenuItem>
        <DropdownMenuSeparator/>
        <DropdownMenuItem>
          <Info className="h-4 w-4 mr-2"/>
          About App
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

  const handleQuit = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.quit()
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
        <Minus className="h-3 w-3"/>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleMaximize}
        className="h-8 w-8 p-0 hover:bg-green-500/20 text-muted-foreground hover:text-green-600"
      >
        <Square className="h-3 w-3"/>
      </Button>
      <ContextMenu>
        <ContextMenuTrigger>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 hover:bg-red-500/20 text-muted-foreground hover:text-red-600"
          >
            <X className="h-3 w-3"/>
          </Button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleClose}>
            Hide to Tray
          </ContextMenuItem>
          <ContextMenuItem onClick={handleQuit}>
            Quit Application
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  )
}

const BrowserContent: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false)
  const { state, createTab, setPanelUrl } = useBrowser()

  useEffect(() => {
    const palette = state.settings.colorPalette || 'slate'
    document.documentElement.setAttribute('data-theme', palette)
  }, [state.settings.colorPalette])

  const activeTab = state.tabs.find(tab => tab.id === state.activeTabId)

  // Enable keyboard shortcuts
  useKeyboardShortcuts()

  // Update window title when active tab changes or tab title changes
  useEffect(() => {
    const updateTitle = async () => {
      if (activeTab && activeTab.title && activeTab.title !== 'New Tab') {
        const title = `${activeTab.title} - Workspace`
        await (window as any).electronAPI?.setTitle(title)
      } else {
        await (window as any).electronAPI?.setTitle('Workspace')
      }
    }

    updateTitle()
  }, [activeTab?.title, activeTab?.id])

  const createTabRef = React.useRef(createTab)
  const setPanelUrlRef = React.useRef(setPanelUrl)
  createTabRef.current = createTab
  setPanelUrlRef.current = setPanelUrl

  useEffect(() => {
    const ipc = (window as any).electron?.ipcRenderer
    if (!ipc) return
    let lastOpenedUrl = ''
    let lastOpenedTime = 0
    const onCreateTab = (_e: any, payload: { url: string }) => {
      if (payload?.url) createTabRef.current(payload.url)
    }
    const onOpenNewTab = (_e: any, payload: { url: string }) => {
      if (!payload?.url) return
      const now = Date.now()
      if (payload.url === lastOpenedUrl && now - lastOpenedTime < 500) return
      lastOpenedUrl = payload.url
      lastOpenedTime = now
      createTabRef.current(payload.url)
    }
    const onSendToPanel = (_e: any, payload: { url: string | null }) => {
      setPanelUrlRef.current(payload?.url ?? null)
    }
    ipc.on('host:create-tab', onCreateTab)
    ipc.on('host:open-new-tab', onOpenNewTab)
    ipc.on('host:send-to-panel', onSendToPanel)
    return () => {
      ipc.removeListener('host:create-tab', onCreateTab)
      ipc.removeListener('host:open-new-tab', onOpenNewTab)
      ipc.removeListener('host:send-to-panel', onSendToPanel)
    }
  }, [])




  if (showSettings) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div
          className="flex items-center justify-between px-2 py-1 border-b bg-muted/20 select-none"
          style={{WebkitAppRegion: 'drag'} as any}
        >
          <div className="flex items-center gap-2" style={{WebkitAppRegion: 'no-drag'} as any}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(false)}
              className="h-8 px-3"
            >
              <ChevronLeft className="h-4 w-4"/>
              Back to Workspace
            </Button>
            <span className="text-sm font-medium">Settings</span>
          </div>

          <div className="flex items-center gap-2" style={{WebkitAppRegion: 'no-drag'} as any}>
            <WindowControls/>
          </div>
        </div>

        <SettingsPage/>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div
        className="flex items-center justify-between px-2 py-1 border-b bg-muted/20 select-none"
        style={{WebkitAppRegion: 'drag'} as any}
      >
        <div className="flex items-center gap-2" style={{WebkitAppRegion: 'no-drag'} as any}>
          <BrowserMenu onOpenSettings={() => setShowSettings(true)}/>
          <span className="text-sm font-medium">
            {activeTab && activeTab.title && activeTab.title !== 'New Tab'
              ? `${activeTab.title} - Workspace`
              : 'Workspace'
            }
          </span>
        </div>

        <div className="flex items-center gap-2" style={{WebkitAppRegion: 'no-drag'} as any}>
          <NotificationButton/>
          <WindowControls/>
        </div>
      </div>

      <TabBar/>
      <PanelGroup direction="horizontal" className="flex-1">
        <Panel defaultSize={70} minSize={30} className="flex flex-col overflow-hidden">
          {activeTab?.showNavigationBar && <NavigationBar/>}
          <div className="flex-1 flex overflow-hidden">
            <WebView/>
          </div>
        </Panel>
        {state.panelUrl ? (
          <>
            <PanelResizeHandle className="w-1 bg-border cursor-col-resize" />
            <Panel defaultSize={30} minSize={20} maxSize={70} className="overflow-hidden border-l bg-background">
              <SidePanel />
            </Panel>
          </>
        ) : null}
      </PanelGroup>
      <UpdateNotification/>
    </div>
  )
}

export const Browser: React.FC = () => {
  return (
    <BrowserProvider>
      <NotificationProvider>
        <BrowserContent/>
      </NotificationProvider>
    </BrowserProvider>
  )
}
