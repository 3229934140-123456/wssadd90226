import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClinicStore } from '@/stores/useClinicStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTimer } from '@/hooks/useTimer'
import { formatCountdown, getBodyPartRemaining, getBodyPartStatus, formatTime } from '@/utils/time'
import { Clock, MapPin, ChevronRight, AlertTriangle } from 'lucide-react'
import type { Customer } from '@/types'

type FilterType = 'all' | 'waiting' | 'in_room' | 'overdue'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  waiting: { label: '\u7B49\u5F85\u4E2D', color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
  active: { label: '\u6577\u9EBB\u4E2D', color: 'text-brand-mint', bg: 'bg-brand-mint/10' },
  nearing: { label: '\u4E34\u8FD1\u5230\u70B9', color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
  overdue: { label: '\u5DF2\u8D85\u65F6', color: 'text-brand-coral', bg: 'bg-brand-coral/10' },
  pausing: { label: '\u6682\u505C\u7B49\u5F85', color: 'text-brand-text-dim', bg: 'bg-brand-card' },
  completed: { label: '\u5DF2\u5B8C\u6210', color: 'text-brand-text-muted', bg: 'bg-brand-card' },
}

function CustomerCard({ customer }: { customer: Customer }) {
  const navigate = useNavigate()
  const settings = useSettingsStore((s) => s.settings)
  const rooms = useClinicStore((s) => s.rooms)
  const { getStatus } = useTimer(customer.bodyParts)

  const activeParts = customer.bodyParts.filter((bp) => bp.status !== 'completed')
  const worstStatus = activeParts.length > 0
    ? activeParts.reduce<string>((worst, bp) => {
        const s = getStatus(bp)
        if (s === 'overdue') return 'overdue'
        if (s === 'nearing' && worst !== 'overdue') return 'nearing'
        if (worst === '') return s
        return worst
      }, '')
    : ''

  const displayStatus = customer.queueStatus === 'waiting' ? 'waiting' :
    customer.queueStatus === 'completed' ? 'completed' :
    activeParts.some((bp) => getStatus(bp) === 'pausing') ? 'pausing' :
    worstStatus || 'active'

  const config = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.active
  const room = rooms.find((r) => r.id === customer.roomId)
  const displayName = settings.hideFullName ? customer.nickname : customer.fullName

  const minRemaining = activeParts.length > 0
    ? Math.min(...activeParts.map((bp) => getBodyPartRemaining(bp)))
    : 0

  return (
    <button
      onClick={() => {
        if (customer.roomId) navigate(`/confirm/${customer.roomId}`)
      }}
      className={`w-full text-left rounded-xl border-2 transition-all animate-fade-in ${
        displayStatus === 'overdue'
          ? 'border-brand-coral animate-flash-red'
          : displayStatus === 'nearing'
          ? 'border-brand-gold animate-pulse-border'
          : 'border-brand-border hover:border-brand-mint/30'
      }`}
    >
      <div className="flex items-stretch bg-brand-card rounded-[10px] overflow-hidden">
        <div className={`w-1.5 shrink-0 ${
          displayStatus === 'overdue' ? 'bg-brand-coral' :
          displayStatus === 'nearing' ? 'bg-brand-gold' :
          displayStatus === 'waiting' ? 'bg-brand-gold/60' :
          displayStatus === 'pausing' ? 'bg-brand-text-muted' :
          displayStatus === 'completed' ? 'bg-brand-text-muted' :
          'bg-brand-mint'
        }`} />
        <div className="flex-1 p-3.5 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-base font-semibold text-brand-text truncate">
                {displayName}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${config.color} ${config.bg}`}>
                {config.label}
              </span>
            </div>
            {activeParts.length > 0 && displayStatus !== 'completed' && (
              <div className={`font-timer text-xl font-bold tabular-nums ${
                displayStatus === 'overdue' ? 'text-brand-coral' :
                displayStatus === 'nearing' ? 'text-brand-gold' :
                'text-brand-mint'
              }`}>
                {minRemaining <= 0 ? (
                  <span className="flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {'\u8D85\u65F6'}
                  </span>
                ) : formatCountdown(minRemaining)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-brand-text-dim">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {customer.project}
            </span>
            {customer.bodyParts.length > 0 && (
              <span className="flex items-center gap-1">
                {customer.bodyParts.filter((bp) => bp.status !== 'completed').map((bp) => bp.name).join('\u3001')}
              </span>
            )}
            {room && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {room.name}
              </span>
            )}
          </div>
          {activeParts.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {activeParts.map((bp) => {
                const bpStatus = getStatus(bp)
                const remaining = getBodyPartRemaining(bp)
                const bpConfig = STATUS_CONFIG[bpStatus] || STATUS_CONFIG.active
                return (
                  <span
                    key={bp.id}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${bpConfig.color} ${bpConfig.bg}`}
                  >
                    {bp.name} {remaining > 0 ? formatCountdown(remaining) : '\u8D85\u65F6'}
                  </span>
                )
              })}
            </div>
          )}
          {displayStatus === 'waiting' && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-brand-text-muted">
                {'\u7B49\u5F85\u65F6\u95F4'}: {formatTime(customer.createdAt)} {'\u8FDB\u5E97'}
              </span>
              <ChevronRight size={14} className="text-brand-text-muted" />
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

export default function QueueWall() {
  const [filter, setFilter] = useState<FilterType>('all')
  const customers = useClinicStore((s) => s.customers)
  const rooms = useClinicStore((s) => s.rooms)

  const filteredCustomers = customers
    .filter((c) => {
      if (filter === 'all') return true
      if (filter === 'overdue') {
        return c.bodyParts.some((bp) => bp.status !== 'completed' && getBodyPartStatus(bp) === 'overdue')
      }
      return c.queueStatus === filter
    })
    .sort((a, b) => {
      const aOverdue = a.bodyParts.some((bp) => bp.status !== 'completed' && getBodyPartStatus(bp) === 'overdue')
      const bOverdue = b.bodyParts.some((bp) => bp.status !== 'completed' && getBodyPartStatus(bp) === 'overdue')
      if (aOverdue && !bOverdue) return -1
      if (!aOverdue && bOverdue) return 1
      const aNearing = a.bodyParts.some((bp) => bp.status !== 'completed' && getBodyPartStatus(bp) === 'nearing')
      const bNearing = b.bodyParts.some((bp) => bp.status !== 'completed' && getBodyPartStatus(bp) === 'nearing')
      if (aNearing && !bNearing) return -1
      if (!aNearing && bNearing) return 1
      return a.createdAt - b.createdAt
    })

  const tabs: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: '\u5168\u90E8', count: customers.length },
    { key: 'waiting', label: '\u7B49\u5F85\u4E2D', count: customers.filter((c) => c.queueStatus === 'waiting').length },
    { key: 'in_room', label: '\u6577\u9EBB\u4E2D', count: customers.filter((c) => c.queueStatus === 'in_room').length },
    { key: 'overdue', label: '\u5DF2\u8D85\u65F6', count: customers.filter((c) => c.bodyParts.some((bp) => bp.status !== 'completed' && getBodyPartStatus(bp) === 'overdue')).length },
  ]

  const activeRooms = rooms.filter((r) => r.status !== 'idle').length

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-brand-text">
            {'\u987E\u5BA2\u6392\u961F\u5899'}
          </h1>
          <p className="text-xs text-brand-text-muted mt-0.5">
            {'\u6D3B\u8DC3\u623F\u95F4'} {activeRooms}/{rooms.length} \u00B7 {'\u7B49\u5F85'} {customers.filter((c) => c.queueStatus === 'waiting').length} {'\u4EBA'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-brand-text-dim">
          <span className="w-2 h-2 rounded-full bg-brand-mint animate-pulse" />
          {'\u5B9E\u65F6\u66F4\u65B0'}
        </div>
      </div>

      <div className="flex gap-1 mb-4 bg-brand-surface rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
              filter === tab.key
                ? 'bg-brand-card text-brand-mint shadow-sm'
                : 'text-brand-text-muted hover:text-brand-text-dim'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1 text-[10px] ${
                filter === tab.key ? 'text-brand-mint/70' : 'text-brand-text-muted'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16 text-brand-text-muted">
            <Clock size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{'\u6682\u65E0\u987E\u5BA2'}</p>
          </div>
        ) : (
          filteredCustomers.map((c) => (
            <CustomerCard key={c.id} customer={c} />
          ))
        )}
      </div>
    </div>
  )
}
