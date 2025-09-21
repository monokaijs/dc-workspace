/// <reference path="../../env.d.ts" />
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, Database, FolderOpen, Trash2, Download, Info } from 'lucide-react'
import { persistenceService } from '@/services/persistence'
import { useBrowser } from '@/contexts/BrowserContext'

interface DataManagementProps {
  trigger?: React.ReactNode
}

export const DataManagement: React.FC<DataManagementProps> = ({ trigger }) => {
  const { state, clearHistory } = useBrowser()
  const [dataDir, setDataDir] = useState<string | null>(null)
  const [isClearing, setIsClearing] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)

  useEffect(() => {
    const loadDataDir = async () => {
      const dir = await persistenceService.getDataDirectory()
      setDataDir(dir)
    }
    loadDataDir()
  }, [])

  const handleClearAllData = async () => {
    setIsClearing(true)
    try {
      const success = await persistenceService.clearAllData()
      if (success) {
        // Also clear the in-memory state
        clearHistory()
        setShowClearDialog(false)
        // Optionally reload the app to reset everything
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to clear data:', error)
    } finally {
      setIsClearing(false)
    }
  }

  const openDataDirectory = async () => {
    if (dataDir && (window as any).electronAPI) {
      // This would require adding a new IPC handler to open the directory
      // For now, we'll just copy the path to clipboard
      try {
        await navigator.clipboard.writeText(dataDir)
        // You could show a toast notification here
      } catch (error) {
        console.error('Failed to copy path to clipboard:', error)
      }
    }
  }

  const exportData = async () => {
    try {
      const data = {
        workspaceState: state,
        exportDate: new Date().toISOString(),
        version: '1.0'
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dcws-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export data:', error)
    }
  }

  const getDataStats = () => {
    return {
      tabs: state.tabs.length,
      history: state.globalHistory.length,
      apps: state.settings.apps.length,
      activeTab: state.activeTabId ? 'Yes' : 'No'
    }
  }

  const stats = getDataStats()

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Database className="h-4 w-4 mr-2" />
            Data Management
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </DialogTitle>
          <DialogDescription>
            Manage your browser data, settings, and storage location
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Storage Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Storage Location
              </CardTitle>
              <CardDescription>
                Your workspace data is stored locally on your computer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Data Directory:</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {dataDir || '~/.dcws'}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openDataDirectory}
                  className="w-full"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Copy Path to Clipboard
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-4 w-4" />
                Current Data
              </CardTitle>
              <CardDescription>
                Overview of your stored workspace data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Open Tabs:</span>
                    <Badge variant="outline">{stats.tabs}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">History Entries:</span>
                    <Badge variant="outline">{stats.history}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Installed Apps:</span>
                    <Badge variant="outline">{stats.apps}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active Session:</span>
                    <Badge variant={stats.activeTab === 'Yes' ? 'default' : 'secondary'}>
                      {stats.activeTab}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Actions</CardTitle>
              <CardDescription>
                Export, import, or clear your workspace data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={exportData}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data Backup
                </Button>
                
                <Separator />
                
                <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Data
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Clear All Data
                      </DialogTitle>
                      <DialogDescription>
                        This will permanently delete all your workspace data including:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>All open tabs and session data</li>
                          <li>Browsing history</li>
                          <li>Settings and preferences</li>
                          <li>Installed apps</li>
                        </ul>
                        <strong className="text-destructive">This action cannot be undone.</strong>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowClearDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleClearAllData}
                        disabled={isClearing}
                      >
                        {isClearing ? 'Clearing...' : 'Clear All Data'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
