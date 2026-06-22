import { useParams, useNavigate } from 'react-router-dom'
import { useClinicStore } from '@/stores/useClinicStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useTimer } from '@/hooks/useTimer'
import { useAudio } from '@/hooks/useAudio'
import { formatCountdown, getBodyPartRemaining, getBodyPartStatus, formatTime } from '@/utils/time'
import { useEffect, useState } from 'react'
import {
  User, Clock, Stethoscope, Hand, Pause, Play,
  AlertTriangle, CheckCircle2, ArrowLeft, ShieldCheck, Sparkles
} from 'lucide-react'
import type { BodyPart } from '@/types'

function PartActionCard({
  bp,
  customerId,
  getStatus,
}: {
  bp: BodyPart
  customerId: string
  getStatus: (bp: BodyPart) => string
}) {
  const evaluateBodyPart = useClinicStore((s) => s.evaluateBodyPart)
  const removeBodyPart = useClinicStore((s) => s.removeBodyPart)
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

  return (
    <div className={`rounded-xl border p-4 animate-fade-in ${
      isCompleted ? 'border-brand-border/50 bg-brand-card/50' :
      isOverdue ? 'border-brand-coral/50 bg-brand-coral/5 animate-flash-red' :
      isNearing ? 'border-brand-gold/50 bg-brand-gold/5 animate-pulse-border' :
      isPausing ? 'border-brand-text-muted/30 bg-brand-card' :
      'border-brand-border bg-brand-card'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
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
        </div>
        <div className={`font-timer text-2xl font-bold tabular-nums ${statusColor}`}>
          {isCompleted ? '\u2705' : remaining <= 0 ? '\u8D85\u65F6' : formatCountdown(remaining)}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-2 bg-brand-bg rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-brand-text-muted mb-3">
        <span>{'\u5F00\u59CB'} {formatTime(bp.startTime)}</span>
        <span>{'\u9884\u8BA1\u63ED\u9EBB'} {formatTime(bp.startTime + bp.duration * 60000 + bp.pausedDuration)}</span>
      </div>

      <div className="flex gap-2">
        {!bp.evaluatedAt && !isCompleted && !isPausing && (
          <button
            onClick={() => evaluateBodyPart(customerId, bp.id, '\u533B\u751F')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-brand-mint/10 text-brand-mint text-sm font-medium hover:bg-brand-mint/20 active:scale-[0.98] transition-all"
          >
            <Stethoscope size={14} />
            {'\u5DF2\u8BC4\u4F30\u53EF\u64CD\u4F5C'}
          </button>
        )}
        {bp.evaluatedAt && !isCompleted && !isPausing && (
          <button
            onClick={() => removeBodyPart(customerId, bp.id, '\u62A4\u58EB')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-brand-ice/10 text-brand-ice text-sm font-medium hover:bg-brand-ice/20 active:scale-[0.98] transition-all"
          >
            <Hand size={14} />
            {'\u5DF2\u63ED\u9EBB\u5E76\u6E05\u6D01'}
          </button>
        )}
        {bp.evaluatedAt && (
          <span className="flex items-center gap-1 text-xs text-brand-mint">
            <ShieldCheck size={12} />
            {'\u5DF2\u8BC4\u4F30'}
          </span>
        )}
        {isCompleted && (
          <span className="flex items-center gap-1 text-xs text-brand-text-muted">
            <CheckCircle2 size={12} />
            {'\u5DF2\u5B8C\u6210'}
          </span>
        )}
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const customer = useClinicStore((s) => s.getCustomerByRoom(roomId || ''))
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
  const logs = operationLogs.filter((l) => l.customerId === customer.id).slice(-5).reverse()

  const ACTION_LABELS: Record<string, string> = {
    start: '\u5F00\u59CB\u6577\u9EBB',
    evaluate: '\u8BC4\u4F30\u786E\u8BA4',
    remove: '\u63ED\u9EBB\u6E05\u6D01',
    pause: '\u6682\u505C\u8BA1\u65F6',
    resume: '\u6062\u590D\u8BA1\u65F6',
    complete: '\u6D41\u7A0B\u5B8C\u6210',
  }

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-lg bg-brand-card flex items-center justify-center text-brand-text-dim hover:text-brand-text"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-brand-text flex items-center gap-2">
            {room.name}
            {hasOverdue && <AlertTriangle size={18} className="text-brand-coral" />}
          </h1>
          <p className="text-xs text-brand-text-muted">{displayName} \u00B7 {customer.project}</p>
        </div>
      </div>

      {isPausing && (
        <div className="mb-4 p-3 rounded-xl bg-brand-card border border-brand-text-muted/30 flex items-center gap-2 animate-fade-in">
          <Pause size={16} className="text-brand-text-dim" />
          <span className="text-sm text-brand-text-dim">{'\u987E\u5BA2\u6682\u79BB\uFF0C\u8BA1\u65F6\u5DF2\u6682\u505C\uFF0C\u8BF7\u52FF\u7EE7\u7EED\u5360\u7528\u6CBB\u7597\u5E8A'}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-5">
        {customer.bodyParts.map((bp) => (
          <PartActionCard
            key={bp.id}
            bp={bp}
            customerId={customer.id}
            getStatus={getStatus}
          />
        ))}
      </div>

      <div className="flex gap-3 mb-6">
        {isPausing ? (
          <button
            onClick={() => resumeCustomer(customer.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-mint text-brand-bg text-sm font-bold hover:bg-brand-mint-dark active:scale-[0.98] transition-all"
          >
            <Play size={18} />
            {'\u987E\u5BA2\u5DF2\u8FD4\u56DE\uFF0C\u6062\u590D\u8BA1\u65F6'}
          </button>
        ) : (
          <button
            onClick={() => pauseCustomer(customer.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-coral/10 text-brand-coral text-sm font-bold hover:bg-brand-coral/20 active:scale-[0.98] transition-all border border-brand-coral/20"
          >
            <Pause size={18} />
            {'\u6682\u505C\u7B49\u5F85'}
          </button>
        )}
      </div>

      {logs.length > 0 && (
        <div>
          <h3 className="text-xs text-brand-text-dim mb-2 font-medium">{'\u64CD\u4F5C\u8BB0\u5F55'}</h3>
          <div className="relative pl-5">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-brand-border" />
            {logs.map((log) => (
              <div key={log.id} className="relative mb-3 last:mb-0 animate-fade-in">
                <div className={`absolute left-[-13px] top-1.5 w-2.5 h-2.5 rounded-full border-2 ${
                  log.action === 'complete' ? 'bg-brand-mint border-brand-mint' :
                  log.action === 'evaluate' ? 'bg-brand-ice border-brand-ice' :
                  log.action === 'pause' ? 'bg-brand-coral border-brand-coral' :
                  'bg-brand-card border-brand-border'
                }`} />
                <div className="text-xs">
                  <span className="text-brand-text-dim">{formatTime(log.timestamp)}</span>
                  <span className="text-brand-text ml-2">{ACTION_LABELS[log.action] || log.action}</span>
                  <span className="text-brand-text-muted ml-2">{log.operator}({log.operatorRole === 'doctor' ? '\u533B\u751F' : '\u62A4\u58EB'})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasOverdue && (
        <div className="fixed top-0 left-0 right-0 h-1.5 bg-brand-coral animate-pulse z-50" />
      )}
    </div>
  )
}
