import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react'

export interface Notification {
  id: string
  title: string
  body: string
  icon?: string
  timestamp: number
  read: boolean
  data?: any
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'LOAD_NOTIFICATIONS'; payload: Notification[] }

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0
}

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      const newNotifications = [action.payload, ...state.notifications]
      return {
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.read).length
      }
    case 'MARK_AS_READ':
      const updatedNotifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, read: true } : n
      )
      return {
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.read).length
      }
    case 'MARK_ALL_AS_READ':
      const allReadNotifications = state.notifications.map(n => ({ ...n, read: true }))
      return {
        notifications: allReadNotifications,
        unreadCount: 0
      }
    case 'REMOVE_NOTIFICATION':
      const filteredNotifications = state.notifications.filter(n => n.id !== action.payload)
      return {
        notifications: filteredNotifications,
        unreadCount: filteredNotifications.filter(n => !n.read).length
      }
    case 'CLEAR_ALL':
      return {
        notifications: [],
        unreadCount: 0
      }
    case 'LOAD_NOTIFICATIONS':
      return {
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.read).length
      }
    default:
      return state
  }
}

interface NotificationContextType {
  state: NotificationState
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  silent: boolean
  setSilent: (value: boolean) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

const STORAGE_KEY = 'browser-notifications'

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState)
  const [silent, setSilentState] = useState<boolean>(false)
  const prevCountRef = useRef<number>(0)
  const ipc = (window as any).electron?.ipcRenderer

  const loadNotifications = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const notifications = JSON.parse(stored)
        dispatch({ type: 'LOAD_NOTIFICATIONS', payload: notifications })
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  const saveNotifications = (notifications: Notification[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
    } catch (error) {
      console.error('Failed to save notifications:', error)
    }
  }

  useEffect(() => {
    loadNotifications()
    try {
      const storedSilent = localStorage.getItem('notification-silent')
      if (storedSilent != null) setSilentState(storedSilent === '1')
    } catch {}
    try {
      if (ipc?.invoke) {
        ipc.invoke('notification:get-silent').then((v: any) => {
          if (typeof v === 'boolean') setSilentState(v)
        }).catch(() => {})
      }
    } catch {}

    let cleanup: (() => void) | undefined
    if (ipc?.on) {
      const handler = (_: any, value: boolean) => setSilentState(!!value)
      ipc.on('notification:silent', handler)
      cleanup = () => { try { ipc.removeAllListeners?.('notification:silent') } catch {} }
    }
    return cleanup
  }, [])

  useEffect(() => {
    saveNotifications(state.notifications)
    const current = state.notifications.length
    if (current > prevCountRef.current && !silent) {
      try {
        const audio = new Audio(new URL('../assets/notification.mp3', import.meta.url).toString())
        audio.volume = 1
        audio.play().catch(() => {})
      } catch {}
    }
    prevCountRef.current = current
  }, [state.notifications, silent])

  useEffect(() => {
    try { localStorage.setItem('notification-silent', silent ? '1' : '0') } catch {}
    try { ipc?.send?.('notification:set-silent', silent) } catch {}
  }, [silent])

  useEffect(() => {
    try { ipc?.send?.('notification:unread-count', state.unreadCount) } catch {}
  }, [state.unreadCount])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false
    }
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification })
  }

  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id })
  }

  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_AS_READ' })
  }

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  }

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' })
  }

  return (
    <NotificationContext.Provider
      value={{
        state,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        silent,
        setSilent: setSilentState
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
