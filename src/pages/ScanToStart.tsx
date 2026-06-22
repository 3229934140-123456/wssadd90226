import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClinicStore } from '@/stores/useClinicStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { BODY_PART_OPTIONS, DEFAULT_DURATIONS } from '@/types'
import { parseQRCode, type QRCodeData } from '@/utils/qrCode'
import { useQRScanner } from '@/hooks/useQRScanner'
import { ScanLine, User, Plus, X, Check, ChevronDown, ClipboardPaste, Camera } from 'lucide-react'

const QR_SCANNER_ID = 'qr-scanner-container'

export default function ScanToStart() {
  const navigate = useNavigate()
  const customers = useClinicStore((s) => s.customers)
  const rooms = useClinicStore((s) => s.rooms)
  const addCustomer = useClinicStore((s) => s.addCustomer)
  const assignCustomerToRoom = useClinicStore((s) => s.assignCustomerToRoom)
  const settings = useSettingsStore((s) => s.settings)

  const [inputMode, setInputMode] = useState<'scan' | 'paste' | 'manual'>('scan')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [selectedParts, setSelectedParts] = useState<string[]>([])
  const [manualName, setManualName] = useState('')
  const [manualNickname, setManualNickname] = useState('')
  const [manualProject, setManualProject] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [parseError, setParseError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [qrParsed, setQrParsed] = useState(false)

  const handleQRResult = useCallback((text: string) => {
    const data = parseQRCode(text)
    if (data) {
      setManualName(data.fullName)
      setManualNickname(data.nickname || data.fullName.slice(0, 2))
      setManualProject(data.project)
      if (data.bodyParts.length > 0) {
        setSelectedParts(data.bodyParts.filter((p) => BODY_PART_OPTIONS.includes(p)))
      }
      setQrParsed(true)
      setParseError('')
    } else {
      setParseError('\u65E0\u6CD5\u8BC6\u522B\u4E8C\u7EF4\u7801\u5185\u5BB9\uFF0C\u8BF7\u624B\u52A8\u586B\u5199')
    }
  }, [])

  const { isScanning, startScan, stopScan, error: scanError } = useQRScanner(handleQRResult, QR_SCANNER_ID)

  const waitingCustomers = customers.filter((c) => c.queueStatus === 'waiting')

  const effectiveName = selectedCustomerId
    ? (settings.hideFullName
        ? customers.find((c) => c.id === selectedCustomerId)?.nickname || ''
        : customers.find((c) => c.id === selectedCustomerId)?.fullName || '')
    : (settings.hideFullName ? manualNickname : manualName)

  const canStart = (selectedCustomerId || (manualName && manualNickname && manualProject))
    && selectedRoomId
    && selectedParts.length > 0

  function handlePaste() {
    if (!pasteText.trim()) return
    handleQRResult(pasteText.trim())
  }

  function handleStart() {
    let customerId = selectedCustomerId
    if (!customerId && manualName) {
      const c = addCustomer({
        fullName: manualName,
        nickname: manualNickname || manualName.slice(0, 2),
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
        <p className="text-sm text-brand-text-dim">{effectiveName} \u00B7 {selectedParts.join('\u3001')}</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-bold text-brand-text mb-1">{'\u626B\u7801\u5F00\u9EBB'}</h1>
      <p className="text-xs text-brand-text-muted mb-4">{'\u626B\u63CF\u6CBB\u7597\u5355\u4E8C\u7EF4\u7801\u3001\u7C98\u8D34\u6587\u672C\u6216\u624B\u52A8\u8F93\u5165\u987E\u5BA2\u4FE1\u606F'}</p>

      <div className="flex gap-1.5 mb-5">
        <button
          onClick={() => { setInputMode('scan'); stopScan() }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
            inputMode === 'scan' ? 'bg-brand-mint/15 text-brand-mint border border-brand-mint/30' : 'bg-brand-card text-brand-text-dim border border-brand-border'
          }`}
        >
          <Camera size={15} />
          {'\u6444\u50CF\u5934\u626B\u7801'}
        </button>
        <button
          onClick={() => { setInputMode('paste'); stopScan() }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
            inputMode === 'paste' ? 'bg-brand-mint/15 text-brand-mint border border-brand-mint/30' : 'bg-brand-card text-brand-text-dim border border-brand-border'
          }`}
        >
          <ClipboardPaste size={15} />
          {'\u7C98\u8D34\u6587\u672C'}
        </button>
        <button
          onClick={() => { setInputMode('manual'); stopScan() }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
            inputMode === 'manual' ? 'bg-brand-mint/15 text-brand-mint border border-brand-mint/30' : 'bg-brand-card text-brand-text-dim border border-brand-border'
          }`}
        >
          <Plus size={15} />
          {'\u624B\u52A8\u5F55\u5165'}
        </button>
      </div>

      {inputMode === 'scan' && (
        <div className="mb-5">
          <div className="relative rounded-2xl overflow-hidden bg-brand-card/50 border border-brand-border mb-3" style={{ minHeight: 200 }}>
            <div id={QR_SCANNER_ID} className="w-full" />
            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <ScanLine size={48} className="text-brand-mint/30 mb-2" />
                <button
                  onClick={startScan}
                  className="px-5 py-2.5 rounded-xl bg-brand-mint text-brand-bg text-sm font-bold hover:bg-brand-mint-dark active:scale-[0.98] transition-all"
                >
                  {'\u5F00\u59CB\u626B\u7801'}
                </button>
              </div>
            )}
            {isScanning && (
              <button
                onClick={stopScan}
                className="absolute top-2 right-2 px-3 py-1 rounded-lg bg-brand-bg/80 text-brand-text-dim text-xs"
              >
                {'\u53D6\u6D88'}
              </button>
            )}
          </div>
          {(scanError || parseError) && (
            <p className="text-xs text-brand-coral mb-2">{scanError || parseError}</p>
          )}
          {qrParsed && (
            <div className="p-3 rounded-xl bg-brand-mint/10 border border-brand-mint/20 animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <Check size={14} className="text-brand-mint" />
                <span className="text-xs text-brand-mint font-medium">{'\u4E8C\u7EF4\u7801\u5DF2\u8BC6\u522B'}</span>
              </div>
              <p className="text-sm text-brand-text">{manualName} \u00B7 {manualProject} \u00B7 {selectedParts.join('\u3001') || '\u672A\u8BC6\u522B\u90E8\u4F4D'}</p>
            </div>
          )}
        </div>
      )}

      {inputMode === 'paste' && (
        <div className="mb-5 space-y-3">
          <div>
            <label className="text-xs text-brand-text-dim mb-1 block">{'\u7C98\u8D34\u6CBB\u7597\u5355\u4E8C\u7EF4\u7801\u5185\u5BB9'}</label>
            <textarea
              value={pasteText}
              onChange={(e) => { setPasteText(e.target.value); setParseError('') }}
              placeholder={'{\n  "fullName": "\u5F20\u7F8E\u7F8E",\n  "project": "\u70ED\u739B\u5409",\n  "bodyParts": ["\u989D\u5934", "\u4E0B\u988C"]\n}'}
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg bg-brand-card border border-brand-border text-brand-text text-sm placeholder:text-brand-text-muted focus:outline-none focus:border-brand-mint font-mono"
            />
          </div>
          <button
            onClick={handlePaste}
            disabled={!pasteText.trim()}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              pasteText.trim() ? 'bg-brand-mint/10 text-brand-mint hover:bg-brand-mint/20' : 'bg-brand-card text-brand-text-muted cursor-not-allowed'
            }`}
          >
            <ClipboardPaste size={14} />
            {'\u89E3\u6790\u5E76\u586B\u5145'}
          </button>
          {parseError && <p className="text-xs text-brand-coral">{parseError}</p>}
          {qrParsed && (
            <div className="p-3 rounded-xl bg-brand-mint/10 border border-brand-mint/20 animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <Check size={14} className="text-brand-mint" />
                <span className="text-xs text-brand-mint font-medium">{'\u5185\u5BB9\u5DF2\u89E3\u6790'}</span>
              </div>
              <p className="text-sm text-brand-text">{manualName} \u00B7 {manualProject} \u00B7 {selectedParts.join('\u3001') || '\u672A\u8BC6\u522B\u90E8\u4F4D'}</p>
            </div>
          )}
        </div>
      )}

      {inputMode === 'manual' && (
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

      {waitingCustomers.length > 0 && !selectedCustomerId && !manualName && (
        <div className="mb-5">
          <p className="text-xs text-brand-text-dim mb-2">{'\u6216\u9009\u62E9\u5DF2\u767B\u8BB0\u987E\u5BA2'}</p>
          <div className="flex flex-col gap-2">
            {waitingCustomers.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCustomerId(c.id)
                  setManualName('')
                  setManualNickname('')
                  setManualProject('')
                  setSelectedParts([])
                }}
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
              </button>
            ))}
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
          {!selectedCustomerId && !manualName ? '\u8BF7\u626B\u7801\u3001\u7C98\u8D34\u6216\u624B\u52A8\u8F93\u5165\u987E\u5BA2' :
          !selectedRoomId ? '\u8BF7\u9009\u62E9\u623F\u95F4' :
          !selectedParts.length ? '\u8BF7\u9009\u62E9\u6577\u9EBB\u90E8\u4F4D' : ''}
        </p>
      )}
    </div>
  )
}
