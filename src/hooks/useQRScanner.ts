import { useEffect, useRef, useCallback, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface UseQRScannerResult {
  isScanning: boolean
  startScan: () => void
  stopScan: () => void
  error: string | null
}

export function useQRScanner(
  onResult: (text: string) => void,
  containerId: string
): UseQRScannerResult {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  const stopScan = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => scannerRef.current?.clear())
        .catch(() => {})
      scannerRef.current = null
    }
    setIsScanning(false)
  }, [])

  const startScan = useCallback(() => {
    setError(null)
    if (scannerRef.current) {
      stopScan()
    }
    const scanner = new Html5Qrcode(containerId)
    scannerRef.current = scanner
    setIsScanning(true)

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          onResultRef.current(decodedText)
          stopScan()
        },
        () => {}
      )
      .catch((err) => {
        setError('\u65E0\u6CD5\u542F\u7528\u6444\u50CF\u5934\uFF0C\u8BF7\u68C0\u67E5\u6743\u9650\u6216\u4F7F\u7528\u7C98\u8D34\u65B9\u5F0F')
        setIsScanning(false)
        scannerRef.current = null
      })
  }, [containerId, stopScan])

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [])

  return { isScanning, startScan, stopScan, error }
}
