import { useState, useEffect, useCallback } from 'react'
import { getBodyPartRemaining, getBodyPartStatus } from '@/utils/time'
import type { BodyPart } from '@/types'

export function useTimer(bodyParts: BodyPart[], interval = 1000) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(timer)
  }, [interval])

  const getRemaining = useCallback(
    (bp: BodyPart) => getBodyPartRemaining(bp),
    [now]
  )

  const getStatus = useCallback(
    (bp: BodyPart) => getBodyPartStatus(bp),
    [now]
  )

  const hasOverdue = bodyParts.some((bp) => bp.status !== 'completed' && getBodyPartStatus(bp) === 'overdue')
  const hasNearing = bodyParts.some((bp) => bp.status !== 'completed' && getBodyPartStatus(bp) === 'nearing')

  return { now, getRemaining, getStatus, hasOverdue, hasNearing }
}
