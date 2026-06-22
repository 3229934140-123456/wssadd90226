import { create } from 'zustand'
import type { Room, Customer, BodyPart, OperationLog } from '@/types'
import { generateId, getBodyPartStatus } from '@/utils/time'

const INITIAL_ROOMS: Room[] = [
  { id: 'room-1', name: '\u6CBB\u75971\u5BA4', status: 'idle' },
  { id: 'room-2', name: '\u6CBB\u75972\u5BA4', status: 'idle' },
  { id: 'room-3', name: '\u6CBB\u75973\u5BA4', status: 'idle' },
  { id: 'room-4', name: '\u6CBB\u75974\u5BA4', status: 'idle' },
  { id: 'room-5', name: '\u6CBB\u75975\u5BA4', status: 'idle' },
  { id: 'room-6', name: '\u6CBB\u75976\u5BA4', status: 'idle' },
]

const now = Date.now()

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    fullName: '\u5F20\u7F8E\u7F8E',
    nickname: '\u7F8E\u7F8E',
    project: '\u70ED\u739B\u5409',
    bodyParts: [
      { id: 'bp-1', name: '\u989D\u5934', startTime: now - 20 * 60 * 1000, duration: 30, status: 'active', pausedDuration: 0 },
      { id: 'bp-2', name: '\u4E0B\u988C', startTime: now - 15 * 60 * 1000, duration: 25, status: 'active', pausedDuration: 0 },
    ],
    roomId: 'room-1',
    queueStatus: 'in_room',
    createdAt: now - 25 * 60 * 1000,
  },
  {
    id: 'cust-2',
    fullName: '\u674E\u5C0F\u7F8E',
    nickname: '\u5C0F\u7F8E',
    project: '\u5149\u7535\u5AE9\u80A4',
    bodyParts: [
      { id: 'bp-3', name: '\u9762\u988A', startTime: now - 23 * 60 * 1000, duration: 25, status: 'nearing', pausedDuration: 0 },
    ],
    roomId: 'room-2',
    queueStatus: 'in_room',
    createdAt: now - 28 * 60 * 1000,
  },
  {
    id: 'cust-3',
    fullName: '\u738B\u96EA\u513F',
    nickname: '\u96EA\u513F',
    project: '\u76AE\u79D2\u6FC0\u5149',
    bodyParts: [
      { id: 'bp-4', name: '\u5507\u5468', startTime: now - 22 * 60 * 1000, duration: 20, status: 'overdue', pausedDuration: 0 },
    ],
    roomId: 'room-3',
    queueStatus: 'in_room',
    createdAt: now - 30 * 60 * 1000,
  },
  {
    id: 'cust-4',
    fullName: '\u8D75\u7FD4\u7FD4',
    nickname: '\u7FD4\u7FD4',
    project: '\u70ED\u739B\u5409',
    bodyParts: [],
    roomId: '',
    queueStatus: 'waiting',
    createdAt: now - 5 * 60 * 1000,
  },
  {
    id: 'cust-5',
    fullName: '\u5218\u5A49\u5A49',
    nickname: '\u5A49\u5A49',
    project: '\u6C34\u5149\u9488',
    bodyParts: [],
    roomId: '',
    queueStatus: 'waiting',
    createdAt: now - 3 * 60 * 1000,
  },
]

interface ClinicState {
  rooms: Room[]
  customers: Customer[]
  operationLogs: OperationLog[]
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt' | 'queueStatus'>) => Customer
  assignCustomerToRoom: (customerId: string, roomId: string, bodyParts: Omit<BodyPart, 'id' | 'status' | 'pausedDuration'>[]) => void
  updateRoomStatus: (roomId: string, status: Room['status']) => void
  updateBodyPartStatus: (customerId: string, bodyPartId: string, status: BodyPart['status']) => void
  evaluateBodyPart: (customerId: string, bodyPartId: string, operator: string) => void
  removeBodyPart: (customerId: string, bodyPartId: string, operator: string) => void
  pauseCustomer: (customerId: string) => void
  resumeCustomer: (customerId: string) => void
  completeCustomer: (customerId: string) => void
  addLog: (log: Omit<OperationLog, 'id' | 'timestamp'>) => void
  getCustomerByRoom: (roomId: string) => Customer | undefined
  refreshRoomStatuses: () => void
}

