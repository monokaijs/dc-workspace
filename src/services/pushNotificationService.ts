
/// <reference path="../env.d.ts" />

export interface PushNotificationData {
  title: string
  body: string
  icon?: string
  data?: any
}

export class PushNotificationService {
  private static instance: PushNotificationService
  private isInitialized = false
  private onNotificationCallback?: (data: PushNotificationData) => void
  private fcmToken?: string
  private cleanupFunctions: (() => void)[] = []

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService()
    }
    return PushNotificationService.instance
  }

  async initialize(onNotification?: (data: PushNotificationData) => void, senderId?: string): Promise<void> {
    if (this.isInitialized) {
      console.log('Push notification service already initialized')
      return
    }

    this.onNotificationCallback = onNotification

    try {
      if (!(window as any).pushNotificationAPI) {
        throw new Error('Push notification API not available')
      }

      // Set up event listeners with cleanup functions
      const serviceStartedCleanup = (window as any).pushNotificationAPI.onServiceStarted((token) => {
        this.fcmToken = token
        console.log('Push notification service started with token:', token)
      })

      const serviceErrorCleanup = (window as any).pushNotificationAPI.onServiceError((error) => {
        console.error('Push notification service error:', error)
      })

      const tokenUpdatedCleanup = (window as any).pushNotificationAPI.onTokenUpdated((token) => {
        this.fcmToken = token
        console.log('FCM token updated:', token)
      })

      const notificationReceivedCleanup = (window as any).pushNotificationAPI.onNotificationReceived((notification) => {
        console.log('Push notification received in service:', notification)
        this.handleNotification(notification)
      })

      // Store cleanup functions
      this.cleanupFunctions = [
        serviceStartedCleanup,
        serviceErrorCleanup,
        tokenUpdatedCleanup,
        notificationReceivedCleanup
      ].filter(Boolean)

      // Start the service with a default sender ID (you can replace this with your Firebase sender ID)
      const defaultSenderId = senderId || '1234567890'; // Replace with your actual sender ID
      (window as any).pushNotificationAPI.startService(defaultSenderId)

      this.isInitialized = true
      console.log('Push notification service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize push notification service:', error)
      throw error
    }
  }

  private handleNotification(data: any): void {
    console.log('Handling notification:', data)

    // Transform the notification data to match our interface
    const notificationData: PushNotificationData = {
      title: data.title || data.notification?.title || 'New Notification',
      body: data.body || data.notification?.body || '',
      icon: data.icon || data.notification?.icon,
      data: data.data || data
    }

    // Call the callback to add to notification history
    if (this.onNotificationCallback) {
      this.onNotificationCallback(notificationData)
    }

    // Show system notification if permission is granted
    if (Notification.permission === 'granted') {
      const systemNotification = new Notification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon || 'https://www.google.com/s2/favicons?sz=64&domain_url=https://google.com'
      })

      // Auto-close after 5 seconds
      setTimeout(() => {
        systemNotification.close()
      }, 5000)
    }
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
    const testData: PushNotificationData = {
      title: 'Test Notification',
      body: 'This is a test notification from your browser app.',
      icon: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://google.com'
    }

    this.handleNotification(testData)
  }

  getFCMToken(): string | undefined {
    return this.fcmToken
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
      if ((window as any).pushNotificationAPI) {
        (window as any).pushNotificationAPI.removeAllListeners()
      }

      this.isInitialized = false
      this.onNotificationCallback = undefined
      this.fcmToken = undefined
      console.log('Push notification service destroyed')
    }
  }
}
