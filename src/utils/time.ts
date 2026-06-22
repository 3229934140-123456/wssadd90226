export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000)
  if (totalMinutes < 60) return `${totalMinutes}\u5206\u949F`
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return mins > 0 ? `${hours}\u5C0F\u65F6${mins}\u5206\u949F` : `${hours}\u5C0F\u65F6`
}

export function getBodyPartRemaining(bp: { startTime: number; duration: number; status: string; pausedDuration: number; pausedAt?: number }): number {
  if (bp.status === 'completed') return 0
  if (bp.status === 'pausing' && bp.pausedAt) {
    const elapsedBeforePause = bp.pausedAt - bp.startTime - bp.pausedDuration
    return bp.duration * 60000 - elapsedBeforePause
  }
  const now = Date.now()
  const elapsed = now - bp.startTime - bp.pausedDuration
  return bp.duration * 60000 - elapsed
}

export function getBodyPartStatus(bp: { startTime: number; duration: number; status: string; pausedDuration: number; pausedAt?: number }): string {
  if (bp.status === 'completed') return 'completed'
  if (bp.status === 'pausing') return 'pausing'
  const remaining = getBodyPartRemaining(bp)
  if (remaining <= 0) return 'overdue'
  if (remaining <= 5 * 60 * 1000) return 'nearing'
  return 'active'
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function getExpectedEndTime(bp: { startTime: number; duration: number; pausedDuration: number }): number {
  return bp.startTime + bp.duration * 60000 + bp.pausedDuration
}
