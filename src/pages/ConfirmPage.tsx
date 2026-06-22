import { useParams, useNavigate } from 'react-router-dom'
import { useClinicStore } from '@/stores/useClinicStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTimer } from '@/hooks/useTimer'
import { useAudio } from '@/hooks/useAudio'
import { formatCountdown, getBodyPartRemaining, formatTime, getExpectedEndTime } from '@/utils/time'
import { useEffect, useState } from 'react'
import {
  Clock, Stethoscope, Hand, Pause, Play,
  AlertTriangle, CheckCircle2, ArrowLeft, ShieldCheck, Bell, Phone, StickyNote
} from 'lucide-react'
import type { BodyPart, Customer, OperationLog } from '@/types'

const ACTION_LABELS: Record<string, string> = {
  start: '\u5F00\u59CB\u6577\u9EBB',
  evaluate: '\u8BC4\u4F30\u786E\u8BA4',
  remove: '\u63ED\u9EBB\u6E05\u6D01',
  pause: '\u6682\u505C\u8BA1\u65F6',
  resume: '\u6062\u590D\u8BA1\u65F6',
  complete: '\u6D41\u7A0B\u5B8C\u6210',
  remind: '\u5DF2\u50AC\u529E',
  notify_doctor: '\u5DF2\u901A\u77E5\u533B\u751F',
}

const ACTION_COLORS: Record<string, string> = {
  start: 'bg-brand-mint',
  evaluate: 'bg-brand-ice',
  remove: 'bg-brand-ice',
  pause: 'bg-brand-gold',
  resume: 'bg-brand-mint',
  complete: 'bg-brand-mint',
  remind: 'bg-brand-gold',
  notify_doctor: 'bg-brand-coral',
}

