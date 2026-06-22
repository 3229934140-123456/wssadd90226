import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClinicStore } from '@/stores/useClinicStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { BODY_PART_OPTIONS, DEFAULT_DURATIONS } from '@/types'
import { ScanLine, User, Plus, X, Check, ChevronDown } from 'lucide-react'

export default function ScanToStart() {
  const navigate = useNavigate()
  const customers = useClinicStore((s) => s.customers)
  const rooms = useClinicStore((s) => s.rooms)
  const addCustomer = useClinicStore((s) => s.addCustomer)
  const assignCustomerToRoom = useClinicStore((s) => s.assignCustomerToRoom)
  const settings = useSettingsStore((s) => s.settings)

  const [step, setStep] = useState<'scan' | 'manual'>('scan')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [selectedParts, setSelectedParts] = useState<string[]>([])
  const [manualName, setManualName] = useState('')
  const [manualNickname, setManualNickname] = useState('')
  const [manualProject, setManualProject] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const waitingCustomers = customers.filter((c) => c.queueStatus === 'waiting')
  const idleRooms = rooms.filter((r) => r.status === 'idle')
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)

  const displayName = settings.hideFullName
    ? (selectedCustomer?.nickname || manualNickname)
    : (selectedCustomer?.fullName || manualName)

  const canStart = (selectedCustomerId || (manualName && manualNickname && manualProject))
    && selectedRoomId
    && selectedParts.length > 0

  function handleStart() {
    let customerId = selectedCustomerId
    if (!customerId && manualName) {
      const c = addCustomer({
        fullName: manualName,
        nickname: manualNickname,
        project: manualProject,
        bodyParts: [],
        roomId: '',
      })
      customerId = c.id
    }
    if (!customerId) return

    const bodyParts = selectedParts.map((name) => ({
      name,
      startTime: 0,
      duration: settings.defaultDurations[name] || DEFAULT_DURATIONS[name] || 25,
    }))

    assignCustomerToRoom(customerId, selectedRoomId, bodyParts)
    setShowSuccess(true)
    setTimeout(() => {
      navigate(`/confirm/${selectedRoomId}`)
    }, 1500)
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-brand-mint/20 flex items-center justify-center mb-4">
          <Check size={40} className="text-brand-mint" />
        </div>
        <h2 className="text-xl font-bold text-brand-text mb-1">{'\u6577\u9EBB\u8BA1\u65F6\u5DF2\u5F00\u59CB'}</h2>
        <p className="text-sm text-brand-text-dim">{displayName} \u00B7 {selectedParts.join('\u3001')}</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-bold text-brand-text mb-1">{'\u626B\u7801\u5F00\u9EBB'}</h1>
      <p className="text-xs text-brand-text-muted mb-4">{'\u626B\u63CF\u6CBB\u7597\u5355\u4E8C\u7EF4\u7801\u6216\u624B\u52A8\u8F93\u5165\u987E\u5BA2\u4FE1\u606F'}</p>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setStep('scan')}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            step === 'scan' ? 'bg-brand-mint/15 text-brand-mint border border-brand-mint/30' : 'bg-brand-card text-brand-text-dim border border-brand-border'
          }`}
        >
          <ScanLine size={18} />
          {'\u626B\u7801\u5F55\u5165'}
        </button>
        <button
          onClick={() => setStep('manual')}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            step === 'manual' ? 'bg-brand-mint/15 text-brand-mint border border-brand-mint/30' : 'bg-brand-card text-brand-text-dim border border-brand-border'
          }`}
        >
          <Plus size={18} />
          {'\u624B\u52A8\u5F55\u5165'}
        </button>
      </div>

      {step === 'scan' && (
        <div className="mb-5">
          <div className="relative w-48 h-48 mx-auto mb-4">
            <div className="absolute inset-0 border-2 border-brand-mint/40 rounded-2xl flex items-center justify-center bg-brand-card/50">
              <ScanLine size={48} className="text-brand-mint/30" />
            </div>
            <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-brand-mint rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-brand-mint rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-brand-mint rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-brand-mint rounded-br-xl" />
          </div>
          <p className="text-center text-xs text-brand-text-muted mb-4">{'\u5C06\u6CBB\u7597\u5355\u4E8C\u7EF4\u7801\u5BF9\u51C6\u626B\u63CF\u6846'}</p>

          {waitingCustomers.length > 0 && (
            <div>
              <p className="text-xs text-brand-text-dim mb-2">{'\u6216\u9009\u62E9\u5DF2\u767B\u8BB0\u987E\u5BA2'}</p>
              <div className="flex flex-col gap-2">
                {waitingCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selectedCustomerId === c.id
                        ? 'border-brand-mint bg-brand-mint/10'
                        : 'border-brand-border bg-brand-card hover:border-brand-mint/30'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-mint/15 flex items-center justify-center">
                      <User size={14} className="text-brand-mint" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-brand-text">
                        {settings.hideFullName ? c.nickname : c.fullName}
                      </div>
                      <div className="text-xs text-brand-text-dim">{c.project}</div>
                    </div>
                    {selectedCustomerId === c.id && (
                      <Check size={16} className="text-brand-mint ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'manual' && (
        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs text-brand-text-dim mb-1 block">{'\u59D3\u540D'}</label>
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder={'\u8F93\u5165\u987E\u5BA2\u59D3\u540D'}
              className="w-full px-3 py-2.5 rounded-lg bg-brand-card border border-brand-border text-brand-text text-sm placeholder:text-brand-text-muted focus:outline-none focus:border-brand-mint"
            />
          </div>
          <div>
            <label className="text-xs text-brand-text-dim mb-1 block">{'\u6635\u79F0'}</label>
            <input
              type="text"
              value={manualNickname}
              onChange={(e) => setManualNickname(e.target.value)}
              placeholder={'\u8F93\u5165\u6635\u79F0'}
              className="w-full px-3 py-2.5 rounded-lg bg-brand-card border border-brand-border text-brand-text text-sm placeholder:text-brand-text-muted focus:outline-none focus:border-brand-mint"
            />
          </div>
          <div>
            <label className="text-xs text-brand-text-dim mb-1 block">{'\u9879\u76EE'}</label>
            <div className="relative">
              <select
                value={manualProject}
                onChange={(e) => setManualProject(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-brand-card border border-brand-border text-brand-text text-sm focus:outline-none focus:border-brand-mint appearance-none"
              >
                <option value="">{'\u9009\u62E9\u9879\u76EE'}</option>
                <option value="\u70ED\u739B\u5409">{'\u70ED\u739B\u5409'}</option>
                <option value="\u5149\u7535\u5AE9\u80A4">{'\u5149\u7535\u5AE9\u80A4'}</option>
                <option value="\u76AE\u79D2\u6FC0\u5149">{'\u76AE\u79D2\u6FC0\u5149'}</option>
                <option value="\u6C34\u5149\u9488">{'\u6C34\u5149\u9488'}</option>
                <option value="\u5176\u4ED6">{'\u5176\u4ED6'}</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      <div className="mb-5">
        <label className="text-xs text-brand-text-dim mb-2 block">{'\u9009\u62E9\u623F\u95F4'}</label>
        <div className="grid grid-cols-3 gap-2">
          {rooms.map((room) => {
            const isIdle = room.status === 'idle'
            const isSelected = selectedRoomId === room.id
            return (
              <button
                key={room.id}
                onClick={() => isIdle && setSelectedRoomId(room.id)}
                disabled={!isIdle}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-brand-mint/15 text-brand-mint border border-brand-mint/30'
                    : isIdle
                    ? 'bg-brand-card text-brand-text-dim border border-brand-border hover:border-brand-mint/30'
                    : 'bg-brand-card/50 text-brand-text-muted border border-brand-border/50 cursor-not-allowed opacity-50'
                }`}
              >
                {room.name}
                {!isIdle && <span className="block text-[10px] text-brand-text-muted">{'\u4F7F\u7528\u4E2D'}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-xs text-brand-text-dim mb-2 block">{'\u6577\u9EBB\u90E8\u4F4D'}</label>
        <div className="flex flex-wrap gap-2">
          {BODY_PART_OPTIONS.map((part) => {
            const isSelected = selectedParts.includes(part)
            return (
              <button
                key={part}
                onClick={() => {
                  setSelectedParts((prev) =>
                    isSelected ? prev.filter((p) => p !== part) : [...prev, part]
                  )
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-brand-mint text-brand-bg border border-brand-mint'
                    : 'bg-brand-card text-brand-text-dim border border-brand-border hover:border-brand-mint/30'
                }`}
              >
                {isSelected && <X size={12} className="inline mr-1.5 -mt-0.5" />}
                {part}
                {isSelected && (
                  <span className="ml-1.5 text-[10px] opacity-70">
                    {settings.defaultDurations[part] || DEFAULT_DURATIONS[part] || 25}{'\u5206\u949F'}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={!canStart}
        className={`w-full py-4 rounded-xl text-base font-bold transition-all ${
          canStart
            ? 'bg-brand-mint text-brand-bg hover:bg-brand-mint-dark active:scale-[0.98]'
            : 'bg-brand-card text-brand-text-muted cursor-not-allowed'
        }`}
      >
        {'\u5F00\u59CB\u8BA1\u65F6'}
      </button>

      {!canStart && (
        <p className="text-center text-xs text-brand-text-muted mt-2">
          {!selectedCustomerId && !manualName ? '\u8BF7\u9009\u62E9\u6216\u8F93\u5165\u987E\u5BA2' :
          !selectedRoomId ? '\u8BF7\u9009\u62E9\u623F\u95F4' :
          !selectedParts.length ? '\u8BF7\u9009\u62E9\u6577\u9EBB\u90E8\u4F4D' : ''}
        </p>
      )}
    </div>
  )
}
