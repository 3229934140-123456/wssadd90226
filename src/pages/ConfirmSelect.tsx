import { useNavigate } from 'react-router-dom'
import { useClinicStore } from '@/stores/useClinicStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTimer } from '@/hooks/useTimer'
import { formatCountdown, getBodyPartRemaining } from '@/utils/time'
import { Clock, ChevronRight, AlertTriangle, Pause } from 'lucide-react'
import type { BodyPart } from '@/types'

export default function ConfirmSelect() {
  const navigate = useNavigate()
  const rooms = useClinicStore((s) => s.rooms)
  const customers = useClinicStore((s) => s.customers)
  const settings = useSettingsStore((s) => s.settings)

  const activeRooms = rooms.filter((r) => r.status !== 'idle')

  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-bold text-brand-text mb-1">{'\u5B8C\u6210\u786E\u8BA4'}</h1>
      <p className="text-xs text-brand-text-muted mb-4">{'\u9009\u62E9\u623F\u95F4\u8FDB\u884C\u8BC4\u4F30\u6216\u63ED\u9EBB\u64CD\u4F5C'}</p>

      {activeRooms.length === 0 ? (
        <div className="text-center py-16 text-brand-text-muted">
          <Clock size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{'\u6682\u65E0\u6D3B\u8DC3\u623F\u95F4'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activeRooms.map((room) => {
            const customer = customers.find((c) => c.roomId === room.id && c.queueStatus === 'in_room')
            if (!customer) return null
            const activeParts = customer.bodyParts.filter((bp) => bp.status !== 'completed')
            return (
              <RoomSelectCard
                key={room.id}
                room={room}
                customer={customer}
                activeParts={activeParts}
                settings={settings}
                onClick={() => navigate(`/confirm/${room.id}`)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function RoomSelectCard({
  room,
  customer,
  activeParts,
  settings,
  onClick,
}: {
  room: { id: string; name: string; status: string }
  customer: { id: string; fullName: string; nickname: string; project: string }
  activeParts: BodyPart[]
  settings: { hideFullName: boolean }
  onClick: () => void
}) {
  const { getStatus } = useTimer(activeParts)
  const displayName = settings.hideFullName ? customer.nickname : customer.fullName
  const hasOverdue = activeParts.some((bp) => getStatus(bp) === 'overdue')
  const hasPausing = activeParts.some((bp) => getStatus(bp) === 'pausing')
  const minRemaining = activeParts.length > 0
    ? Math.min(...activeParts.map((bp) => getBodyPartRemaining(bp)))
    : 0

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all animate-fade-in ${
        hasOverdue ? 'border-brand-coral animate-flash-red' :
        hasPausing ? 'border-brand-text-muted/50 bg-brand-card' :
        'border-brand-border bg-brand-card hover:border-brand-mint/30'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            hasOverdue ? 'bg-brand-coral/20' : hasPausing ? 'bg-brand-text-muted/20' : 'bg-brand-mint/20'
          }`}>
            {hasPausing ? <Pause size={20} className="text-brand-text-dim" /> :
             hasOverdue ? <AlertTriangle size={20} className="text-brand-coral" /> :
             <Clock size={20} className="text-brand-mint" />}
          </div>
          <div>
            <div className="text-sm font-semibold text-brand-text">
              {room.name} \u00B7 {displayName}
            </div>
            <div className="text-xs text-brand-text-dim">
              {customer.project} \u00B7 {activeParts.map((bp) => bp.name).join('\u3001')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-timer text-lg font-bold tabular-nums ${
            hasOverdue ? 'text-brand-coral' : hasPausing ? 'text-brand-text-dim' : 'text-brand-mint'
          }`}>
            {minRemaining <= 0 ? '\u8D85\u65F6' : formatCountdown(minRemaining)}
          </span>
          <ChevronRight size={16} className="text-brand-text-muted" />
        </div>
      </div>
    </button>
  )
}