export const useClinicStore = create<ClinicState>()((set, get) => ({
  rooms: INITIAL_ROOMS,
  customers: INITIAL_CUSTOMERS,
  operationLogs: [],

  addCustomer: (c) => {
    const customer: Customer = {
      ...c,
      id: generateId(),
      createdAt: Date.now(),
      queueStatus: 'waiting',
    }
    set((s) => ({ customers: [...s.customers, customer] }))
    return customer
  },

  assignCustomerToRoom: (customerId, roomId, bodyPartsInput) => {
    const now = Date.now()
    const bodyParts: BodyPart[] = bodyPartsInput.map((bp) => ({
      ...bp,
      id: generateId(),
      status: 'active' as const,
      pausedDuration: 0,
      startTime: now,
    }))
    set((s) => ({
      customers: s.customers.map((c) =>
        c.id === customerId
          ? { ...c, roomId, bodyParts, queueStatus: 'in_room' as const }
          : c
      ),
      rooms: s.rooms.map((r) =>
        r.id === roomId ? { ...r, customerId, status: 'active' as const } : r
      ),
    }))
    get().addLog({ roomId, customerId, action: 'start', operator: '\u62A4\u58EB', operatorRole: 'nurse' })
  },

  updateRoomStatus: (roomId, status) => {
    set((s) => ({
      rooms: s.rooms.map((r) => (r.id === roomId ? { ...r, status } : r)),
    }))
  },

  updateBodyPartStatus: (customerId, bodyPartId, status) => {
    set((s) => ({
      customers: s.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              bodyParts: c.bodyParts.map((bp) =>
                bp.id === bodyPartId ? { ...bp, status } : bp
              ),
            }
          : c
      ),
    }))
  },

  evaluateBodyPart: (customerId, bodyPartId, operator) => {
    set((s) => ({
      customers: s.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              bodyParts: c.bodyParts.map((bp) =>
                bp.id === bodyPartId ? { ...bp, evaluatedAt: Date.now() } : bp
              ),
            }
          : c
      ),
    }))
    const customer = get().customers.find((c) => c.id === customerId)
    if (customer) {
      get().addLog({ roomId: customer.roomId, customerId, action: 'evaluate', operator, operatorRole: 'doctor' })
    }
  },

  removeBodyPart: (customerId, bodyPartId, operator) => {
    set((s) => ({
      customers: s.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              bodyParts: c.bodyParts.map((bp) =>
                bp.id === bodyPartId
                  ? { ...bp, status: 'completed' as const, removedAt: Date.now() }
                  : bp
              ),
            }
          : c
      ),
    }))
    const customer = get().customers.find((c) => c.id === customerId)
    if (customer) {
      get().addLog({ roomId: customer.roomId, customerId, action: 'remove', operator, operatorRole: 'nurse' })
      const updatedCustomer = get().customers.find((c) => c.id === customerId)
      if (updatedCustomer && updatedCustomer.bodyParts.every((bp) => bp.status === 'completed')) {
        get().completeCustomer(customerId)
      }
    }
  },

  pauseCustomer: (customerId) => {
    const now = Date.now()
    set((s) => ({
      customers: s.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              bodyParts: c.bodyParts.map((bp) =>
                bp.status !== 'completed' && bp.status !== 'pausing'
                  ? { ...bp, status: 'pausing' as const, pausedAt: now }
                  : bp
              ),
            }
          : c
      ),
      rooms: s.rooms.map((r) =>
        r.customerId === customerId ? { ...r, status: 'pausing' as const } : r
      ),
    }))
    const customer = get().customers.find((c) => c.id === customerId)
    if (customer) {
      get().addLog({ roomId: customer.roomId, customerId, action: 'pause', operator: '\u62A4\u58EB', operatorRole: 'nurse' })
    }
  },

  resumeCustomer: (customerId) => {
    const now = Date.now()
    set((s) => ({
      customers: s.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              bodyParts: c.bodyParts.map((bp) =>
                bp.status === 'pausing'
                  ? {
                      ...bp,
                      status: 'active' as const,
                      pausedDuration: bp.pausedDuration + (now - (bp.pausedAt ?? now)),
                      pausedAt: undefined,
                    }
                  : bp
              ),
            }
          : c
      ),
      rooms: s.rooms.map((r) =>
        r.customerId === customerId ? { ...r, status: 'active' as const } : r
      ),
    }))
    const customer = get().customers.find((c) => c.id === customerId)
    if (customer) {
      get().addLog({ roomId: customer.roomId, customerId, action: 'resume', operator: '\u62A4\u58EB', operatorRole: 'nurse' })
    }
  },

  completeCustomer: (customerId) => {
    set((s) => ({
      customers: s.customers.map((c) =>
        c.id === customerId
          ? { ...c, queueStatus: 'completed' as const }
          : c
      ),
      rooms: s.rooms.map((r) =>
        r.customerId === customerId
          ? { ...r, status: 'idle' as const, customerId: undefined }
          : r
      ),
    }))
    const customer = get().customers.find((c) => c.id === customerId)
    if (customer) {
      get().addLog({ roomId: customer.roomId, customerId, action: 'complete', operator: '\u62A4\u58EB', operatorRole: 'nurse' })
    }
  },

  addLog: (log) => {
    set((s) => ({
      operationLogs: [
        ...s.operationLogs,
        { ...log, id: generateId(), timestamp: Date.now() },
      ],
    }))
  },

  getCustomerByRoom: (roomId) => {
    return get().customers.find((c) => c.roomId === roomId && c.queueStatus === 'in_room')
  },

  refreshRoomStatuses: () => {
    const { customers, rooms } = get()
    set({
      rooms: rooms.map((room) => {
        if (!room.customerId || room.status === 'pausing') return room
        const customer = customers.find((c) => c.id === room.customerId)
        if (!customer || customer.queueStatus === 'completed') {
          return { ...room, status: 'idle' as const, customerId: undefined }
        }
        const activeParts = customer.bodyParts.filter((bp) => bp.status !== 'completed')
        if (activeParts.length === 0) return room
        const statuses = activeParts.map((bp) => getBodyPartStatus(bp))
        if (statuses.includes('overdue')) return { ...room, status: 'overdue' as const }
        if (statuses.includes('nearing')) return { ...room, status: 'nearing' as const }
        return { ...room, status: 'active' as const }
      }),
    })
  },
}))
