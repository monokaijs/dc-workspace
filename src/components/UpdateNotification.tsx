import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, RefreshCw, X, CheckCircle, AlertCircle } from 'lucide-react'

interface UpdateInfo {
  version: string
  releaseDate: string
  releaseNotes?: string
}

interface DownloadProgress {
  percent: number
  bytesPerSecond: number
  total: number
  transferred: number
}

export const UpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!(window as any).updateAPI) return

    const updateAPI = (window as any).updateAPI

    const removeCheckingListener = updateAPI.onUpdateChecking(() => {
      setIsChecking(true)
      setError(null)
    })

    const removeAvailableListener = updateAPI.onUpdateAvailable((info: UpdateInfo) => {
      setUpdateAvailable(true)
      setUpdateInfo(info)
      setIsChecking(false)
      setDismissed(false)
    })

    const removeNotAvailableListener = updateAPI.onUpdateNotAvailable(() => {
      setUpdateAvailable(false)
      setIsChecking(false)
    })

    const removeErrorListener = updateAPI.onUpdateError((errorMsg: string) => {
      setError(errorMsg)
      setIsChecking(false)
      setIsDownloading(false)
    })

    const removeProgressListener = updateAPI.onDownloadProgress((progress: DownloadProgress) => {
      setDownloadProgress(progress)
    })

    const removeDownloadedListener = updateAPI.onUpdateDownloaded((_: UpdateInfo) => {
      setUpdateDownloaded(true)
      setIsDownloading(false)
      setDownloadProgress(null)
    })

    return () => {
      removeCheckingListener()
      removeAvailableListener()
      removeNotAvailableListener()
      removeErrorListener()
      removeProgressListener()
      removeDownloadedListener()
    }
  }, [])

  const handleCheckForUpdates = async () => {
    try {
      await (window as any).updateAPI.checkForUpdates(true)
    } catch (error) {
      console.error('Failed to check for updates:', error)
    }
  }

  const handleDownloadUpdate = async () => {
    setIsDownloading(true)
    setError(null)
    try {
      await (window as any).updateAPI.downloadUpdate()
    } catch (error) {
      console.error('Failed to download update:', error)
      setIsDownloading(false)
    }
  }

  const handleInstallUpdate = async () => {
    try {
      await (window as any).updateAPI.installUpdate()
    } catch (error) {
      console.error('Failed to install update:', error)
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatSpeed = (bytesPerSecond: number): string => {
    return formatBytes(bytesPerSecond) + '/s'
  }

  if (dismissed || (!updateAvailable && !isChecking && !error && !updateDownloaded)) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {isChecking && <RefreshCw className="h-4 w-4 animate-spin" />}
              {updateDownloaded && <CheckCircle className="h-4 w-4 text-green-500" />}
              {error && <AlertCircle className="h-4 w-4 text-red-500" />}
              {updateAvailable && !updateDownloaded && <Download className="h-4 w-4 text-blue-500" />}
              
              {isChecking && 'Checking for Updates'}
              {updateDownloaded && 'Update Ready'}
              {error && 'Update Error'}
              {updateAvailable && !updateDownloaded && 'Update Available'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isChecking && (
            <p className="text-sm text-muted-foreground">
              Checking for updates...
            </p>
          )}

          {error && (
            <div className="space-y-2">
              <p className="text-sm text-red-600">{error}</p>
              <Button onClick={handleCheckForUpdates} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {updateAvailable && updateInfo && !updateDownloaded && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">v{updateInfo.version}</Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(updateInfo.releaseDate).toLocaleDateString()}
                </span>
              </div>
              
              {updateInfo.releaseNotes && (
                <div className="text-sm text-muted-foreground max-h-20 overflow-y-auto">
                  {updateInfo.releaseNotes}
                </div>
              )}

              {isDownloading && downloadProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Downloading...</span>
                    <span>{Math.round(downloadProgress.percent)}%</span>
                  </div>
                  <Progress value={downloadProgress.percent} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatBytes(downloadProgress.transferred)} / {formatBytes(downloadProgress.total)}</span>
                    <span>{formatSpeed(downloadProgress.bytesPerSecond)}</span>
                  </div>
                </div>
              )}

              {!isDownloading && (
                <div className="flex gap-2">
                  <Button onClick={handleDownloadUpdate} size="sm" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={() => setDismissed(true)} variant="outline" size="sm">
                    Later
                  </Button>
                </div>
              )}
            </div>
          )}

          {updateDownloaded && (
            <div className="space-y-3">
              <p className="text-sm text-green-600">
                Update downloaded successfully! Restart to install.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleInstallUpdate} size="sm" className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Restart & Install
                </Button>
                <Button onClick={() => setDismissed(true)} variant="outline" size="sm">
                  Later
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
