import React, {useEffect, useState} from 'react'
import {BrowserProvider, useBrowser} from '@/contexts/BrowserContext'
import {NotificationProvider, useNotifications} from '@/contexts/NotificationContext'
import {TabBar} from './TabBar'
import {NavigationBar} from './NavigationBar'
import {WebView} from './WebView'
import {HistoryPanel} from './HistoryPanel'
import {SettingsPage} from './SettingsPage'
import {DataManagement} from './DataManagement'
import {NotificationButton} from '@/components/notifications/NotificationButton'
import {UpdateNotification} from '../UpdateNotification'
import {Button} from '@/components/ui/button'
import {Menu, Minus, Navigation, Settings, Square, X, Database} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {useKeyboardShortcuts} from '@/hooks/useKeyboardShortcuts'
import {PushNotificationService} from '@/services/pushNotificationService'

interface BrowserMenuProps {
  onOpenSettings: () => void
}

const BrowserMenu: React.FC<BrowserMenuProps> = ({onOpenSettings}) => {
  const {state, toggleTabNavigationBar} = useBrowser()
  const activeTab = state.tabs.find(tab => tab.id === state.activeTabId)

  const handleToggleNavigationBar = () => {
    if (activeTab) {
      toggleTabNavigationBar(activeTab.id)
    }
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
              History
            </DropdownMenuItem>
          }
        />
        <DropdownMenuSeparator/>
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
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClose}
        className="h-8 w-8 p-0 hover:bg-red-500/20 text-muted-foreground hover:text-red-600"
      >
        <X className="h-3 w-3"/>
      </Button>
    </div>
  )
}

const BrowserContent: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false)
  const {state} = useBrowser()
  const {addNotification} = useNotifications()
  const activeTab = state.tabs.find(tab => tab.id === state.activeTabId)

  // Enable keyboard shortcuts
  useKeyboardShortcuts()

  // Initialize push notification service
  useEffect(() => {
    const initNotifications = async () => {
      try {
        console.log('Initializing push notification service...')
        const pushService = PushNotificationService.getInstance()

        // Request notification permission first
        const permission = await pushService.requestPermission()
        console.log('Notification permission:', permission)

        // Initialize the service with callback to add notifications to history
        await pushService.initialize((data) => {
          console.log('Adding notification to history:', data)
          addNotification({
            title: data.title,
            body: data.body,
            icon: data.icon,
            data: data.data
          })
        }, '1234567890') // Use your actual Firebase sender ID here

        console.log('Push notification service initialized successfully')
      } catch (error) {
        console.error('Failed to initialize notification service:', error)
      }
    }

    // Add a small delay to ensure the window is fully loaded
    const timer = setTimeout(initNotifications, 1000)

    // Cleanup on unmount
    return () => {
      clearTimeout(timer)
      const pushService = PushNotificationService.getInstance()
      pushService.destroy()
    }
  }, [addNotification])

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
              ← Back to Browser
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
          <span className="text-sm font-medium">Browser</span>
        </div>

        <div className="flex items-center gap-2" style={{WebkitAppRegion: 'no-drag'} as any}>
          <NotificationButton/>
          <WindowControls/>
        </div>
      </div>

      <TabBar/>
      {activeTab?.showNavigationBar && <NavigationBar/>}
      <WebView/>
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
