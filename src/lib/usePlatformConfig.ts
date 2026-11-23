import { useCallback, useEffect, useState } from 'react'
import { firebaseConfigured } from './firebase'
import type { PlansConfig, PlatformSettings } from './types'

export interface PlatformConfig {
  plans: PlansConfig | null
  settings: PlatformSettings | null
}

let cache: Promise<PlatformConfig> | null = null

function load(): Promise<PlatformConfig> {
  if (!cache) {
    cache = import('./db').then(async (db) => {
      const [plans, settings] = await Promise.all([db.getPlansConfig().catch(() => null), db.getPlatformSettings().catch(() => null)])
      return { plans, settings }
    })
  }
  return cache
}

/** Giới hạn gói + công tắc chế độ miễn phí (platformConfig/*). */
export function usePlatformConfig(): PlatformConfig & { loading: boolean; reload: () => Promise<void> } {
  const [cfg, setCfg] = useState<PlatformConfig | null>(null)
  useEffect(() => {
    if (!firebaseConfigured) return
    let alive = true
    load().then((c) => alive && setCfg(c))
    return () => {
      alive = false
    }
  }, [])
  const reload = useCallback(async () => {
    cache = null
    setCfg(await load())
  }, [])
  return { plans: cfg?.plans ?? null, settings: cfg?.settings ?? null, loading: firebaseConfigured && !cfg, reload }
}
