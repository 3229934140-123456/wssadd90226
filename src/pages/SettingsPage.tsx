import { useSettingsStore } from '@/stores/useSettingsStore'
import { DEFAULT_DURATIONS, BODY_PART_OPTIONS } from '@/types'
import { Volume2, Eye, Moon, Clock, RotateCcw, Save } from 'lucide-react'
import { useState } from 'react'

export default function SettingsPage() {
  const {
    settings,
    setBellVolume,
    setHideFullName,
    setNightModeStart,
    setNightModeEnd,
    setDefaultDurations,
  } = useSettingsStore()

  const [durations, setDurations] = useState(settings.defaultDurations)
  const [saved, setSaved] = useState(false)

  function handleSaveDurations() {
    setDefaultDurations(durations)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    setDurations({ ...DEFAULT_DURATIONS })
    setDefaultDurations({ ...DEFAULT_DURATIONS })
  }

  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-bold text-brand-text mb-1">{'\u95E8\u5E97\u8BBE\u7F6E'}</h1>
      <p className="text-xs text-brand-text-muted mb-5">{'\u8C03\u6574\u63D0\u9192\u65B9\u5F0F\u3001\u9690\u79C1\u4FDD\u62A4\u548C\u9ED8\u8BA4\u65F6\u957F'}</p>

      <div className="space-y-4">
        <div className="rounded-xl border border-brand-border bg-brand-card p-4">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand-mint/15 flex items-center justify-center">
              <Volume2 size={16} className="text-brand-mint" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-brand-text">{'\u94C3\u58F0\u97F3\u91CF'}</h3>
              <p className="text-[10px] text-brand-text-muted">{'\u63A7\u5236\u5230\u70B9\u63D0\u9192\u94C3\u58F0\u97F3\u91CF'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-brand-text-muted w-6">0</span>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.bellVolume}
              onChange={(e) => setBellVolume(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-brand-text-muted w-8 text-right">{settings.bellVolume}</span>
          </div>
          {settings.bellVolume === 0 && (
            <p className="text-[10px] text-brand-gold mt-2">{'\u94C3\u58F0\u5DF2\u9759\u97F3\uFF0C\u4EC5\u4F9D\u9760\u5C4F\u5E55\u95EA\u70C1\u63D0\u9192'}</p>
          )}
        </div>

        <div className="rounded-xl border border-brand-border bg-brand-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-ice/15 flex items-center justify-center">
                <Eye size={16} className="text-brand-ice" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-brand-text">{'\u9690\u79C1\u4FDD\u62A4'}</h3>
                <p className="text-[10px] text-brand-text-muted">{'\u9690\u85CF\u987E\u5BA2\u5168\u540D\uFF0C\u4EC5\u663E\u793A\u6635\u79F0'}</p>
              </div>
            </div>
            <button
              onClick={() => setHideFullName(!settings.hideFullName)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.hideFullName ? 'bg-brand-mint' : 'bg-brand-border'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                  settings.hideFullName ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>
          <div className="mt-3 p-2 rounded-lg bg-brand-bg/50 text-xs text-brand-text-dim">
            {settings.hideFullName ? (
              <span className="text-brand-mint">{'\u2705 \u5DF2\u5F00\u542F\uFF1A\u663E\u793A\u4E3A\u201C\u7F8E\u7F8E\u201D\u800C\u975E\u201C\u5F20\u7F8E\u7F8E\u201D'}</span>
            ) : (
              <span className="text-brand-text-muted">{'\u672A\u5F00\u542F\uFF1A\u5C06\u663E\u793A\u5B8C\u6574\u59D3\u540D'}</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-brand-border bg-brand-card p-4">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand-gold/15 flex items-center justify-center">
              <Moon size={16} className="text-brand-gold" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-brand-text">{'\u591C\u95F4\u9759\u97F3'}</h3>
              <p className="text-[10px] text-brand-text-muted">{'\u9759\u97F3\u65F6\u6BB5\u4EC5\u95EA\u70C1\u63D0\u9192\uFF0C\u4E0D\u54CD\u94C3'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-brand-text-muted mb-1 block">{'\u5F00\u59CB\u65F6\u95F4'}</label>
              <input
                type="time"
                value={settings.nightModeStart}
                onChange={(e) => setNightModeStart(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-brand-bg border border-brand-border text-brand-text text-sm focus:outline-none focus:border-brand-mint"
              />
            </div>
            <span className="text-brand-text-muted mt-4">-</span>
            <div className="flex-1">
              <label className="text-[10px] text-brand-text-muted mb-1 block">{'\u7ED3\u675F\u65F6\u95F4'}</label>
              <input
                type="time"
                value={settings.nightModeEnd}
                onChange={(e) => setNightModeEnd(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-brand-bg border border-brand-border text-brand-text text-sm focus:outline-none focus:border-brand-mint"
              />
            </div>
          </div>
          <p className="text-[10px] text-brand-text-muted mt-2">
            {'\u5F53\u524D\u72B6\u6001'}: {useSettingsStore.getState().isNightMode() ? '\uD83C\uDF19 \u9759\u97F3\u4E2D' : '\uD83D\uDD14 \u6B63\u5E38\u54CD\u94C3'}
          </p>
        </div>

        <div className="rounded-xl border border-brand-border bg-brand-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-coral/15 flex items-center justify-center">
                <Clock size={16} className="text-brand-coral" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-brand-text">{'\u9ED8\u8BA4\u9879\u76EE\u65F6\u957F'}</h3>
                <p className="text-[10px] text-brand-text-muted">{'\u5404\u90E8\u4F4D\u9ED8\u8BA4\u6577\u9EBB\u65F6\u957F(\u5206\u949F)'}</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-bg text-brand-text-dim text-xs hover:text-brand-text transition-colors"
            >
              <RotateCcw size={12} />
              {'\u91CD\u7F6E'}
            </button>
          </div>
          <div className="space-y-2.5">
            {BODY_PART_OPTIONS.map((part) => (
              <div key={part} className="flex items-center gap-3">
                <span className="text-xs text-brand-text-dim w-12">{part}</span>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="range"
                    min={10}
                    max={60}
                    step={5}
                    value={durations[part] || DEFAULT_DURATIONS[part] || 25}
                    onChange={(e) =>
                      setDurations((prev) => ({ ...prev, [part]: Number(e.target.value) }))
                    }
                    className="flex-1"
                  />
                  <span className="font-timer text-sm font-medium text-brand-text w-10 text-right tabular-nums">
                    {durations[part] || DEFAULT_DURATIONS[part] || 25}'
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleSaveDurations}
            className={`w-full mt-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              saved
                ? 'bg-brand-mint/20 text-brand-mint'
                : 'bg-brand-mint/10 text-brand-mint hover:bg-brand-mint/20'
            }`}
          >
            <Save size={14} />
            {saved ? '\u2705 \u5DF2\u4FDD\u5B58' : '\u4FDD\u5B58\u8BBE\u7F6E'}
          </button>
        </div>
      </div>

      <div className="text-center py-6 text-brand-text-muted text-[10px]">
        {'\u6577\u9EBB\u8BA1\u65F6\u5668 v1.0 \u00B7 \u8F7B\u533B\u7F8E\u95E8\u5E97\u4E13\u7528'}
      </div>
    </div>
  )
}
