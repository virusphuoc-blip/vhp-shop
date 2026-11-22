import { createContext, useContext } from 'react'
import type { Product, Store } from '../../lib/types'

export interface DashCtx {
  store: Store
  setStore: (s: Store) => void
  products: Product[]
  reloadProducts: () => Promise<void>
}

export const DashContext = createContext<DashCtx | null>(null)

export function useDash(): DashCtx {
  const v = useContext(DashContext)
  if (!v) throw new Error('useDash outside provider')
  return v
}
