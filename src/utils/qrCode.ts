export interface QRCodeData {
  fullName: string
  nickname: string
  project: string
  projectList: string[]
  bodyParts: string[]
  remarks?: string
  extraItems?: string[]
}

function mergeProjectList(project: string, extraItems?: string[]): string[] {
  const list: string[] = []
  if (project?.trim()) list.push(project.trim())
  if (extraItems?.length) {
    extraItems.forEach((item) => {
      const trimmed = item.trim()
      if (trimmed && !list.includes(trimmed)) list.push(trimmed)
    })
  }
  return list.length > 0 ? list : [project || '']
}

export function parseQRCode(text: string): QRCodeData | null {
  try {
    const data = JSON.parse(text)
    if (data && typeof data === 'object') {
      const project = data.project || data.treatment || data.item || ''
      const extraItems = Array.isArray(data.extraItems || data.items || data.services)
        ? (data.extraItems || data.items || data.services).filter((p: unknown) => typeof p === 'string')
        : undefined
      return {
        fullName: data.fullName || data.name || data.patientName || '',
        nickname: data.nickname || data.nick || '',
        project,
        projectList: mergeProjectList(project, extraItems),
        bodyParts: Array.isArray(data.bodyParts || data.parts || data.areas)
          ? (data.bodyParts || data.parts || data.areas).filter((p: unknown) => typeof p === 'string')
          : [],
        remarks: data.remarks || data.note || data.notes || data.comment,
        extraItems,
      }
    }
  } catch {
    // not JSON
  }

  const pairs = text.split(/[;&|]/).reduce<Record<string, string>>((acc, pair) => {
    const [k, v] = pair.split('=').map((s) => s.trim())
    if (k && v) acc[k] = v
    return acc
  }, {})

  if (pairs.name || pairs.fullName || pairs.patientName) {
    const project = pairs.project || pairs.treatment || pairs.item || ''
    const extraStr = pairs.extraItems || pairs.items || pairs.services
    const extraItems = extraStr ? extraStr.split(/[,+]/).map((s) => s.trim()).filter(Boolean) : undefined
    const partsStr = pairs.bodyParts || pairs.parts || pairs.areas || ''
    const bodyParts = partsStr ? partsStr.split(/[,+]/).map((s) => s.trim()).filter(Boolean) : []
    return {
      fullName: pairs.name || pairs.fullName || pairs.patientName || '',
      nickname: pairs.nickname || pairs.nick || '',
      project,
      projectList: mergeProjectList(project, extraItems),
      bodyParts,
      remarks: pairs.remarks || pairs.note || pairs.comment,
      extraItems,
    }
  }

  return null
}
