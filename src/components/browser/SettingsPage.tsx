import React, { useState } from 'react'
import { useBrowser } from '@/contexts/BrowserContext'
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
import { Plus, Trash2, Edit, Globe } from 'lucide-react'
import { getFaviconUrl } from '@/utils/url'

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
    category: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.url) {
      onAddApp({
        name: formData.name,
        url: formData.url.startsWith('http') ? formData.url : `https://${formData.url}`,
        iconUrl: getFaviconUrl(formData.url.startsWith('http') ? formData.url : `https://${formData.url}`),
        description: formData.description,
        category: formData.category || 'Other'
      })
      setFormData({ name: '', url: '', description: '', category: '' })
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
  const [editingApp, setEditingApp] = useState<App | null>(null)

  const handleSettingChange = (key: keyof typeof state.settings, value: any) => {
    updateSettings({ [key]: value })
  }

  const handleEditApp = (app: App) => {
    setEditingApp(app)
  }

  const handleUpdateApp = (updates: Partial<App>) => {
    if (editingApp) {
      updateApp(editingApp.id, updates)
      setEditingApp(null)
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
            Manage your browser preferences and applications
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
                  Automatically restore your tabs when the browser starts
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
                  const formData = new FormData(e.currentTarget)
                  handleUpdateApp({
                    name: formData.get('name') as string,
                    url: formData.get('url') as string,
                    description: formData.get('description') as string,
                    category: formData.get('category') as string,
                    iconUrl: getFaviconUrl(formData.get('url') as string)
                  })
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="edit-name">App Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingApp.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-url">URL</Label>
                  <Input
                    id="edit-url"
                    name="url"
                    defaultValue={editingApp.url}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    name="description"
                    defaultValue={editingApp.description || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    name="category"
                    defaultValue={editingApp.category || ''}
                  />
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
