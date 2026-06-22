import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Room, Customer, BodyPart, OperationLog } from '@/types'
import type { LogAction } from '@/types'
import { generateId, getBodyPartStatus } from '@/utils/time'

const DEFAULT_ROOMS: Room[] = [
  { id: 'room-1', name: '\u6CBB\u75971\u5BA4', status: 'idle' },
  { id: 'room-2', name: '\u6CBB\u75972\u5BA4', status: 'idle' },
  { id: 'room-3', name: '\u6CBB\u75973\u5BA4', status: 'idle' },
  { id: 'room-4', name: '\u6CBB\u75974\u5BA4', status: 'idle' },
  { id: 'room-5', name: '\u6CBB\u75975\u5BA4', status: 'idle' },
  { id: 'room-6', name: '\u6CBB\u75976\u5BA4', status: 'idle' },
]

function isToday(ts: number): boolean {
  const d = new Date(ts)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

interface ClinicState {
  rooms: Room[]
  customers: Customer[]
  operationLogs: OperationLog[]
  handedOverIds: string[]
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt' | 'queueStatus' | 'projectList'> & { projectList?: string[] }) => Customer
  assignCustomerToRoom: (customerId: string, roomId: string, bodyParts: Omit<BodyPart, 'id' | 'status' | 'pausedDuration' | 'remindCount'>[]) => void
  updateRoomStatus: (roomId: string, status: Room['status']) => void
  updateBodyPartStatus: (customerId: string, bodyPartId: string, status: BodyPart['status']) => void
  evaluateBodyPart: (customerId: string, bodyPartId: string, operator: string) => void
  removeBodyPart: (customerId: string, bodyPartId: string, operator: string) => void
  pauseCustomer: (customerId: string) => void
  resumeCustomer: (customerId: string) => void
  completeCustomer: (customerId: string) => void
  addLog: (log: Omit<OperationLog, 'id' | 'timestamp'>) => void
  remindBodyPart: (customerId: string, bodyPartId: string, operator: string) => void
  notifyDoctor: (customerId: string, bodyPartId: string, operator: string) => void
  getCustomerByRoom: (roomId: string) => Customer | undefined
  refreshRoomStatuses: () => void
  getTodayLogs: () => OperationLog[]
  getTodayCustomers: () => Customer[]
  clearOldRecords: () => void
  toggleHandover: (customerId: string) => void
  resetHandover: () => void
}

export const useClinicStore = create<ClinicState>()(
  persist(
    (set, get) => ({
      rooms: DEFAULT_ROOMS,
      customers: [],
      operationLogs: [],
      handedOverIds: [],

      addCustomer: (c) => {
        const customer: Customer = {
          ...c,
          projectList: c.projectList && c.projectList.length > 0 ? c.projectList : [c.project || ''],
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
          remindCount: 0,
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
        const customer = get().customers.find((c) => c.id === customerId)
        bodyParts.forEach((bp) => {
          get().addLog({
            roomId,
            customerId,
            bodyPartId: bp.id,
            bodyPartName: bp.name,
            action: 'start',
            operator: '\u62A4\u58EB',
            operatorRole: 'nurse',
          })
        })
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
        const bp = customer?.bodyParts.find((b) => b.id === bodyPartId)
        if (customer && bp) {
          get().addLog({
            roomId: customer.roomId,
            customerId,
            bodyPartId,
            bodyPartName: bp.name,
            action: 'evaluate',
            operator,
            operatorRole: 'doctor',
          })
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
        const bp = customer?.bodyParts.find((b) => b.id === bodyPartId)
        if (customer && bp) {
          get().addLog({
            roomId: customer.roomId,
            customerId,
            bodyPartId,
            bodyPartName: bp.name,
            action: 'remove',
            operator,
            operatorRole: 'nurse',
          })
          const updatedCustomer = get().customers.find((c) => c.id === customerId)
          if (updatedCustomer && updatedCustomer.bodyParts.every((b) => b.status === 'completed')) {
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
          get().addLog({
            roomId: customer.roomId,
            customerId,
            action: 'pause',
            operator: '\u62A4\u58EB',
            operatorRole: 'nurse',
          })
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
          get().addLog({
            roomId: customer.roomId,
            customerId,
            action: 'resume',
            operator: '\u62A4\u58EB',
            operatorRole: 'nurse',
          })
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
          get().addLog({
            roomId: customer.roomId,
            customerId,
            action: 'complete',
            operator: '\u62A4\u58EB',
            operatorRole: 'nurse',
          })
        }
      },

      remindBodyPart: (customerId, bodyPartId, operator) => {
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  bodyParts: c.bodyParts.map((bp) =>
                    bp.id === bodyPartId
                      ? { ...bp, remindCount: bp.remindCount + 1 }
                      : bp
                  ),
                }
              : c
          ),
        }))
        const customer = get().customers.find((c) => c.id === customerId)
        const bp = customer?.bodyParts.find((b) => b.id === bodyPartId)
        if (customer && bp) {
          get().addLog({
            roomId: customer.roomId,
            customerId,
            bodyPartId,
            bodyPartName: bp.name,
            action: 'remind' as LogAction,
            operator,
            operatorRole: 'nurse',
          })
        }
      },

      notifyDoctor: (customerId, bodyPartId, operator) => {
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  bodyParts: c.bodyParts.map((bp) =>
                    bp.id === bodyPartId
                      ? { ...bp, doctorNotifiedAt: Date.now() }
                      : bp
                  ),
                }
              : c
          ),
        }))
        const customer = get().customers.find((c) => c.id === customerId)
        const bp = customer?.bodyParts.find((b) => b.id === bodyPartId)
        if (customer && bp) {
          get().addLog({
            roomId: customer.roomId,
            customerId,
            bodyPartId,
            bodyPartName: bp.name,
            action: 'notify_doctor' as LogAction,
            operator,
            operatorRole: 'nurse',
          })
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

      getTodayLogs: () => {
        return get().operationLogs.filter((l) => isToday(l.timestamp))
      },

      getTodayCustomers: () => {
        return get().customers.filter((c) => isToday(c.createdAt) || c.queueStatus !== 'waiting')
      },

      clearOldRecords: () => {
        set((s) => ({
          customers: s.customers.filter((c) => isToday(c.createdAt) || c.queueStatus === 'in_room'),
          operationLogs: s.operationLogs.filter((l) => isToday(l.timestamp)),
          handedOverIds: [],
        }))
      },

      toggleHandover: (customerId) => {
        set((s) => ({
          handedOverIds: s.handedOverIds.includes(customerId)
            ? s.handedOverIds.filter((id) => id !== customerId)
            : [...s.handedOverIds, customerId],
        }))
      },

      resetHandover: () => {
        set({ handedOverIds: [] })
      },
    }),
    {
      name: 'anesthetimer-clinic-v2',
      version: 3,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as {
          customers?: Customer[]
          operationLogs?: OperationLog[]
          rooms?: Room[]
        }
        if (version < 2) {
          if (state?.customers) {
            state.customers = state.customers.map((c) => ({
              ...c,
              bodyParts: c.bodyParts.map((bp) => ({
                ...bp,
                remindCount: (bp as { remindCount?: number }).remindCount ?? 0,
              })),
            }))
          }
        }
        if (version < 3) {
          if (state?.customers) {
            state.customers = state.customers.map((c) => ({
              ...c,
              projectList: (c as { projectList?: string[] }).projectList || [c.project || ''],
            }))
          }
        }
        return state
      },
    }
  )
)
