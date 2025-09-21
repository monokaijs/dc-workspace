
/// <reference path="../env.d.ts" />

export interface CustomNotificationData {
  title: string
  body: string
  icon?: string
  data?: any
}

export class CustomNotificationService {
  private static instance: CustomNotificationService
  private isInitialized = false
  private onNotificationCallback?: (data: CustomNotificationData) => void
  private cleanupFunctions: (() => void)[] = []

  static getInstance(): CustomNotificationService {
    if (!CustomNotificationService.instance) {
      CustomNotificationService.instance = new CustomNotificationService()
    }
    return CustomNotificationService.instance
  }

  async initialize(onNotification?: (data: CustomNotificationData) => void): Promise<void> {
    if (this.isInitialized) {
      console.log('Custom notification service already initialized')
      return
    }

    this.onNotificationCallback = onNotification

    try {
      if (!(window as any).customNotificationAPI) {
        throw new Error('Custom notification API not available')
      }

      // Set up event listener for notifications
      const notificationReceivedCleanup = (window as any).customNotificationAPI.onNotificationReceived((notification) => {
        console.log('Custom notification received in service:', notification)
        this.handleNotification(notification)
      })

      // Store cleanup function
      this.cleanupFunctions = [notificationReceivedCleanup].filter(Boolean)

      this.isInitialized = true
      console.log('Custom notification service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize custom notification service:', error)
      throw error
    }
  }

  private handleNotification(data: any): void {
    console.log('Handling custom notification:', data)

    // Transform the notification data to match our interface
    const notificationData: CustomNotificationData = {
      title: data.title || 'New Notification',
      body: data.body || '',
      icon: data.icon,
      data: data.data || data
    }

    // Call the callback to add to notification history
    if (this.onNotificationCallback) {
      this.onNotificationCallback(notificationData)
    }

    // Note: We don't show system notifications here since we want all notifications
    // to go through our app's notification system instead
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications')
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      return 'denied'
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied'
    }
    return Notification.permission
  }

  async sendTestNotification(): Promise<void> {
    const testData: CustomNotificationData = {
      title: 'Test Notification',
      body: 'This is a test notification from your browser app.',
      icon: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://google.com'
    }

    // Send through the custom notification API
    if ((window as any).customNotificationAPI) {
      await (window as any).customNotificationAPI.sendNotification(testData)
    } else {
      this.handleNotification(testData)
    }
  }

  destroy(): void {
    if (this.isInitialized) {
      // Call individual cleanup functions
      this.cleanupFunctions.forEach(cleanup => {
        if (typeof cleanup === 'function') {
          cleanup()
        }
      })
      this.cleanupFunctions = []

      // Fallback to remove all listeners
      if ((window as any).customNotificationAPI) {
        (window as any).customNotificationAPI.removeAllListeners()
      }

      this.isInitialized = false
      this.onNotificationCallback = undefined
      console.log('Custom notification service destroyed')
    }
  }
}
