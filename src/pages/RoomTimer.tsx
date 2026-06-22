import { useNavigate } from 'react-router-dom'
import { useClinicStore } from '@/stores/useClinicStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTimer } from '@/hooks/useTimer'
import { formatCountdown, getBodyPartRemaining, getBodyPartStatus, formatTime } from '@/utils/time'
import { AlertTriangle, Pause, User } from 'lucide-react'
import type { Room, Customer } from '@/types'

const ROOM_STATUS_CONFIG: Record<string, { bg: string; border: string; label: string; textColor: string }> = {
  idle: { bg: 'bg-brand-card/50', border: 'border-brand-border', label: '\u7A7A\u95F2', textColor: 'text-brand-text-muted' },
  active: { bg: 'bg-brand-mint/8', border: 'border-brand-mint/30', label: '\u6577\u9EBB\u4E2D', textColor: 'text-brand-mint' },
  nearing: { bg: 'bg-brand-gold/8', border: 'border-brand-gold', label: '\u4E34\u8FD1\u5230\u70B9', textColor: 'text-brand-gold' },
  overdue: { bg: 'bg-brand-coral/10', border: 'border-brand-coral', label: '\u5DF2\u8D85\u65F6', textColor: 'text-brand-coral' },
  pausing: { bg: 'bg-brand-card', border: 'border-brand-text-muted/50', label: '\u6682\u505C\u7B49\u5F85', textColor: 'text-brand-text-dim' },
}

function RoomCard({ room, customer }: { room: Room; customer?: Customer }) {
  const navigate = useNavigate()
  const settings = useSettingsStore((s) => s.settings)
  const activeParts = customer ? customer.bodyParts.filter((bp) => bp.status !== 'completed') : []
  const { getStatus } = useTimer(activeParts)

  if (room.status === 'idle' || !customer) {
    return (
      <div className="rounded-xl border-2 border-brand-border bg-brand-card/50 p-4 min-h-[160px] flex flex-col items-center justify-center">
        <span className="text-brand-text-muted text-sm font-medium">{room.name}</span>
        <span className="text-brand-text-muted/50 text-xs mt-1">{'\u7A7A\u95F2'}</span>
      </div>
    )
  }

  const effectiveStatus = activeParts.length > 0
    ? (activeParts.some((bp) => getStatus(bp) === 'overdue') ? 'overdue'
      : activeParts.some((bp) => getStatus(bp) === 'nearing') ? 'nearing'
      : activeParts.some((bp) => getStatus(bp) === 'pausing') ? 'pausing'
      : 'active')
    : room.status

  const config = ROOM_STATUS_CONFIG[effectiveStatus] || ROOM_STATUS_CONFIG.active
  const displayName = settings.hideFullName ? customer.nickname : customer.fullName
  const minRemaining = activeParts.length > 0
    ? Math.min(...activeParts.map((bp) => getBodyPartRemaining(bp)))
    : 0

  const isNearing = effectiveStatus === 'nearing'
  const isOverdue = effectiveStatus === 'overdue'
  const isPausing = effectiveStatus === 'pausing'

  return (
    <button
      onClick={() => navigate(`/confirm/${room.id}`)}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all animate-fade-in ${
        isOverdue ? 'animate-flash-red' :
        isNearing ? 'animate-pulse-border' : ''
      } ${config.bg} ${config.border}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-brand-text">{room.name}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${config.textColor} ${config.bg}`}>
            {config.label}
          </span>
        </div>
        {isPausing && (
          <span className="flex items-center gap-1 text-brand-text-dim text-xs">
            <Pause size={12} />
            {'\u52FF\u5360\u5E8A'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isOverdue ? 'bg-brand-coral/20' : isNearing ? 'bg-brand-gold/20' : 'bg-brand-mint/20'
        }`}>
          <User size={16} className={config.textColor} />
        </div>
        <div>
          <div className="text-sm font-semibold text-brand-text">{displayName}</div>
          <div className="text-xs text-brand-text-dim">{customer.project}</div>
        </div>
      </div>

      <div className={`font-timer text-4xl font-bold tabular-nums mb-3 ${config.textColor}`}>
        {minRemaining <= 0 ? (
          <span className="flex items-center gap-2">
            <AlertTriangle size={20} />
            {'\u8D85\u65F6'}
          </span>
        ) : formatCountdown(minRemaining)}
      </div>

      <div className="space-y-1.5">
        {activeParts.map((bp) => {
          const bpStatus = getStatus(bp)
          const remaining = getBodyPartRemaining(bp)
          const total = bp.duration * 60000
          const progress = remaining > 0 ? Math.max(0, Math.min(1, 1 - remaining / total)) : 1
          const bpColor = bpStatus === 'overdue' ? 'bg-brand-coral'
            : bpStatus === 'nearing' ? 'bg-brand-gold'
            : bpStatus === 'pausing' ? 'bg-brand-text-muted'
            : 'bg-brand-mint'

          return (
            <div key={bp.id} className="flex items-center gap-2">
              <span className="text-xs text-brand-text-dim w-10 shrink-0">{bp.name}</span>
              <div className="flex-1 h-2 bg-brand-bg rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${bpColor}`}
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <span className={`font-timer text-xs font-medium tabular-nums w-12 text-right ${
                bpStatus === 'overdue' ? 'text-brand-coral'
                : bpStatus === 'nearing' ? 'text-brand-gold'
                : 'text-brand-text-dim'
              }`}>
                {remaining > 0 ? formatCountdown(remaining) : '\u8D85\u65F6'}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 mt-3 text-[10px] text-brand-text-muted">
        <span>{'\u5F00\u59CB'} {formatTime(activeParts[0]?.startTime ?? 0)}</span>
        <span>{'\u9884\u8BA1'} {activeParts.length > 0 ? formatTime(activeParts[0].startTime + activeParts[0].duration * 60000) : '--'}</span>
      </div>
    </button>
  )
}

export default function RoomTimer() {
  const rooms = useClinicStore((s) => s.rooms)
  const customers = useClinicStore((s) => s.customers)

  const sortedRooms = [...rooms].sort((a, b) => {
    const statusOrder: Record<string, number> = { overdue: 0, nearing: 1, pausing: 2, active: 3, idle: 4 }
    return (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5)
  })

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-brand-text">
            {'\u623F\u95F4\u8BA1\u65F6'}
          </h1>
          <p className="text-xs text-brand-text-muted mt-0.5">
            {'\u8D85\u65F6\u623F\u95F4\u81EA\u52A8\u7F6E\u9876\u663E\u793A'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand-mint" />
            {'\u6577\u9EBB\u4E2D'}
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand-gold" />
            {'\u4E34\u8FD1'}
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand-coral" />
            {'\u8D85\u65F6'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sortedRooms.map((room) => {
          const customer = customers.find((c) => c.roomId === room.id && c.queueStatus === 'in_room')
          return <RoomCard key={room.id} room={room} customer={customer} />
        })}
      </div>
    </div>
  )
}
