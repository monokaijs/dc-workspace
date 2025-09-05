import { useEffect } from 'react'
import { useBrowser } from '@/contexts/BrowserContext'

export const useKeyboardShortcuts = () => {
  const { state, createTab, closeTab, switchTab } = useBrowser()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Ctrl (or Cmd on Mac) is pressed
      const isCtrlPressed = event.ctrlKey || event.metaKey

      if (!isCtrlPressed) return

      switch (event.key) {
        case 't':
        case 'T':
          // Ctrl + T: Open new tab
          event.preventDefault()
          createTab()
          break

        case 'w':
        case 'W':
          // Ctrl + W: Close current tab
          event.preventDefault()
          if (state.activeTabId && state.tabs.length > 1) {
            closeTab(state.activeTabId)
          }
          break

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          // Ctrl + 1-9: Switch to tab at index
          event.preventDefault()
          const tabIndex = parseInt(event.key) - 1
          if (tabIndex >= 0 && tabIndex < state.tabs.length) {
            const targetTab = state.tabs[tabIndex]
            if (targetTab) {
              switchTab(targetTab.id)
            }
          }
          break

        default:
          break
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [state.activeTabId, state.tabs, createTab, closeTab, switchTab])
}
