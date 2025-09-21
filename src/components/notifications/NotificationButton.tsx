import React, {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {Separator} from '@/components/ui/separator'
import {Bell, Check, Trash2, X} from 'lucide-react'
import {useNotifications} from '@/contexts/NotificationContext'
import {cn} from '@/lib/utils'
import {Switch} from '@/components/ui/switch'
import {Label} from '@/components/ui/label'


const formatTimestamp = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export const NotificationButton: React.FC = () => {
  const {state, markAsRead, markAllAsRead, removeNotification, clearAll, silent, setSilent} = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const handleMarkAsRead = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    markAsRead(id)
  }

  const handleRemoveNotification = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    removeNotification(id)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const handleClearAll = () => {
    clearAll()
    setIsOpen(false)
  }


  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-muted relative"
        >
          <Bell className="h-4 w-4"/>
          {state.unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {state.unreadCount > 99 ? '99+' : state.unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-2 pr-2">
              <Label className="text-xs">Silent</Label>
              <Switch checked={silent} onCheckedChange={setSilent}/>
            </div>
            {state.notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-6 px-2 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1"/>
                Clear all
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {state.notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50"/>
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="p-2">
              {state.notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer group",
                      !notification.read && "bg-primary/5 border-l-2 border-l-primary/10"
                    )}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    {notification.icon ? (
                      <img
                        src={notification.icon}
                        alt=""
                        className="w-8 h-8 rounded-full flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div
                        className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bell className="h-4 w-4 text-primary"/>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn(
                          "text-sm font-medium truncate",
                          !notification.read && "font-semibold"
                        )}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3"/>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleRemoveNotification(notification.id, e)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <X className="h-3 w-3"/>
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                  {index < state.notifications.length - 1 && (
                    <Separator className="my-1"/>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {state.unreadCount > 0 && (
          <div className={'p-2'}>
            <Button
              variant="ghost"
              onClick={handleMarkAllAsRead}
              className="w-full"
            >
              <Check className="h-3 w-3 mr-1"/>
              Mark all read
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
