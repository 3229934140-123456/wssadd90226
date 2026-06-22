import { useNavigate } from 'react-router-dom'
import { useClinicStore } from '@/stores/useClinicStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTimer } from '@/hooks/useTimer'
import { formatCountdown, getBodyPartRemaining, getExpectedEndTime, formatTime } from '@/utils/time'
import { AlertTriangle, Clock, Pause, Bell, Phone, TrendingUp, CheckCircle2, StickyNote } from 'lucide-react'
import type { BodyPart, Customer, Room } from '@/types'

type Zone = 'overdue' | 'nearing' | 'pausing' | 'active'

const ZONE_CONFIG: Record<Zone, {
  title: string;
  subtitle: string;
  bg: string;
  border: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  icon: any;
  badge: string;
}> = {
  overdue: {
    title: '超时未处理',
    subtitle: '\u7B2C\u4E00\u4F18\u5148\u5904\u7406',
    bg: 'bg-brand-coral/5',
    border: 'border-brand-coral/40',
    cardBg: 'bg-brand-coral/10',
    cardBorder: 'border-brand-coral',
    textColor: 'text-brand-coral',
    icon: AlertTriangle,
    badge: 'bg-brand-coral',
  },
  nearing: {
    title: '临近揭麻',
    subtitle: '\u51C6\u5907\u63A5\u5904',
    bg: 'bg-brand-gold/5',
    border: 'border-brand-gold/40',
    cardBg: 'bg-brand-gold/10',
    cardBorder: 'border-brand-gold',
    textColor: 'text-brand-gold',
    icon: Clock,
    badge: 'bg-brand-gold',
  },
  pausing: {
    title: '暂停等待',
    subtitle: '\u987E\u5BA2\u6682\u79BB',
    bg: 'bg-brand-text-muted/5',
    border: 'border-brand-text-muted/40',
    cardBg: 'bg-brand-card',
    cardBorder: 'border-brand-text-muted/50',
    textColor: 'text-brand-text-dim',
    icon: Pause,
    badge: 'bg-brand-text-muted',
  },
  active: {
    title: '敷麻进行中',
    subtitle: '\u6B63\u5E38\u8BA1\u65F6',
    bg: 'bg-brand-mint/5',
    border: 'border-brand-mint/40',
    cardBg: 'bg-brand-mint/10',
    cardBorder: 'border-brand-mint/30',
    textColor: 'text-brand-mint',
    icon: TrendingUp,
    badge: 'bg-brand-mint',
  },
}

interface OccupantInfo {
  customer: Customer
  room: Room
  zone: Zone
  minRemaining: number
  maxRemaining: number
  hasRemind: boolean
  hasNotify: boolean
  remindCount: number
  expectedEndTime: number
}

function classifyRoom(customer: Customer, getStatus: (bp: BodyPart) => string): { zone: Zone; minRem: number; maxRem: number; expectedEnd: number } {
  const activeParts = customer.bodyParts.filter((bp) => bp.status !== 'completed')
  if (activeParts.length === 0) {
    const minRem = Math.min(...customer.bodyParts.map((bp) => getBodyPartRemaining(bp as BodyPart)))
    const expectedEnd = Math.max(...customer.bodyParts.map((bp) => getExpectedEndTime(bp as BodyPart)))
    return { zone: 'active', minRem, maxRem: minRem, expectedEnd }
  }
  const remainings = activeParts.map((bp) => getBodyPartRemaining(bp as BodyPart))
  const minRem = Math.min(...remainings)
  const maxRem = Math.max(...remainings)
  const statuses = activeParts.map((bp) => getStatus(bp as BodyPart))

  const expectedEnd = Math.max(...activeParts.map((bp) => getExpectedEndTime(bp as BodyPart)))

  if (statuses.includes('overdue')) return { zone: 'overdue', minRem, maxRem, expectedEnd }
  if (statuses.some((s) => s === 'pausing')) return { zone: 'pausing', minRem, maxRem, expectedEnd }
  if (statuses.includes('nearing')) return { zone: 'nearing', minRem, maxRem, expectedEnd }
  return { zone: 'active', minRem, maxRem, expectedEnd }
}

function OccCard({ occupant, isOverdueFlash }: { occupant: OccupantInfo; isOverdueFlash: boolean }) {
  const navigate = useNavigate()
  const settings = useSettingsStore((s) => s.settings)
  const cfg = ZONE_CONFIG[occupant.zone]
  const Icon = cfg.icon
  const displayName = settings.hideFullName ? occupant.customer.nickname : occupant.customer.fullName

  return (
    <button
      onClick={() => navigate(`/confirm/${occupant.room.id}`)}
      className={`w-full text-left p-3 rounded-2xl border-2 transition-all ${cfg.cardBg} ${cfg.cardBorder} ${
        isOverdueFlash ? 'animate-flash-red' : occupant.zone === 'nearing' ? 'animate-pulse-border' : 'hover:scale-[1.01]'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black text-brand-text">{occupant.room.name}</span>
          <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded ${cfg.textColor} bg-brand-card/80`}>
            <Icon size={9} />
            {cfg.title}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {occupant.customer.remarks && <StickyNote size={10} className="text-brand-gold" />}
          {occupant.hasRemind && (
            <span className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded bg-brand-gold/20 text-brand-gold font-bold">
              <Bell size={8} />
              {occupant.remindCount}
            </span>
          )}
          {occupant.hasNotify && (
            <span className="inline-flex items-center text-[9px] px-1 py-0.5 rounded bg-brand-coral/20 text-brand-coral font-bold">
              <Phone size={8} />
            </span>
          )}
        </div>
      </div>

      <div className="mb-2">
        <p className="text-base font-bold text-brand-text truncate">{displayName}</p>
        <p className="text-[10px] text-brand-text-dim truncate">{occupant.customer.project}</p>
      </div>

      <div className={`font-timer text-3xl font-black tabular-nums mb-1 ${cfg.textColor}`}>
        {occupant.zone === 'overdue' ? (
          <span className="flex items-center gap-1">
            <AlertTriangle size={16} />
            {'超时'}
          </span>
        ) : occupant.zone === 'pausing' ? (
          <span className="flex items-center gap-1">
            <Pause size={14} />
            {occupant.minRemaining > 0 ? formatCountdown(occupant.minRemaining) : '--:--'}
          </span>
        ) : (
          formatCountdown(Math.max(0, occupant.minRemaining))
        )}
      </div>

      <div className="flex items-center justify-between text-[9px] text-brand-text-muted">
        <span>{'\u9884\u8BA1\u5230\u70B9'} {formatTime(occupant.expectedEndTime)}</span>
        {occupant.customer.bodyParts.length > 1 && (
          <span className="font-medium">{occupant.customer.bodyParts.length}\u90E8\u4F4D</span>
        )}
      </div>
    </button>
  )
}

