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

function splitToList(text: string): string[] {
  return text
    .replace(/[\r\n]+/g, ',')
    .split(/[,，、;；+|\/\\\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function parseQRCode(text: string): QRCodeData | null {
  const trimmed = text.trim()
  try {
    const data = JSON.parse(trimmed)
    if (data && typeof data === 'object') {
      const project = data.project || data.treatment || data.item || ''
      const extraItems = Array.isArray(data.extraItems || data.items || data.services)
        ? (data.extraItems || data.items || data.services).filter((p: unknown) => typeof p === 'string')
        : undefined
      const bodyPartsRaw = Array.isArray(data.bodyParts || data.parts || data.areas)
        ? (data.bodyParts || data.parts || data.areas).filter((p: unknown) => typeof p === 'string')
        : []
      return {
        fullName: data.fullName || data.name || data.patientName || '',
        nickname: data.nickname || data.nick || '',
        project,
        projectList: mergeProjectList(project, extraItems),
        bodyParts: bodyPartsRaw.map((p: string) => p.trim()).filter(Boolean),
        remarks: data.remarks || data.note || data.notes || data.comment,
        extraItems,
      }
    }
  } catch {
    // not JSON
  }

  const lines = trimmed.split(/[\r\n]+/)
  const kvMap: Record<string, string> = {}
  let plainTextParts: string[] = []

  lines.forEach((line) => {
    const trimmedLine = line.trim()
    if (!trimmedLine) return
    const eqMatch = trimmedLine.match(/^(.+?)[=：:]\s*(.+)$/)
    if (eqMatch) {
      const k = eqMatch[1].trim().toLowerCase()
      const v = eqMatch[2].trim()
      kvMap[k] = v
    } else {
      const parts = splitToList(trimmedLine)
      plainTextParts = plainTextParts.concat(parts)
    }
  })

  const nameKey = Object.keys(kvMap).find((k) =>
    ['name', 'fullname', 'patientname', '姓名', '名字', '患者'].includes(k)
  )
  const projectKey = Object.keys(kvMap).find((k) =>
    ['project', 'treatment', 'item', '项目', '治疗项目', '治疗'].includes(k)
  )
  const partsKey = Object.keys(kvMap).find((k) =>
    ['bodyparts', 'parts', 'areas', '部位', '治疗部位', '敷麻部位'].includes(k)
  )
  const remarksKey = Object.keys(kvMap).find((k) =>
    ['remarks', 'note', 'notes', 'comment', '备注', '注意事项', '说明'].includes(k)
  )
  const extraKey = Object.keys(kvMap).find((k) =>
    ['extraitems', 'items', 'services', '附加项目', '额外项目', '其他项目'].includes(k)
  )

  const name = nameKey ? kvMap[nameKey] : ''
  const project = projectKey ? kvMap[projectKey] : ''
  const partsStr = partsKey ? kvMap[partsKey] : ''
  const remarks = remarksKey ? kvMap[remarksKey] : ''
  const extraStr = extraKey ? kvMap[extraKey] : ''

  if (name) {
    const bodyParts = splitToList(partsStr)
    const extraItems = extraStr ? splitToList(extraStr) : undefined
    return {
      fullName: name,
      nickname: kvMap['nickname'] || kvMap['nick'] || kvMap['昵称'] || name.slice(0, 2),
      project,
      projectList: mergeProjectList(project, extraItems),
      bodyParts,
      remarks: remarks || undefined,
      extraItems,
    }
  }

  return null
}
