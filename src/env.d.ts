/// <reference types="vite/client" />

declare global {
  interface Window {
    electronAPI: {
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
    }
    electron: {
      process: {
        versions: {
          electron: string
          chrome: string
          node: string
          [key: string]: string
        }
      }
      [key: string]: any
    }
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string
        allowpopups?: string
        webpreferences?: string
        useragent?: string
        ref?: React.Ref<Electron.WebviewTag>
      }
    }
  }
}
