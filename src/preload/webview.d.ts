export interface WebviewAPI {
  getPageInfo: () => {
    url: string
    title: string
    timestamp: string
  }
  sendNotification: (title: string, options: any) => void
}

declare global {
  interface Window {
    webviewAPI: WebviewAPI
  }
}
