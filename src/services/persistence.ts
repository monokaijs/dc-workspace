/// <reference path="../env.d.ts" />
import { BrowserState, BrowserSettings, HistoryEntry, Tab } from '@/types/browser'

export class PersistenceService {
  private static instance: PersistenceService
  private isElectron: boolean

  constructor() {
    this.isElectron = typeof window !== 'undefined' && (window as any).dataAPI !== undefined
  }

  static getInstance(): PersistenceService {
    if (!PersistenceService.instance) {
      PersistenceService.instance = new PersistenceService()
    }
    return PersistenceService.instance
  }

  // Browser State operations
  async loadBrowserState(): Promise<BrowserState | null> {
    try {
      if (this.isElectron) {
        return await (window as any).dataAPI.readBrowserState()
      } else {
        // Fallback to localStorage for development
        const data = localStorage.getItem('browserState')
        return data ? JSON.parse(data) : null
      }
    } catch (error) {
      console.error('Error loading browser state:', error)
      return null
    }
  }

  async saveBrowserState(state: BrowserState): Promise<boolean> {
    try {
      if (this.isElectron) {
        return await (window as any).dataAPI.writeBrowserState(state)
      } else {
        // Fallback to localStorage for development
        localStorage.setItem('browserState', JSON.stringify(state))
        return true
      }
    } catch (error) {
      console.error('Error saving browser state:', error)
      return false
    }
  }

  // Settings operations
  async loadSettings(): Promise<BrowserSettings | null> {
    try {
      if (this.isElectron) {
        return await (window as any).dataAPI.readSettings()
      } else {
        // Fallback to localStorage for development
        const data = localStorage.getItem('browserSettings')
        return data ? JSON.parse(data) : null
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      return null
    }
  }

  async saveSettings(settings: BrowserSettings): Promise<boolean> {
    try {
      if (this.isElectron) {
        return await (window as any).dataAPI.writeSettings(settings)
      } else {
        // Fallback to localStorage for development
        localStorage.setItem('browserSettings', JSON.stringify(settings))
        return true
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      return false
    }
  }

  // History operations
  async loadHistory(): Promise<HistoryEntry[] | null> {
    try {
      if (this.isElectron) {
        return await (window as any).dataAPI.readHistory()
      } else {
        // Fallback to localStorage for development
        const data = localStorage.getItem('browserHistory')
        return data ? JSON.parse(data) : null
      }
    } catch (error) {
      console.error('Error loading history:', error)
      return null
    }
  }

  async saveHistory(history: HistoryEntry[]): Promise<boolean> {
    try {
      if (this.isElectron) {
        return await (window as any).dataAPI.writeHistory(history)
      } else {
        // Fallback to localStorage for development
        localStorage.setItem('browserHistory', JSON.stringify(history))
        return true
      }
    } catch (error) {
      console.error('Error saving history:', error)
      return false
    }
  }

  // Tabs operations
  async loadTabs(): Promise<Tab[] | null> {
    try {
      if (this.isElectron) {
        return await (window as any).dataAPI.readTabs()
      } else {
        // Fallback to localStorage for development
        const data = localStorage.getItem('browserTabs')
        return data ? JSON.parse(data) : null
      }
    } catch (error) {
      console.error('Error loading tabs:', error)
      return null
    }
  }

  async saveTabs(tabs: Tab[]): Promise<boolean> {
    try {
      if (this.isElectron) {
        return await (window as any).dataAPI.writeTabs(tabs)
      } else {
        // Fallback to localStorage for development
        localStorage.setItem('browserTabs', JSON.stringify(tabs))
        return true
      }
    } catch (error) {
      console.error('Error saving tabs:', error)
      return false
    }
  }

  // Clear all data
  async clearAllData(): Promise<boolean> {
    try {
      if (this.isElectron) {
        return await (window as any).dataAPI.clearAll()
      } else {
        // Fallback to localStorage for development
        localStorage.removeItem('browserState')
        localStorage.removeItem('browserSettings')
        localStorage.removeItem('browserHistory')
        localStorage.removeItem('browserTabs')
        return true
      }
    } catch (error) {
      console.error('Error clearing data:', error)
      return false
    }
  }

  // Get data directory path
  async getDataDirectory(): Promise<string | null> {
    try {
      if (this.isElectron) {
        return await (window as any).dataAPI.getDataDir()
      } else {
        return null // Not available in web environment
      }
    } catch (error) {
      console.error('Error getting data directory:', error)
      return null
    }
  }

  // Migration helper - migrate from localStorage to file system
  async migrateFromLocalStorage(): Promise<boolean> {
    if (!this.isElectron) return false

    try {
      // Check if we have localStorage data to migrate
      const localStorageState = localStorage.getItem('browserState')
      if (localStorageState) {
        const state = JSON.parse(localStorageState)
        
        // Save to file system
        await this.saveBrowserState(state)
        
        // Clear localStorage after successful migration
        localStorage.removeItem('browserState')
        
        console.log('Successfully migrated workspace state from localStorage to file system')
        return true
      }
      return false
    } catch (error) {
      console.error('Error migrating from localStorage:', error)
      return false
    }
  }
}

export const persistenceService = PersistenceService.getInstance()
