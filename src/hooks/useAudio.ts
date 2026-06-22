import { useCallback, useRef } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'

export function useAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const bellVolume = useSettingsStore((s) => s.settings.bellVolume)
  const isNightMode = useSettingsStore((s) => s.isNightMode)

  const getContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    return audioCtxRef.current
  }, [])

  const playBeep = useCallback(() => {
    if (isNightMode()) return
    try {
      const ctx = getContext()
      const gain = ctx.createGain()
      gain.gain.value = bellVolume / 100 * 0.5
      gain.connect(ctx.destination)

      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = 880
      osc.connect(gain)
      osc.start()

      const osc2 = ctx.createOscillator()
      osc2.type = 'sine'
      osc2.frequency.value = 1100
      osc2.connect(gain)
      osc2.start(ctx.currentTime + 0.15)

      osc.stop(ctx.currentTime + 0.15)
      osc2.stop(ctx.currentTime + 0.3)
    } catch {
      // audio not available
    }
  }, [bellVolume, isNightMode, getContext])

  const playAlert = useCallback(() => {
    if (isNightMode()) return
    try {
      const ctx = getContext()
      const gain = ctx.createGain()
      gain.gain.value = bellVolume / 100 * 0.6
      gain.connect(ctx.destination)

      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator()
        osc.type = 'square'
        osc.frequency.value = 660
        osc.connect(gain)
        const t = ctx.currentTime + i * 0.4
        osc.start(t)
        osc.stop(t + 0.2)
      }
    } catch {
      // audio not available
    }
  }, [bellVolume, isNightMode, getContext])

  return { playBeep, playAlert }
}
