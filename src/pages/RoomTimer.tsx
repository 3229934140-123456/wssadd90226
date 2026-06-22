import { useNavigate } from 'react-router-dom'
import { useClinicStore } from '@/stores/useClinicStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTimer } from '@/hooks/useTimer'
import { formatCountdown, getBodyPartRemaining, formatTime, getExpectedEndTime } from '@/utils/time'
import { AlertTriangle, Pause, User, Bell, StickyNote } from 'lucide-react'
import type { Room, Customer, BodyPart } from '@/types'

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
  const { getStatus } = useTimer(activeParts as BodyPart[])

  if (room.status === 'idle' || !customer) {
    return (
      <div className="rounded-xl border-2 border-brand-border bg-brand-card/50 p-3 min-h-[150px] flex flex-col items-center justify-center">
        <span className="text-brand-text-muted text-sm font-medium">{room.name}</span>
        <span className="text-brand-text-muted/50 text-[10px] mt-1">{'\u7A7A\u95F2'}</span>
      </div>
    )
  }

  const effectiveStatus = activeParts.length > 0
    ? (activeParts.some((bp) => getStatus(bp as BodyPart) === 'overdue') ? 'overdue'
      : activeParts.some((bp) => getStatus(bp as BodyPart) === 'nearing') ? 'nearing'
      : activeParts.some((bp) => getStatus(bp as BodyPart) === 'pausing') ? 'pausing'
      : 'active')
    : room.status

  const config = ROOM_STATUS_CONFIG[effectiveStatus] || ROOM_STATUS_CONFIG.active
  const displayName = settings.hideFullName ? customer.nickname : customer.fullName
  const minRemaining = activeParts.length > 0
    ? Math.min(...activeParts.map((bp) => getBodyPartRemaining(bp as BodyPart)))
    : 0

  const isNearing = effectiveStatus === 'nearing'
  const isOverdue = effectiveStatus === 'overdue'
  const isPausing = effectiveStatus === 'pausing'
  const hasRemind = customer.bodyParts.some((bp) => bp.remindCount > 0)
  const hasNotify = customer.bodyParts.some((bp) => bp.doctorNotifiedAt)

  return (
    <button
      onClick={() => navigate(`/confirm/${room.id}`)}
      className={`w-full text-left rounded-xl border-2 p-3 transition-all animate-fade-in ${
        isOverdue ? 'animate-flash-red' :
        isNearing ? 'animate-pulse-border' : ''
      } ${config.bg} ${config.border}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-semibold text-brand-text">{room.name}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${config.textColor} ${config.bg}`}>
            {config.label}
          </span>
          {hasRemind && (
            <span className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded bg-brand-gold/15 text-brand-gold shrink-0">
              <Bell size={8} />
              {customer.bodyParts.reduce((s, bp) => s + bp.remindCount, 0)}
            </span>
          )}
          {hasNotify && (
            <span className="inline-flex items-center text-[9px] px-1 py-0.5 rounded bg-brand-coral/15 text-brand-coral shrink-0">
              {'\u533B\u77E5'}
            </span>
          )}
          {customer.remarks && <StickyNote size={11} className="text-brand-gold shrink-0" />}
        </div>
        {isPausing && (
          <span className="flex items-center gap-0.5 text-brand-text-dim text-[9px] shrink-0">
            <Pause size={9} />
            {'\u52FF\u5360\u5E8A'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
          isOverdue ? 'bg-brand-coral/20' : isNearing ? 'bg-brand-gold/20' : 'bg-brand-mint/20'
        }`}>
          <User size={11} className={config.textColor} />
        </div>
        <div className="truncate min-w-0">
          <span className="text-xs font-semibold text-brand-text truncate">{displayName}</span>
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {customer.projectList.slice(0, 2).map((p, i) => (
              <span key={i} className="text-[9px] text-brand-text-dim truncate max-w-full">
                {p}{i === 0 && customer.projectList.length > 1 ? ' · ' : ''}
              </span>
            ))}
            {customer.projectList.length > 2 && (
              <span className="text-[9px] text-brand-text-muted">+{customer.projectList.length - 2}</span>
            )}
          </div>
        </div>
      </div>

      <div className={`font-timer text-3xl font-bold tabular-nums mb-2 text-center ${config.textColor}`}>
        {minRemaining <= 0 ? (
          <span className="flex items-center justify-center gap-1">
            <AlertTriangle size={15} />
            {'\u8D85\u65F6'}
          </span>
        ) : formatCountdown(minRemaining)}
      </div>

      <div className="space-y-1">
        {activeParts.map((bp) => {
          const bpStatus = getStatus(bp as BodyPart)
          const remaining = getBodyPartRemaining(bp as BodyPart)
          const total = bp.duration * 60000
          const progress = remaining > 0 ? Math.max(0, Math.min(1, 1 - remaining / total)) : 1
          const bpColor = bpStatus === 'overdue' ? 'bg-brand-coral'
            : bpStatus === 'nearing' ? 'bg-brand-gold'
            : bpStatus === 'pausing' ? 'bg-brand-text-muted'
            : 'bg-brand-mint'
          const expectedEnd = getExpectedEndTime(bp as BodyPart)

          return (
            <div key={bp.id} className="flex items-center gap-1.5">
              <span className="text-[10px] text-brand-text-dim w-8 shrink-0">{bp.name}</span>
              <div className="flex-1 h-1.5 bg-brand-bg rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${bpColor}`}
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="flex flex-col items-end shrink-0 leading-none">
                <span className={`font-timer text-[10px] font-medium tabular-nums ${
                  bpStatus === 'overdue' ? 'text-brand-coral'
                  : bpStatus === 'nearing' ? 'text-brand-gold'
                  : 'text-brand-text-dim'
                }`}>
                  {remaining > 0 ? formatCountdown(remaining) : '\u8D85\u65F6'}
                </span>
                <span className="text-[8px] text-brand-text-muted">
                  {'\u5230'} {formatTime(expectedEnd)}
                </span>
              </div>
            </div>
          )
        })}
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
    <div className="px-4 pt-4 pb-2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold text-brand-text">
            {'\u623F\u95F4\u8BA1\u65F6'}
          </h1>
          <p className="text-[10px] text-brand-text-muted mt-0.5">
            {'\u8D85\u65F6\u81EA\u52A8\u7F6E\u9876 \u00B7 \u6682\u505C\u540E\u9884\u8BA1\u65F6\u95F4\u987A\u5EF6'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 text-[10px]">
            <span className="w-2 h-2 rounded-sm bg-brand-mint" />
            {'\u6577\u9EBB\u4E2D'}
          </span>
          <span className="flex items-center gap-1 text-[10px]">
            <span className="w-2 h-2 rounded-sm bg-brand-gold" />
            {'\u4E34\u8FD1'}
          </span>
          <span className="flex items-center gap-1 text-[10px]">
            <span className="w-2 h-2 rounded-sm bg-brand-coral" />
            {'\u8D85\u65F6'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {sortedRooms.map((room) => {
          const customer = customers.find((c) => c.roomId === room.id && c.queueStatus === 'in_room')
          return <RoomCard key={room.id} room={room} customer={customer} />
        })}
      </div>
    </div>
  )
}