function PartActionCard({
  bp,
  customerId,
  roomId,
  getStatus,
}: {
  bp: BodyPart
  customerId: string
  roomId: string
  getStatus: (bp: BodyPart) => string
}) {
  const evaluateBodyPart = useClinicStore((s) => s.evaluateBodyPart)
  const removeBodyPart = useClinicStore((s) => s.removeBodyPart)
  const remindBodyPart = useClinicStore((s) => s.remindBodyPart)
  const notifyDoctor = useClinicStore((s) => s.notifyDoctor)
  const customers = useClinicStore((s) => s.customers)
  const operationLogs = useClinicStore((s) => s.operationLogs)

  const customer = customers.find((c) => c.id === customerId)
  const settings = useSettingsStore((s) => s.settings)

  const remaining = getBodyPartRemaining(bp)
  const status = getStatus(bp)
  const isCompleted = bp.status === 'completed'
  const isPausing = status === 'pausing'
  const isOverdue = status === 'overdue'
  const isNearing = status === 'nearing'

  const statusColor = isCompleted ? 'text-brand-text-muted'
    : isOverdue ? 'text-brand-coral'
    : isNearing ? 'text-brand-gold'
    : isPausing ? 'text-brand-text-dim'
    : 'text-brand-mint'

  const statusLabel = isCompleted ? '\u5DF2\u5B8C\u6210'
    : isPausing ? '\u6682\u505C\u4E2D'
    : isOverdue ? '\u5DF2\u8D85\u65F6'
    : isNearing ? '\u4E34\u8FD1\u5230\u70B9'
    : '\u6577\u9EBB\u4E2D'

  const total = bp.duration * 60000
  const progress = remaining > 0 && !isCompleted ? Math.max(0, Math.min(1, 1 - remaining / total)) : isCompleted ? 1 : 1
  const barColor = isCompleted ? 'bg-brand-text-muted'
    : isOverdue ? 'bg-brand-coral'
    : isNearing ? 'bg-brand-gold'
    : isPausing ? 'bg-brand-text-muted'
    : 'bg-brand-mint'
  const expectedEnd = getExpectedEndTime(bp)

  const partLogs = operationLogs.filter(
    (l) => l.customerId === customerId && l.bodyPartId === bp.id
  )

  return (
    <div className={`rounded-xl border p-3 animate-fade-in ${
      isCompleted ? 'border-brand-border/50 bg-brand-card/50' :
      isOverdue ? 'border-brand-coral/50 bg-brand-coral/5 animate-flash-red' :
      isNearing ? 'border-brand-gold/50 bg-brand-gold/5 animate-pulse-border' :
      isPausing ? 'border-brand-text-muted/30 bg-brand-card' :
      'border-brand-border bg-brand-card'
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-brand-text">{bp.name}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor} ${
            isCompleted ? 'bg-brand-card' :
            isOverdue ? 'bg-brand-coral/10' :
            isNearing ? 'bg-brand-gold/10' :
            isPausing ? 'bg-brand-card' :
            'bg-brand-mint/10'
          }`}>
            {statusLabel}
          </span>
          {bp.remindCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-brand-gold/15 text-brand-gold">
              <Bell size={9} />
              {bp.remindCount}{'\u6B21\u50AC'}
            </span>
          )}
          {bp.doctorNotifiedAt && (
            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-brand-coral/15 text-brand-coral">
              <Phone size={9} />
              {formatTime(bp.doctorNotifiedAt)}
            </span>
          )}
        </div>
        <div className={`font-timer text-xl font-bold tabular-nums ${statusColor}`}>
          {isCompleted ? '\u2705' : remaining <= 0 ? '\u8D85\u65F6' : formatCountdown(remaining)}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-2 bg-brand-bg rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-brand-text-muted mb-2.5">
        <span>{'\u5F00\u59CB'} {formatTime(bp.startTime)}</span>
        <span>{'\u9884\u8BA1\u5230\u70B9'} {formatTime(expectedEnd)}</span>
      </div>

      {!isPausing && (
        <div className="flex gap-1.5 mb-2.5 flex-wrap">
          {isOverdue && (
            <>
              <button
                onClick={() => remindBodyPart(customerId, bp.id, '\u62A4\u58EB')}
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-gold/10 text-brand-gold text-xs font-medium hover:bg-brand-gold/20 active:scale-[0.98] transition-all"
              >
                <Bell size={12} />
                {'\u50AC\u529E\u63D0\u9192'}
              </button>
              {!bp.doctorNotifiedAt && (
                <button
                  onClick={() => notifyDoctor(customerId, bp.id, '\u62A4\u58EB')}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-coral/10 text-brand-coral text-xs font-medium hover:bg-brand-coral/20 active:scale-[0.98] transition-all"
                >
                  <Phone size={12} />
                  {'\u901A\u77E5\u533B\u751F'}
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {!bp.evaluatedAt && !isCompleted && !isPausing && (
          <button
            onClick={() => evaluateBodyPart(customerId, bp.id, '\u533B\u751F')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand-mint/10 text-brand-mint text-xs font-medium hover:bg-brand-mint/20 active:scale-[0.98] transition-all"
          >
            <Stethoscope size={13} />
            {'\u5DF2\u8BC4\u4F30\u53EF\u64CD\u4F5C'}
          </button>
        )}
        {bp.evaluatedAt && !isCompleted && !isPausing && (
          <button
            onClick={() => removeBodyPart(customerId, bp.id, '\u62A4\u58EB')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand-ice/10 text-brand-ice text-xs font-medium hover:bg-brand-ice/20 active:scale-[0.98] transition-all"
          >
            <Hand size={13} />
            {'\u5DF2\u63ED\u9EBB\u5E76\u6E05\u6D01'}
          </button>
        )}
        {bp.evaluatedAt && (
          <span className="flex items-center gap-1 text-xs text-brand-mint shrink-0 self-center">
            <ShieldCheck size={12} />
            {formatTime(bp.evaluatedAt)}
          </span>
        )}
        {isCompleted && (
          <span className="flex items-center gap-1 text-xs text-brand-text-muted shrink-0 self-center">
            <CheckCircle2 size={12} />
            {'\u5DF2\u5B8C\u6210'}
          </span>
        )}
      </div>

      {partLogs.length > 0 && (
        <div className="mt-2 pt-2 border-t border-brand-border/40">
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {partLogs
              .filter((l) => l.action !== 'start')
              .slice(-3)
              .map((log) => (
                <span key={log.id} className="text-[9px] text-brand-text-muted">
                  {formatTime(log.timestamp)} {ACTION_LABELS[log.action] || log.action}
                  {log.operatorRole === 'doctor' ? '(医)' : '(护)'}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ConfirmPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const customer = useClinicStore((s) => s.getCustomerByRoom(roomId || '')) as Customer | undefined
  const room = useClinicStore((s) => s.rooms.find((r) => r.id === roomId))
  const pauseCustomer = useClinicStore((s) => s.pauseCustomer)
  const resumeCustomer = useClinicStore((s) => s.resumeCustomer)
  const operationLogs = useClinicStore((s) => s.operationLogs)
  const settings = useSettingsStore((s) => s.settings)
  const { playAlert } = useAudio()

  const activeParts = customer ? customer.bodyParts.filter((bp) => bp.status !== 'completed') : []
  const { getStatus, hasOverdue } = useTimer(activeParts)

  const [alertPlayed, setAlertPlayed] = useState(false)

  useEffect(() => {
    if (hasOverdue && !alertPlayed) {
      playAlert()
      setAlertPlayed(true)
    }
    if (!hasOverdue) {
      setAlertPlayed(false)
    }
  }, [hasOverdue, alertPlayed, playAlert])

  if (!customer || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Clock size={48} className="text-brand-text-muted/30 mb-3" />
        <p className="text-sm text-brand-text-muted">{'\u623F\u95F4\u65E0\u987E\u5BA2'}</p>
        <button
          onClick={() => navigate('/rooms')}
          className="mt-4 px-4 py-2 rounded-lg bg-brand-card text-brand-text-dim text-sm hover:bg-brand-border/50"
        >
          {'\u8FD4\u56DE\u623F\u95F4\u5217\u8868'}
        </button>
      </div>
    )
  }

  const displayName = settings.hideFullName ? customer.nickname : customer.fullName
  const isPausing = room.status === 'pausing'
  const customerLogs = operationLogs
    .filter((l) => l.customerId === customer.id && !l.bodyPartId)
    .slice(-4)
    .reverse()

  return (
    <div className="px-4 pt-4 pb-2">
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-lg bg-brand-card flex items-center justify-center text-brand-text-dim hover:text-brand-text"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-brand-text flex items-center gap-1.5">
            {room.name}
            {hasOverdue && <AlertTriangle size={16} className="text-brand-coral" />}
          </h1>
          <p className="text-[10px] text-brand-text-muted">
            {displayName} · {customer.project}
            {customer.bodyParts.length > 0 && ` · ${customer.bodyParts.length}个部位`}
          </p>
        </div>
      </div>

      {customer.remarks && (
        <div className="mb-3 p-2.5 rounded-xl bg-brand-gold/8 border border-brand-gold/25 flex items-start gap-1.5 animate-fade-in">
          <StickyNote size={13} className="text-brand-gold shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-brand-gold mb-0.5 font-medium">{'\u6CBB\u7597\u5907\u6CE8'}</p>
            <p className="text-xs text-brand-text leading-snug break-words">{customer.remarks}</p>
          </div>
        </div>
      )}

      {isPausing && (
        <div className="mb-3 p-2.5 rounded-xl bg-brand-card border border-brand-text-muted/30 flex items-center gap-2 animate-fade-in">
          <Pause size={14} className="text-brand-text-dim shrink-0" />
          <span className="text-xs text-brand-text-dim">顾客暂离，计时已暂停，请勿继续占用治疗床</span>
        </div>
      )}

      <div className="flex flex-col gap-2.5 mb-4">
        {customer.bodyParts.map((bp) => (
          <PartActionCard
            key={bp.id}
            bp={bp}
            customerId={customer.id}
            roomId={room.id}
            getStatus={getStatus}
          />
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {isPausing ? (
          <button
            onClick={() => resumeCustomer(customer.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-brand-mint text-brand-bg text-sm font-bold hover:bg-brand-mint-dark active:scale-[0.98] transition-all"
          >
            <Play size={16} />
            {'\u987E\u5BA2\u5DF2\u8FD4\u56DE\uFF0C\u6062\u590D\u8BA1\u65F6'}
          </button>
        ) : (
          <button
            onClick={() => pauseCustomer(customer.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-brand-coral/10 text-brand-coral text-sm font-bold hover:bg-brand-coral/20 active:scale-[0.98] transition-all border border-brand-coral/20"
          >
            <Pause size={16} />
            {'\u6682\u505C\u7B49\u5F85'}
          </button>
        )}
      </div>

      {customerLogs.length > 0 && (
        <div>
          <h3 className="text-[10px] text-brand-text-dim mb-1.5 font-medium">{'\u5168\u5C40\u64CD\u4F5C\u8BB0\u5F55'}</h3>
          <div className="relative pl-4 border-l-2 border-brand-border/50 ml-0.5">
            {customerLogs.map((log) => {
              const actionColor = ACTION_COLORS[log.action] || 'bg-brand-border'
              return (
                <div key={log.id} className="relative mb-1.5 last:mb-0">
                  <div className={`absolute left-[-17px] top-0.5 w-2 h-2 rounded-full border-2 border-brand-card ${actionColor}`} />
                  <div className="flex items-center gap-1.5 text-[10px] flex-wrap">
                    <span className="font-timer text-brand-text-dim tabular-nums">{formatTime(log.timestamp)}</span>
                    <span className="text-brand-text">{ACTION_LABELS[log.action] || log.action}</span>
                    <span className="text-brand-text-muted">
                      {log.operator}({log.operatorRole === 'doctor' ? '\u533B\u751F' : '\u62A4\u58EB'})
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {hasOverdue && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-brand-coral animate-pulse z-50" />
      )}
    </div>
  )
}
