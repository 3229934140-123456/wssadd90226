export interface QRCodeData {
  fullName: string
  nickname: string
  project: string
  bodyParts: string[]
}

export function parseQRCode(text: string): QRCodeData | null {
  try {
    const data = JSON.parse(text)
    if (data && typeof data === 'object') {
      return {
        fullName: data.fullName || data.name || data.patientName || '',
        nickname: data.nickname || data.nick || '',
        project: data.project || data.treatment || data.item || '',
        bodyParts: Array.isArray(data.bodyParts || data.parts || data.areas)
          ? (data.bodyParts || data.parts || data.areas).filter((p: unknown) => typeof p === 'string')
          : [],
      }
    }
  } catch {
    // not JSON
  }

  const pairs = text.split(/[;&|,]/).reduce<Record<string, string>>((acc, pair) => {
    const [k, v] = pair.split('=').map((s) => s.trim())
    if (k && v) acc[k] = v
    return acc
  }, {})

  if (pairs.name || pairs.fullName || pairs.patientName) {
    return {
      fullName: pairs.name || pairs.fullName || pairs.patientName || '',
      nickname: pairs.nickname || pairs.nick || '',
      project: pairs.project || pairs.treatment || pairs.item || '',
      bodyParts: pairs.bodyParts ? pairs.bodyParts.split(/[+,]/) : pairs.parts ? pairs.parts.split(/[+,]/) : [],
    }
  }

  return null
}
