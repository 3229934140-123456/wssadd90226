import { useState } from 'react'
import { useClinicStore } from '@/stores/useClinicStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { formatTime } from '@/utils/time'
import { FileText, Download, MapPin, User, StickyNote, Bell, Phone } from 'lucide-react'
import type { OperationLog, Customer } from '@/types'

const ACTION_LABELS: Record<string, string> = {
  start: '\u5F00\u59CB\u6577\u9EBB',
  evaluate: '\u5DF2\u8BC4\u4F30\u53EF\u64CD\u4F5C',
  remove: '\u5DF2\u63ED\u9EBB\u5E76\u6E05\u6D01',
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

function formatActionText(log: OperationLog): string {
  const base = ACTION_LABELS[log.action] || log.action
  if (log.bodyPartName && ['start', 'evaluate', 'remove', 'remind', 'notify_doctor'].includes(log.action)) {
    return `${log.bodyPartName} ${base}`
  }
  return base
}

export default function DailyRecords() {
  const customers = useClinicStore((s) => s.customers)
  const rooms = useClinicStore((s) => s.rooms)
  const getTodayLogs = useClinicStore((s) => s.getTodayLogs)
  const getTodayCustomers = useClinicStore((s) => s.getTodayCustomers)
  const settings = useSettingsStore((s) => s.settings)

  const [filterRoom, setFilterRoom] = useState<string>('')
  const [filterName, setFilterName] = useState<string>('')

  const todayLogs = getTodayLogs()
  const todayCustomers = getTodayCustomers()

  const filteredCustomers = todayCustomers.filter((c) => {
    if (filterRoom && c.roomId !== filterRoom) return false
    if (filterName) {
      const name = settings.hideFullName ? c.nickname : c.fullName
      if (!name.includes(filterName)) return false
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
    const header = '\u987E\u5BA2,\u6635\u79F0,\u9879\u76EE,\u90E8\u4F4D,\u623F\u95F4,\u64CD\u4F5C,\u65F6\u95F4,\u64CD\u4F5C\u4EBA,\u89D2\u8272,\u5907\u6CE8\n'
    const rows = filteredCustomers
      .flatMap((c) =>
        getCustomerTimeline(c).map((l) => {
          const room = roomMap.get(l.roomId)
          const remarkForLog = l.action === 'start' ? (c.remarks || '') : ''
          return `${c.fullName},${c.nickname},${c.project},${l.bodyPartName || ''},${room?.name || ''},${formatActionText(l)},${new Date(l.timestamp).toLocaleString('zh-CN')},${l.operator},${l.operatorRole === 'doctor' ? '\u533B\u751F' : '\u62A4\u58EB'},${remarkForLog}`
        })
      )
      .join('\n')

    const bom = '\uFEFF'
    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `\u6577\u9EBB\u8BB0\u5F55_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="px-4 pt-4 pb-2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold text-brand-text">{'\u4ECA\u65E5\u8BB0\u5F55'}</h1>
          <p className="text-xs text-brand-text-muted mt-0.5">
            {'\u5171'} {filteredCustomers.length} {'\u4F4D\u987E\u5BA2'} \u00B7 {todayLogs.length} {'\u6761\u64CD\u4F5C'}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filteredCustomers.length === 0}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            filteredCustomers.length > 0
              ? 'bg-brand-mint/10 text-brand-mint hover:bg-brand-mint/20'
              : 'bg-brand-card text-brand-text-muted cursor-not-allowed'
          }`}
        >
          <Download size={13} />
          {'\u5BFC\u51FACSV'}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <input
            type="text"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder={'\u6309\u6635\u79F0\u7B5B\u9009'}
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
            <option value="">{'\u5168\u90E8\u623F\u95F4'}</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="text-center py-16 text-brand-text-muted">
          <FileText size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{'\u4ECA\u65E5\u6682\u65E0\u8BB0\u5F55'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {filteredCustomers.map((c) => {
            const timeline = getCustomerTimeline(c)
            const room = roomMap.get(c.roomId)
            const displayName = settings.hideFullName ? c.nickname : c.fullName
            const partsList = c.bodyParts.map((bp) => bp.name).join('\u3001')
            const isActive = c.queueStatus === 'in_room'
            const hasRemind = timeline.some((l) => l.action === 'remind')
            const hasNotify = timeline.some((l) => l.action === 'notify_doctor')

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
                            {timeline.filter((l) => l.action === 'remind').length}{'\u6B21\u50AC'}
                          </span>
                        )}
                        {hasNotify && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-brand-coral/15 text-brand-coral">
                            <Phone size={9} />
                            {'\u5DF2\u901A\u77E5'}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-brand-text-dim leading-tight">
                        {c.project} \u00B7 {partsList || '\u672A\u9009\u90E8\u4F4D'} \u00B7 {room?.name || '-'}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    isActive ? 'text-brand-mint bg-brand-mint/10' :
                    c.queueStatus === 'completed' ? 'text-brand-text-muted bg-brand-bg/50' :
                    'text-brand-gold bg-brand-gold/10'
                  }`}>
                    {isActive ? '\u8FDB\u884C\u4E2D' : c.queueStatus === 'completed' ? '\u5DF2\u5B8C\u6210' : '\u7B49\u5F85\u4E2D'}
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
                              {log.operator}({log.operatorRole === 'doctor' ? '\u533B' : '\u62A4'})
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
