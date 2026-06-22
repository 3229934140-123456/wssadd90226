import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StoreSettings } from '@/types'
import { DEFAULT_DURATIONS } from '@/types'

interface SettingsState {
  settings: StoreSettings
  setBellVolume: (v: number) => void
  setHideFullName: (v: boolean) => void
  setNightModeStart: (v: string) => void
  setNightModeEnd: (v: string) => void
  setDefaultDurations: (v: Record<string, number>) => void
  isNightMode: () => boolean
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: {
        bellVolume: 70,
        hideFullName: true,
        nightModeStart: '22:00',
        nightModeEnd: '08:00',
        defaultDurations: { ...DEFAULT_DURATIONS },
      },
      setBellVolume: (v) =>
        set((s) => ({ settings: { ...s.settings, bellVolume: v } })),
      setHideFullName: (v) =>
        set((s) => ({ settings: { ...s.settings, hideFullName: v } })),
      setNightModeStart: (v) =>
        set((s) => ({ settings: { ...s.settings, nightModeStart: v } })),
      setNightModeEnd: (v) =>
        set((s) => ({ settings: { ...s.settings, nightModeEnd: v } })),
      setDefaultDurations: (v) =>
        set((s) => ({ settings: { ...s.settings, defaultDurations: v } })),
      isNightMode: () => {
        const { nightModeStart, nightModeEnd } = get().settings
        const now = new Date()
        const currentMinutes = now.getHours() * 60 + now.getMinutes()
        const [startH, startM] = nightModeStart.split(':').map(Number)
        const [endH, endM] = nightModeEnd.split(':').map(Number)
        const startMinutes = startH * 60 + startM
        const endMinutes = endH * 60 + endM
        if (startMinutes <= endMinutes) {
          return currentMinutes >= startMinutes && currentMinutes < endMinutes
        }
        return currentMinutes >= startMinutes || currentMinutes < endMinutes
      },
    }),
    { name: 'anesthetimer-settings' }
  )
)
