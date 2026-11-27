// Ảnh xem trước (og:image) của cửa hàng: ảnh bìa → logo → ảnh sản phẩm → thẻ tự vẽ theo tên shop.
import { ImageResponse } from '@vercel/og'
import { categoryLabel, clip, listProducts, loadStore, type OgStore } from './store-og'

export const config = { runtime: 'edge' }

const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

function productImage(p: Record<string, unknown>): string {
  const imgs = Array.isArray(p.images) ? (p.images as unknown[]).map(s) : []
  return imgs.find((x) => /^https?:/.test(x)) || s(p.thumb) || imgs[0] || ''
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const origin = `https://${request.headers.get('x-forwarded-host') || url.host}`
  const slug = (url.searchParams.get('slug') || '').toLowerCase()
  const res = await loadStore(slug)
  let img = res ? res.store.banner || res.store.logo : ''
  if (res && !img && !res.store.closed) img = (await listProducts(res.id)).map(productImage).find(Boolean) || ''
  const m = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/.exec(img)
  const cache = { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' }
  if (m) {
    const bin = atob(m[2])
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return new Response(bytes, { headers: { 'Content-Type': m[1], ...cache } })
  }
  if (/^https?:/.test(img)) return Response.redirect(img, 302)
  if (!res) return Response.redirect(`${origin}/favicon.svg`, 302)
  return storeCard(res.store, cache)
}

async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@700&text=${encodeURIComponent(text)}`)).text()
    const src = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/.exec(css)?.[1]
    return src ? await (await fetch(src)).arrayBuffer() : null
  } catch {
    return null
  }
}

type El = { type: string; props: Record<string, unknown> }
const el = (type: string, style: Record<string, unknown>, children?: unknown): El => ({ type, props: { style, children } })

/** Ảnh xem trước 1200×630 cho shop chưa có ảnh: tên shop + ngành hàng trên màu chủ đạo của shop. */
async function storeCard(st: OgStore, headers: Record<string, string>): Promise<Response> {
  const cat = categoryLabel(st)
  const sub = st.closed ? 'Cửa hàng tạm đóng' : `Cửa hàng ${cat || 'online'}${st.address ? ` · ${clip(st.address, 40)}` : ''}`
  const name = clip(st.name, 60)
  const font = await loadFont(name + sub + 'Đặt hàng online')
  const tree = el('div', { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, background: st.primary, color: '#fff', fontFamily: 'BVP' }, [
    el('div', { fontSize: 76, fontWeight: 700, lineHeight: 1.1 }, name),
    el('div', { fontSize: 40, marginTop: 28, opacity: 0.9 }, sub),
    el('div', { fontSize: 30, marginTop: 48, opacity: 0.75 }, 'Đặt hàng online'),
  ])
  const img = new ImageResponse(tree as never, {
    width: 1200,
    height: 630,
    fonts: font ? [{ name: 'BVP', data: font, weight: 700, style: 'normal' }] : undefined,
  })
  return new Response(img.body, { headers: { 'Content-Type': 'image/png', ...headers } })
}

