export type TimerStatus = 'waiting' | 'active' | 'nearing' | 'overdue' | 'pausing' | 'completed'

export interface BodyPart {
  id: string
  name: string
  startTime: number
  duration: number
  status: TimerStatus
  pausedAt?: number
  pausedDuration: number
  evaluatedAt?: number
  removedAt?: number
}

export interface Customer {
  id: string
  fullName: string
  nickname: string
  project: string
  bodyParts: BodyPart[]
  roomId: string
  queueStatus: 'waiting' | 'in_room' | 'completed'
  createdAt: number
}

export interface Room {
  id: string
  name: string
  customerId?: string
  status: 'idle' | 'active' | 'nearing' | 'overdue' | 'pausing' | 'completed'
}

export interface OperationLog {
  id: string
  roomId: string
  customerId: string
  action: 'start' | 'evaluate' | 'remove' | 'pause' | 'resume' | 'complete'
  operator: string
  operatorRole: 'doctor' | 'nurse'
  timestamp: number
}

export interface StoreSettings {
  bellVolume: number
  hideFullName: boolean
  nightModeStart: string
  nightModeEnd: string
  defaultDurations: Record<string, number>
}

export const DEFAULT_DURATIONS: Record<string, number> = {
  '\u989D\u5934': 30,
  '\u4E0B\u988C': 25,
  '\u5507\u5468': 20,
  '\u9762\u988A': 25,
  '\u9888\u90E8': 30,
}

export const BODY_PART_OPTIONS = ['\u989D\u5934', '\u4E0B\u988C', '\u5507\u5468', '\u9762\u988A', '\u9888\u90E8']