function ZoneColumn({ zone, occupants, totalCount }: { zone: Zone; occupants: OccupantInfo[]; totalCount: number }) {
  const cfg = ZONE_CONFIG[zone]
  const Icon = cfg.icon

  const sorted = [...occupants].sort((a, b) => {
    if (zone === 'overdue') return Math.abs(a.minRemaining) - Math.abs(b.minRemaining)
    if (zone === 'nearing') return a.minRemaining - b.minRemaining
    if (zone === 'pausing') return a.maxRemaining - b.maxRemaining
    return a.minRemaining - b.minRemaining
  })

  return (
    <div className={`rounded-2xl border-2 p-3 flex flex-col min-h-0 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cfg.badge}/20 shrink-0`}>
            <Icon size={16} className={cfg.textColor} />
          </div>
          <div>
            <h2 className={`text-base font-black ${cfg.textColor} leading-tight`}>{cfg.title}</h2>
            <p className="text-[9px] text-brand-text-muted leading-tight">{cfg.subtitle}</p>
          </div>
        </div>
        <span className={`text-xl font-black tabular-nums px-2.5 py-1 rounded-xl bg-brand-card ${cfg.textColor} shrink-0`}>
          {occupants.length}
          <span className="text-[10px] text-brand-text-muted font-normal ml-1">/ {totalCount}</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 custom-scrollbar">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-brand-text-muted/40">
            <CheckCircle2 size={32} className="mb-2" />
            <p className="text-xs">{'\u6682\u65E0\u6B64\u7C7B\u623F\u95F4'}</p>
          </div>
        ) : (
          sorted.map((o) => (
            <OccCard key={o.room.id} occupant={o} isOverdueFlash={zone === 'overdue'} />
          ))
        )}
      </div>
    </div>
  )
}

export default function Overview() {
  const rooms = useClinicStore((s) => s.rooms)
  const customers = useClinicStore((s) => s.customers)
  const allParts = customers.flatMap((c) => c.bodyParts.filter((bp) => bp.status !== 'completed')) as BodyPart[]
  const { getStatus } = useTimer(allParts)

  const occupants: OccupantInfo[] = []
  rooms.forEach((room) => {
    const customer = customers.find((c) => c.roomId === room.id && c.queueStatus === 'in_room')
    if (!customer) return
    const { zone, minRem, maxRem, expectedEnd } = classifyRoom(customer, getStatus)
    const remindCount = customer.bodyParts.reduce((s, bp) => s + (bp.remindCount || 0), 0)
    occupants.push({
      customer,
      room,
      zone,
      minRemaining: minRem,
      maxRemaining: maxRem,
      hasRemind: remindCount > 0,
      hasNotify: customer.bodyParts.some((bp) => bp.doctorNotifiedAt),
      remindCount,
      expectedEndTime: expectedEnd,
    })
  })

  const grouped: Record<Zone, OccupantInfo[]> = {
    overdue: [],
    nearing: [],
    pausing: [],
    active: [],
  }
  occupants.forEach((o) => grouped[o.zone].push(o))

  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日 ${['日','一','二','三','四','五','六'][now.getDay()]}`

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col px-3 py-3 gap-3 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 px-1">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-black text-brand-text">{'值守总览看板'}</h1>
            <p className="text-[10px] text-brand-text-muted mt-0.5">
              {'\u5728\u6CBB\u623F\u95F4'} {occupants.length} {'\u4E2A \u00B7 \u70B9\u51FB\u5361\u7247\u8FDB\u5165\u5904\u7406'}
            </p>
          </div>
        </div>
        <div className="flex items-end gap-3 text-right">
          <div>
            <p className="font-timer text-2xl font-black text-brand-text tabular-nums leading-none">{timeStr}</p>
            <p className="text-[10px] text-brand-text-muted mt-0.5">{dateStr}</p>
          </div>
          <div className="flex flex-col gap-0.5 text-[9px] text-brand-text-muted items-end">
            {(Object.keys(ZONE_CONFIG) as Zone[]).map((z) => {
              const c = ZONE_CONFIG[z]
              return (
                <span key={z} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-sm ${c.badge}`} />
                  {c.title}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 flex-1 min-h-0">
        {(Object.keys(ZONE_CONFIG) as Zone[]).map((z) => (
          <ZoneColumn key={z} zone={z} occupants={grouped[z]} totalCount={occupants.length} />
        ))}
      </div>
    </div>
  )
}
