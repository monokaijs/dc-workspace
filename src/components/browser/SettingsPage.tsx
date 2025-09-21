import React, { useState, useEffect } from 'react'
import { useBrowser } from '@/contexts/BrowserContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { App } from '@/types/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Plus, Trash2, Edit, Bell, TestTube, Download, RefreshCw } from 'lucide-react'
import { getFaviconUrl } from '@/utils/url'
import { CustomNotificationService } from '@/services/pushNotificationService'

interface AddAppDialogProps {
  onAddApp: (app: Omit<App, 'id'>) => void
  trigger: React.ReactNode
}

const AddAppDialog: React.FC<AddAppDialogProps> = ({ onAddApp, trigger }) => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    category: '',
    hideNavigationBar: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.url) {
      onAddApp({
        name: formData.name,
        url: formData.url.startsWith('http') ? formData.url : `https://${formData.url}`,
        iconUrl: getFaviconUrl(formData.url.startsWith('http') ? formData.url : `https://${formData.url}`),
        description: formData.description,
        category: formData.category || 'Other',
        hideNavigationBar: formData.hideNavigationBar
      })
      setFormData({ name: '', url: '', description: '', category: '', hideNavigationBar: false })
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New App</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">App Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Gmail"
              required
            />
          </div>
          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="e.g., gmail.com or https://gmail.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the app"
            />
          </div>
          <div>
            <Label htmlFor="category">Category (Optional)</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Productivity, Social, Entertainment"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="hideNavigationBar"
              checked={formData.hideNavigationBar}
              onCheckedChange={(checked) => setFormData({ ...formData, hideNavigationBar: checked })}
            />
            <Label htmlFor="hideNavigationBar" className="text-sm">
              Hide navigation bar when opening this app
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add App</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const SettingsPage: React.FC = () => {
  const { state, updateSettings, addApp, removeApp, updateApp } = useBrowser()
  const { addNotification, clearAll } = useNotifications()
  const [editingApp, setEditingApp] = useState<App | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    url: '',
    description: '',
    category: '',
    hideNavigationBar: false
  })
  const [autoStartEnabled, setAutoStartEnabled] = useState<boolean>(false)
  const [currentVersion, setCurrentVersion] = useState<string>('')

  const handleSettingChange = (key: keyof typeof state.settings, value: any) => {
    updateSettings({ [key]: value })
  }

  const handleTestNotification = () => {
    addNotification({
      title: 'Test Notification',
      body: 'This is a test notification from the settings page. The notification system is working correctly!',
      icon: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://google.com'
    })
  }

  const handleAutoStartChange = async (enabled: boolean) => {
    try {
      const success = await (window as any).autoStartAPI.setStatus(enabled)
      if (success) {
        setAutoStartEnabled(enabled)
        updateSettings({ startWithSystem: enabled })
      }
    } catch (error) {
      console.error('Failed to update auto-start setting:', error)
    }
  }

  const handleAutoUpdateChange = async (enabled: boolean) => {
    try {
      await (window as any).updateAPI.setAutoCheck(enabled)
      updateSettings({ autoCheckUpdates: enabled })
    } catch (error) {
      console.error('Failed to update auto-update setting:', error)
    }
  }

  const handleCheckForUpdates = async () => {
    try {
      await (window as any).updateAPI.checkForUpdates(true)
    } catch (error) {
      console.error('Failed to check for updates:', error)
    }
  }

  const handleForceCheckForUpdates = async () => {
    try {
      console.log('🔄 Forcing update check for testing...')
      await (window as any).updateAPI.forceCheckForUpdates()
    } catch (error) {
      console.error('Failed to force check for updates:', error)
    }
  }

  useEffect(() => {
    const loadAutoStartStatus = async () => {
      try {
        const status = await (window as any).autoStartAPI.getStatus()
        setAutoStartEnabled(status)

        // Sync the app setting with the actual system state
        if (status !== state.settings.startWithSystem) {
          updateSettings({ startWithSystem: status })
        }
      } catch (error) {
        console.error('Failed to load auto-start status:', error)
      }
    }

    const loadCurrentVersion = async () => {
      try {
        const version = await (window as any).updateAPI.getCurrentVersion()
        setCurrentVersion(version)
      } catch (error) {
        console.error('Failed to load current version:', error)
      }
    }

    if ((window as any).autoStartAPI) {
      loadAutoStartStatus()
    }

    if ((window as any).updateAPI) {
      loadCurrentVersion()
    }
  }, [])

  const handleRequestPermission = async () => {
    try {
      const customService = CustomNotificationService.getInstance()
      const permission = await customService.requestPermission()

      if (permission === 'granted') {
        addNotification({
          title: 'Permission Granted',
          body: 'Notification permission has been granted successfully!',
          icon: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://google.com'
        })
      } else {
        addNotification({
          title: 'Permission Denied',
          body: 'Notification permission was denied. You can enable it in your system settings.',
          icon: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://google.com'
        })
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error)
    }
  }

  const handleShowFCMToken = () => {
    // Custom notification service doesn't use FCM tokens
    addNotification({
      title: 'Custom Notification Service',
      body: 'This app now uses a custom notification system that intercepts all webview notifications.',
      icon: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://google.com'
    })
  }

  const handleEditApp = (app: App) => {
    setEditingApp(app)
    setEditFormData({
      name: app.name,
      url: app.url,
      description: app.description || '',
      category: app.category || '',
      hideNavigationBar: app.hideNavigationBar || false
    })
  }

  const handleUpdateApp = () => {
    if (editingApp) {
      updateApp(editingApp.id, {
        name: editFormData.name,
        url: editFormData.url,
        description: editFormData.description,
        category: editFormData.category,
        hideNavigationBar: editFormData.hideNavigationBar,
        iconUrl: getFaviconUrl(editFormData.url)
      })
      setEditingApp(null)
      setEditFormData({ name: '', url: '', description: '', category: '', hideNavigationBar: false })
    }
  }

  const groupedApps = state.settings.apps.reduce((groups, app) => {
    const category = app.category || 'Other'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(app)
    return groups
  }, {} as Record<string, App[]>)

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your workspace preferences and applications
          </p>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Restore tabs on startup</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically restore your tabs when the workspace starts
                </p>
              </div>
              <Switch
                checked={state.settings.restoreTabsOnStartup}
                onCheckedChange={(checked) => handleSettingChange('restoreTabsOnStartup', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show apps in new tab</Label>
                <p className="text-sm text-muted-foreground">
                  Display your apps on the new tab page for quick access
                </p>
              </div>
              <Switch
                checked={state.settings.showAppsInNewTab}
                onCheckedChange={(checked) => handleSettingChange('showAppsInNewTab', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Start with system</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically start the workspace when your system starts
                </p>
              </div>
              <Switch
                checked={autoStartEnabled}
                onCheckedChange={handleAutoStartChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Update Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Current Version</Label>
                <p className="text-sm text-muted-foreground">
                  {currentVersion || 'Loading...'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCheckForUpdates} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check for Updates
                </Button>
                <Button onClick={handleForceCheckForUpdates} variant="outline" size="sm">
                  <TestTube className="h-4 w-4 mr-2" />
                  Force Check (Dev)
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Automatic updates</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically check for updates when the app starts (disabled in development mode)
                </p>
              </div>
              <Switch
                checked={state.settings.autoCheckUpdates}
                onCheckedChange={handleAutoUpdateChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Allow the workspace to show desktop notifications
                </p>
              </div>
              <Button onClick={handleRequestPermission} variant="outline" size="sm">
                Request Permission
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Test Notification</Label>
                <p className="text-sm text-muted-foreground">
                  Send a test notification to verify the system is working
                </p>
              </div>
              <Button onClick={handleTestNotification} variant="outline" size="sm">
                <TestTube className="h-4 w-4 mr-2" />
                Send Test
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>FCM Token</Label>
                <p className="text-sm text-muted-foreground">
                  View and copy your Firebase Cloud Messaging token
                </p>
              </div>
              <Button onClick={handleShowFCMToken} variant="outline" size="sm">
                Show Token
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Clear Notification History</Label>
                <p className="text-sm text-muted-foreground">
                  Remove all notifications from the history
                </p>
              </div>
              <Button onClick={clearAll} variant="outline" size="sm">
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Apps Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Apps</CardTitle>
            <AddAppDialog
              onAddApp={addApp}
              trigger={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add App
                </Button>
              }
            />
          </CardHeader>
          <CardContent>
            {Object.entries(groupedApps).map(([category, apps]) => (
              <div key={category} className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  {category}
                  <Badge variant="secondary">{apps.length}</Badge>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {apps.map((app) => (
                    <Card key={app.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={app.iconUrl}
                          alt={app.name}
                          className="w-8 h-8 rounded"
                          onError={(e) => {
                            e.currentTarget.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{app.name}</h4>
                          <p className="text-sm text-muted-foreground truncate">{app.url}</p>
                          {app.description && (
                            <p className="text-xs text-muted-foreground mt-1">{app.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditApp(app)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete App</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove "{app.name}" from your apps?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeApp(app.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Edit App Dialog */}
        {editingApp && (
          <Dialog open={!!editingApp} onOpenChange={() => setEditingApp(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit App</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleUpdateApp()
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="edit-name">App Name</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-url">URL</Label>
                  <Input
                    id="edit-url"
                    value={editFormData.url}
                    onChange={(e) => setEditFormData({ ...editFormData, url: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-hideNavigationBar"
                    checked={editFormData.hideNavigationBar}
                    onCheckedChange={(checked) => setEditFormData({ ...editFormData, hideNavigationBar: checked })}
                  />
                  <Label htmlFor="edit-hideNavigationBar" className="text-sm">
                    Hide navigation bar when opening this app
                  </Label>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingApp(null)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
