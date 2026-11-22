import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Coupon, NewOrderLike, Product, Review, Store } from './types'
import { getTemplate, type TemplateDef } from '../templates'

export interface StoreApi {
  getCoupon(code: string): Promise<Coupon | null>
  placeOrder(order: NewOrderLike): Promise<string>
  addReview(r: Omit<Review, 'id' | 'createdAt'>): Promise<Review>
  getMedia(productId: string): Promise<string[]>
}

export interface CartItem {
  key: string
  productId: string
  name: string
  price: number
  qty: number
  size: string
  note: string
  thumb: string
}

interface StoreCtxValue {
  store: Store
  template: TemplateDef
  products: Product[]
  reviews: Review[]
  demo: boolean
  base: string
  link: (path?: string) => string
  api: StoreApi
  addLocalReview: (r: Review) => void
  cart: CartItem[]
  addToCart: (p: Product, opts: { qty: number; size: string; note: string }) => void
  setQty: (key: string, qty: number) => void
  removeItem: (key: string) => void
  clearCart: () => void
  cartCount: number
  cartTotal: number
}

const Ctx = createContext<StoreCtxValue | null>(null)

export function StoreProvider(props: {
  store: Store
  products: Product[]
  reviews: Review[]
  demo: boolean
  base: string
  api: StoreApi
  children: ReactNode
}) {
  const { store, base } = props
  const storageKey = `vhp-cart-${store.id}`
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]') as CartItem[]
    } catch {
      return []
    }
  })
  const [reviews, setReviews] = useState(props.reviews)
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cart))
  }, [cart, storageKey])

  const link = useCallback((path = '') => `${base}/${path}`.replace(/\/+$/, '') || '/', [base])

  const addToCart = useCallback((p: Product, opts: { qty: number; size: string; note: string }) => {
    const key = `${p.id}|${opts.size}|${opts.note}`
    setCart((c) => {
      const found = c.find((i) => i.key === key)
      if (found) return c.map((i) => (i.key === key ? { ...i, qty: i.qty + opts.qty } : i))
      return [...c, { key, productId: p.id, name: p.name, price: p.price, qty: opts.qty, size: opts.size, note: opts.note, thumb: p.thumb || p.images[0] || '' }]
    })
  }, [])

  const value = useMemo<StoreCtxValue>(
    () => ({
      store,
      template: getTemplate(store.template),
      products: props.products.filter((p) => p.active),
      reviews,
      demo: props.demo,
      base,
      link,
      api: props.api,
      addLocalReview: (r) => setReviews((rs) => [r, ...rs]),
      cart,
      addToCart,
      setQty: (key, qty) => setCart((c) => c.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(999, qty)) } : i))),
      removeItem: (key) => setCart((c) => c.filter((i) => i.key !== key)),
      clearCart: () => setCart([]),
      cartCount: cart.reduce((s, i) => s + i.qty, 0),
      cartTotal: cart.reduce((s, i) => s + i.qty * i.price, 0),
    }),
    [store, props.products, props.demo, props.api, reviews, base, link, cart, addToCart],
  )
  return <Ctx.Provider value={value}>{props.children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): StoreCtxValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore outside StoreProvider')
  return v
}

// eslint-disable-next-line react-refresh/only-export-components
export function ratingFor(reviews: Review[], productId: string): { avg: number; count: number } {
  const rs = reviews.filter((r) => r.productId === productId)
  return { avg: rs.length ? rs.reduce((s, r) => s + r.rating, 0) / rs.length : 0, count: rs.length }
}
