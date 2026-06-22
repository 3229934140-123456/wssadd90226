import { useState } from 'react'
import { useClinicStore } from '@/stores/useClinicStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { formatTime, getBodyPartStatus, getBodyPartRemaining, getExpectedEndTime } from '@/utils/time'
import {
  FileText, Download, MapPin, User, StickyNote, Bell, Phone,
  Clock, CheckCircle2, AlertTriangle, Pause, ListTodo, Sparkles
} from 'lucide-react'
import type { OperationLog, Customer, BodyPart } from '@/types'

const ACTION_LABELS: Record<string, string> = {
  start: '开始敷麻',
  evaluate: '已评估可操作',
  remove: '已揭麻并清洁',
  pause: '暂停计时',
  resume: '恢复计时',
  complete: '流程完成',
  remind: '已催办',
  notify_doctor: '已通知医生',
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

function formatActionText(log: OperationLog): string {
  const base = ACTION_LABELS[log.action] || log.action
  if (log.bodyPartName && ['start', 'evaluate', 'remove', 'remind', 'notify_doctor'].includes(log.action)) {
    return `${log.bodyPartName} ${base}`
  }
  return base
}

type Tab = 'detail' | 'summary'
type SummaryMode = 'overview' | 'checklist'

export default function DailyRecords() {
  const customers = useClinicStore((s) => s.customers)
  const rooms = useClinicStore((s) => s.rooms)
  const getTodayLogs = useClinicStore((s) => s.getTodayLogs)
  const getTodayCustomers = useClinicStore((s) => s.getTodayCustomers)
  const handedOverIds = useClinicStore((s) => s.handedOverIds)
  const toggleHandover = useClinicStore((s) => s.toggleHandover)
  const resetHandover = useClinicStore((s) => s.resetHandover)
  const settings = useSettingsStore((s) => s.settings)

  const [activeTab, setActiveTab] = useState<Tab>('detail')
  const [summaryMode, setSummaryMode] = useState<SummaryMode>('overview')
  const [filterRoom, setFilterRoom] = useState<string>('')
  const [filterName, setFilterName] = useState<string>('')
  const [filterSpecial, setFilterSpecial] = useState<string>('')

  const todayLogs = getTodayLogs()
  const todayCustomers = getTodayCustomers()

  const filteredCustomers = todayCustomers.filter((c) => {
    if (filterRoom && c.roomId !== filterRoom) return false
    if (filterName) {
      const name = settings.hideFullName ? c.nickname : c.fullName
      if (!name.includes(filterName)) return false
    }
    if (filterSpecial === 'remarks' && !c.remarks) return false
    if (filterSpecial === 'notify') {
      const hasNotify = c.bodyParts.some((bp) => bp.doctorNotifiedAt)
      if (!hasNotify) return false
    }
    if (filterSpecial === 'remind') {
      const totalRemind = c.bodyParts.reduce((s, bp) => s + (bp.remindCount || 0), 0)
      if (totalRemind < 2) return false
    }
    return true
  })

  const roomMap = new Map(rooms.map((r) => [r.id, r]))

  function getCustomerTimeline(c: Customer): OperationLog[] {
    return todayLogs
      .filter((l) => l.customerId === c.id)
      .sort((a, b) => a.timestamp - b.timestamp)
  }

  function handleExportCSV() {
    const header = '顾客,昵称,项目,部位,房间,操作,时间,操作人,角色,备注\n'
    const rows = filteredCustomers
      .flatMap((c) =>
        getCustomerTimeline(c).map((l) => {
          const room = roomMap.get(l.roomId)
          const projectStr = c.projectList.join('; ')
          const remarkForLog = l.action === 'start' ? (c.remarks || '') : ''
          return `${c.fullName},${c.nickname},${projectStr},${l.bodyPartName || ''},${room?.name || ''},${formatActionText(l)},${new Date(l.timestamp).toLocaleString('zh-CN')},${l.operator},${l.operatorRole === 'doctor' ? '医生' : '护士'},${remarkForLog}`
        })
      )
      .join('\n')

    const bom = '\uFEFF'
    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `敷麻记录_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function getStatusText(c: Customer): string {
    if (c.queueStatus === 'completed') return '已完成'
    if (c.queueStatus === 'waiting') return '等待中'
    const isOverdue = c.bodyParts.some((bp) => bp.status !== 'completed' && getBodyPartStatus(bp as BodyPart) === 'overdue')
    const isPausing = c.bodyParts.some((bp) => bp.status === 'pausing')
    if (isOverdue) return '已超时'
    if (isPausing) return '暂停等待'
    return '敷麻中'
  }

  function handleExportHandover() {
    const header = '房间,顾客,昵称,项目,部位,当前状态,催办次数,医生通知时间,备注\n'
    const rows = filteredCustomers
      .filter((c) => c.queueStatus !== 'completed')
      .map((c) => {
        const room = roomMap.get(c.roomId)
        const projectStr = c.projectList.join('; ')
        const partStr = c.bodyParts.map((bp) => bp.name).join('; ')
        const totalRemind = c.bodyParts.reduce((s, bp) => s + (bp.remindCount || 0), 0)
        const notifiedBp = c.bodyParts.find((bp) => bp.doctorNotifiedAt)
        const notifyTime = notifiedBp?.doctorNotifiedAt ? new Date(notifiedBp.doctorNotifiedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''
        const statusText = getStatusText(c)
        return `${room?.name || ''},${c.fullName},${c.nickname},${projectStr},${partStr},${statusText},${totalRemind},${notifyTime},${c.remarks || ''}`
      })
      .join('\n')

    const bom = '\uFEFF'
    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `交班摘要_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const activeCustomers = filteredCustomers.filter((c) => c.queueStatus === 'in_room')
  const completedCustomers = filteredCustomers.filter((c) => c.queueStatus === 'completed')
  const waitingCustomers = filteredCustomers.filter((c) => c.queueStatus === 'waiting')

  const overdueCustomers = activeCustomers.filter((c) =>
    c.bodyParts.some((bp) => bp.status !== 'completed' && getBodyPartStatus(bp as BodyPart) === 'overdue')
  )
  const pausingCustomers = activeCustomers.filter((c) =>
    c.bodyParts.some((bp) => bp.status === 'pausing')
  )
  const notifiedCustomers = activeCustomers.filter((c) =>
    c.bodyParts.some((bp) => bp.doctorNotifiedAt)
  )

  const keyCustomers = filteredCustomers.filter((c) => {
    if (c.queueStatus === 'completed') return false
    const isOverdue = c.bodyParts.some((bp) => bp.status !== 'completed' && getBodyPartStatus(bp as BodyPart) === 'overdue')
    const isPausing = c.bodyParts.some((bp) => bp.status === 'pausing')
    const hasNotified = c.bodyParts.some((bp) => bp.doctorNotifiedAt)
    const hasRemarks = !!c.remarks
    return isOverdue || isPausing || hasNotified || hasRemarks
  })

  const keyHandled = keyCustomers.filter((c) => handedOverIds.includes(c.id)).length

  return (
    <div className="px-4 pt-4 pb-2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold text-brand-text">今日记录</h1>
          <p className="text-xs text-brand-text-muted mt-0.5">
            共 {filteredCustomers.length} 位顾客 · {todayLogs.length} 条操作
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={handleExportCSV}
            disabled={filteredCustomers.length === 0}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-medium transition-all ${
              filteredCustomers.length > 0
                ? 'bg-brand-mint/10 text-brand-mint hover:bg-brand-mint/20'
                : 'bg-brand-card text-brand-text-muted cursor-not-allowed'
            }`}
          >
            <Download size={12} />
            详细CSV
          </button>
          <button
            onClick={handleExportHandover}
            disabled={activeCustomers.length === 0}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-medium transition-all ${
              activeCustomers.length > 0
                ? 'bg-brand-ice/10 text-brand-ice hover:bg-brand-ice/20'
                : 'bg-brand-card text-brand-text-muted cursor-not-allowed'
            }`}
          >
            <FileText size={12} />
            交班版
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 mb-3 p-1 bg-brand-card rounded-xl">
        <button
          onClick={() => setActiveTab('detail')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'detail' ? 'bg-brand-mint/15 text-brand-mint' : 'text-brand-text-dim hover:text-brand-text'
          }`}
        >
          <ListTodo size={13} />
          详细记录
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'summary' ? 'bg-brand-mint/15 text-brand-mint' : 'text-brand-text-dim hover:text-brand-text'
          }`}
        >
          <Sparkles size={13} />
          交班摘要
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <input
            type="text"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="按昵称筛选"
            className="w-full pl-7 pr-3 py-2 rounded-lg bg-brand-card border border-brand-border text-brand-text text-xs placeholder:text-brand-text-muted focus:outline-none focus:border-brand-mint"
          />
        </div>
        <div className="relative">
          <MapPin size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="pl-7 pr-7 py-2 rounded-lg bg-brand-card border border-brand-border text-brand-text text-xs focus:outline-none focus:border-brand-mint appearance-none"
          >
            <option value="">全部房间</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-1.5 mb-3 flex-wrap">
        {[
          { key: '', label: '全部' },
          { key: 'remarks', label: '有备注' },
          { key: 'notify', label: '已通知医生' },
          { key: 'remind', label: '催办≥2次' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterSpecial(f.key)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
              filterSpecial === f.key
                ? 'bg-brand-ice/15 text-brand-ice border border-brand-ice/30'
                : 'bg-brand-card text-brand-text-dim border border-brand-border hover:border-brand-text-muted/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {activeTab === 'summary' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex gap-1.5 p-1 bg-brand-card rounded-xl">
            <button
              onClick={() => setSummaryMode('overview')}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                summaryMode === 'overview' ? 'bg-brand-ice/15 text-brand-ice' : 'text-brand-text-dim hover:text-brand-text'
              }`}
            >
              汇总视图
            </button>
            <button
              onClick={() => setSummaryMode('checklist')}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all relative ${
                summaryMode === 'checklist' ? 'bg-brand-ice/15 text-brand-ice' : 'text-brand-text-dim hover:text-brand-text'
              }`}
            >
              交接清单
              {keyHandled > 0 && keyCustomers.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-brand-mint/20 text-brand-mint text-[9px] font-bold">
                  {keyHandled}/{keyCustomers.length}
                </span>
              )}
            </button>
          </div>

          {summaryMode === 'overview' && (
            <>
              <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-brand-mint/10 border border-brand-mint/25">
              <p className="text-[9px] text-brand-mint mb-0.5">进行中</p>
              <p className="text-2xl font-black text-brand-mint font-timer tabular-nums">{activeCustomers.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-brand-ice/10 border border-brand-ice/25">
              <p className="text-[9px] text-brand-ice mb-0.5">已完成</p>
              <p className="text-2xl font-black text-brand-ice font-timer tabular-nums">{completedCustomers.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-brand-gold/10 border border-brand-gold/25">
              <p className="text-[9px] text-brand-gold mb-0.5">等待中</p>
              <p className="text-2xl font-black text-brand-gold font-timer tabular-nums">{waitingCustomers.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-brand-coral/10 border border-brand-coral/25">
              <p className="text-[9px] text-brand-coral mb-0.5">已超时</p>
              <p className="text-2xl font-black text-brand-coral font-timer tabular-nums">{overdueCustomers.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-brand-text-muted/10 border border-brand-text-muted/25">
              <p className="text-[9px] text-brand-text-dim mb-0.5">暂停等待</p>
              <p className="text-2xl font-black text-brand-text-dim font-timer tabular-nums">{pausingCustomers.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-brand-gold/10 border border-brand-gold/25">
              <p className="text-[9px] text-brand-gold mb-0.5">已叫医生</p>
              <p className="text-2xl font-black text-brand-gold font-timer tabular-nums">{notifiedCustomers.length}</p>
            </div>
          </div>

          {overdueCustomers.length > 0 && (
            <div className="p-2.5 rounded-xl bg-brand-coral/8 border border-brand-coral/30">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle size={12} className="text-brand-coral" />
                <span className="text-xs font-bold text-brand-coral">超时未处理 ({overdueCustomers.length})</span>
              </div>
              <div className="space-y-1.5">
                {overdueCustomers.map((c) => {
                  const room = roomMap.get(c.roomId)
                  const displayName = settings.hideFullName ? c.nickname : c.fullName
                  const overdueParts = c.bodyParts.filter((bp) => bp.status !== 'completed' && getBodyPartStatus(bp as BodyPart) === 'overdue')
                  return (
                    <div key={c.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-brand-text font-medium truncate">
                        {room?.name} · {displayName}
                      </span>
                      <span className="text-brand-coral font-medium shrink-0 ml-2">
                        {overdueParts.length}部位超时
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {notifiedCustomers.length > 0 && (
            <div className="p-2.5 rounded-xl bg-brand-gold/8 border border-brand-gold/30">
              <div className="flex items-center gap-1.5 mb-2">
                <Phone size={12} className="text-brand-gold" />
                <span className="text-xs font-bold text-brand-gold">已通知医生 ({notifiedCustomers.length})</span>
              </div>
              <div className="space-y-1.5">
                {notifiedCustomers.map((c) => {
                  const room = roomMap.get(c.roomId)
                  const displayName = settings.hideFullName ? c.nickname : c.fullName
                  const notifiedBp = c.bodyParts.find((bp) => bp.doctorNotifiedAt)
                  return (
                    <div key={c.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-brand-text font-medium truncate">
                        {room?.name} · {displayName}
                      </span>
                      <span className="text-brand-gold font-timer shrink-0 ml-2">
                        {notifiedBp?.doctorNotifiedAt ? formatTime(notifiedBp.doctorNotifiedAt) : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {pausingCustomers.length > 0 && (
            <div className="p-2.5 rounded-xl bg-brand-text-muted/8 border border-brand-text-muted/30">
              <div className="flex items-center gap-1.5 mb-2">
                <Pause size={12} className="text-brand-text-dim" />
                <span className="text-xs font-bold text-brand-text-dim">暂停等待 ({pausingCustomers.length})</span>
              </div>
              <div className="space-y-1.5">
                {pausingCustomers.map((c) => {
                  const room = roomMap.get(c.roomId)
                  const displayName = settings.hideFullName ? c.nickname : c.fullName
                  return (
                    <div key={c.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-brand-text font-medium truncate">
                        {room?.name} · {displayName}
                      </span>
                      <span className="text-brand-text-dim shrink-0 ml-2">
                        顾客暂离
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeCustomers.length > 0 && (
            <div className="p-2.5 rounded-xl bg-brand-card border border-brand-border">
              <div className="flex items-center gap-1.5 mb-2">
                <Clock size={12} className="text-brand-mint" />
                <span className="text-xs font-bold text-brand-text">进行中房间一览 ({activeCustomers.length})</span>
              </div>
              <div className="space-y-2">
                {activeCustomers
                  .sort((a, b) => {
                    const aOverdue = a.bodyParts.some((bp) => bp.status !== 'completed' && getBodyPartStatus(bp as BodyPart) === 'overdue')
                    const bOverdue = b.bodyParts.some((bp) => bp.status !== 'completed' && getBodyPartStatus(bp as BodyPart) === 'overdue')
                    if (aOverdue && !bOverdue) return -1
                    if (!aOverdue && bOverdue) return 1
                    return 0
                  })
                  .map((c) => {
                    const room = roomMap.get(c.roomId)
                    const displayName = settings.hideFullName ? c.nickname : c.fullName
                    const minRem = Math.min(...c.bodyParts.filter((bp) => bp.status !== 'completed').map((bp) => getBodyPartRemaining(bp as BodyPart)))
                    const status = minRem <= 0 ? 'overdue' : 'active'
                    const isPausing = c.bodyParts.some((bp) => bp.status === 'pausing')
                    return (
                      <div key={c.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold text-brand-mint bg-brand-mint/10 px-1.5 py-0.5 rounded shrink-0">
                            {room?.name}
                          </span>
                          <span className="text-[11px] text-brand-text font-medium truncate">{displayName}</span>
                          {c.remarks && <StickyNote size={10} className="text-brand-gold shrink-0" />}
                        </div>
                        <span className={`font-timer text-[11px] font-bold tabular-nums shrink-0 ml-2 ${
                          isPausing ? 'text-brand-text-dim' :
                          status === 'overdue' ? 'text-brand-coral' : 'text-brand-mint'
                        }`}>
                          {isPausing ? '暂停' : minRem <= 0 ? '超时' : `${Math.floor(minRem/60000)}分`}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {completedCustomers.length > 0 && (
            <div className="p-2.5 rounded-xl bg-brand-card/60 border border-brand-border/60">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 size={12} className="text-brand-text-dim" />
                <span className="text-xs font-bold text-brand-text-dim">今日已完成 ({completedCustomers.length})</span>
              </div>
              <div className="space-y-1">
                {completedCustomers.map((c) => {
                  const room = roomMap.get(c.roomId)
                  const displayName = settings.hideFullName ? c.nickname : c.fullName
                  return (
                    <div key={c.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-brand-text-muted truncate">
                        {room?.name} · {displayName}
                      </span>
                      <CheckCircle2 size={11} className="text-brand-mint/60 shrink-0 ml-2" />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
            </>
          )}

          {summaryMode === 'checklist' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-brand-text-dim">
                  重点交接项共 {keyCustomers.length} 条，已交代 {keyHandled} 条
                </p>
                <button
                  onClick={resetHandover}
                  className="px-2 py-1 rounded-lg text-[10px] bg-brand-card text-brand-text-muted border border-brand-border hover:border-brand-text-muted/50 transition-all"
                >
                  重置交接
                </button>
              </div>

              {keyCustomers.length === 0 && (
                <div className="text-center py-8 text-brand-text-muted">
                  <CheckCircle2 size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">暂无重点交接项</p>
                </div>
              )}

              {keyCustomers.map((c) => {
                const room = roomMap.get(c.roomId)
                const displayName = settings.hideFullName ? c.nickname : c.fullName
                const isOverdue = c.bodyParts.some((bp) => bp.status !== 'completed' && getBodyPartStatus(bp as BodyPart) === 'overdue')
                const isPausing = c.bodyParts.some((bp) => bp.status === 'pausing')
                const hasNotified = c.bodyParts.some((bp) => bp.doctorNotifiedAt)
                const totalRemind = c.bodyParts.reduce((s, bp) => s + (bp.remindCount || 0), 0)
                const isHanded = handedOverIds.includes(c.id)
                const tags: { label: string; color: string }[] = []
                if (isOverdue) tags.push({ label: '超时', color: 'text-brand-coral bg-brand-coral/10' })
                if (isPausing) tags.push({ label: '暂停', color: 'text-brand-text-dim bg-brand-text-muted/20' })
                if (hasNotified) tags.push({ label: '已叫医生', color: 'text-brand-gold bg-brand-gold/10' })
                if (totalRemind > 0) tags.push({ label: `催办${totalRemind}次`, color: 'text-brand-gold bg-brand-gold/10' })
                if (c.remarks) tags.push({ label: '有备注', color: 'text-brand-ice bg-brand-ice/10' })

                return (
                  <div
                    key={c.id}
                    onClick={() => toggleHandover(c.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isHanded
                        ? 'bg-brand-mint/5 border-brand-mint/30 opacity-70'
                        : 'bg-brand-card border-brand-border hover:border-brand-ice/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                        isHanded ? 'bg-brand-mint border-brand-mint' : 'border-brand-text-muted/50'
                      }`}>
                        {isHanded && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold text-brand-mint bg-brand-mint/10 px-1.5 py-0.5 rounded shrink-0">
                            {room?.name}
                          </span>
                          <span className="text-sm font-medium text-brand-text truncate">{displayName}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {tags.map((t, i) => (
                            <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded ${t.color}`}>
                              {t.label}
                            </span>
                          ))}
                        </div>
                        {c.remarks && (
                          <p className="text-[10px] text-brand-gold bg-brand-gold/5 px-2 py-1 rounded line-clamp-2">
                            📝 {c.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'detail' && filteredCustomers.length === 0 && (
        <div className="text-center py-16 text-brand-text-muted">
          <FileText size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">今日暂无记录</p>
        </div>
      )}

      {activeTab === 'detail' && filteredCustomers.length > 0 && (
        <div className="flex flex-col gap-3.5">
          {filteredCustomers.map((c) => {
            const timeline = getCustomerTimeline(c)
            const room = roomMap.get(c.roomId)
            const displayName = settings.hideFullName ? c.nickname : c.fullName
            const partsList = c.bodyParts.map((bp) => bp.name).join('、')
            const isActive = c.queueStatus === 'in_room'
            const totalRemind = c.bodyParts.reduce((s, bp) => s + (bp.remindCount || 0), 0)
            const hasRemind = totalRemind > 0
            const hasNotify = c.bodyParts.some((bp) => bp.doctorNotifiedAt)

            return (
              <div key={c.id} className="rounded-xl border border-brand-border bg-brand-card p-3.5 animate-fade-in">
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-brand-mint/20' : 'bg-brand-text-muted/20'}`}>
                      <User size={13} className={isActive ? 'text-brand-mint' : 'text-brand-text-muted'} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-brand-text flex items-center gap-1.5">
                        {displayName}
                        {hasRemind && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-brand-gold/15 text-brand-gold">
                            <Bell size={9} />
                            {totalRemind}次催
                          </span>
                        )}
                        {hasNotify && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-brand-coral/15 text-brand-coral">
                            <Phone size={9} />
                            已通知
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-brand-text-dim leading-tight">
                        <span>{partsList || '未选部位'}</span>
                        <span className="mx-1">·</span>
                        <span>{room?.name || '-'}</span>
                      </div>
                      {c.projectList.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {c.projectList.map((p, i) => (
                            <span key={i} className="text-[9px] text-brand-ice bg-brand-ice/10 px-1.5 py-0.5 rounded">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    isActive ? 'text-brand-mint bg-brand-mint/10' :
                    c.queueStatus === 'completed' ? 'text-brand-text-muted bg-brand-bg/50' :
                    'text-brand-gold bg-brand-gold/10'
                  }`}>
                    {isActive ? '进行中' : c.queueStatus === 'completed' ? '已完成' : '等待中'}
                  </span>
                </div>

                {c.remarks && (
                  <div className="p-2 rounded-lg bg-brand-gold/8 border border-brand-gold/20 mb-2.5">
                    <div className="flex items-start gap-1.5">
                      <StickyNote size={11} className="text-brand-gold shrink-0 mt-0.5" />
                      <p className="text-[11px] text-brand-text leading-snug flex-1">{c.remarks}</p>
                    </div>
                  </div>
                )}

                {timeline.length > 0 && (
                  <div className="relative pl-4.5 border-l-2 border-brand-border/50 ml-0.5">
                    {timeline.map((log) => {
                      const actionColor = ACTION_COLORS[log.action] || 'bg-brand-border'
                      const text = formatActionText(log)
                      return (
                        <div key={log.id} className="relative mb-1.5 last:mb-0">
                          <div className={`absolute left-[-19px] top-0.5 w-2.5 h-2.5 rounded-full border-2 border-brand-card ${actionColor}`} />
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="font-timer text-brand-text-dim tabular-nums w-10 shrink-0">{formatTime(log.timestamp)}</span>
                            <span className="text-brand-text font-medium">{text}</span>
                            <span className="text-brand-text-muted">
                              {log.operator}({log.operatorRole === 'doctor' ? '医' : '护'})
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
