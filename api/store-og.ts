// Trả trang /s/{slug} kèm thẻ Open Graph riêng của cửa hàng (Zalo/Facebook/Telegram không chạy JavaScript).
// Chỉ đọc dữ liệu công khai qua Firestore REST bằng API key web, không cần khoá bí mật.

type Fields = Record<string, unknown>

export interface OgStore {
  name: string
  slug: string
  description: string
  address: string
  template: string
  variant: string
  logo: string
  banner: string
  primary: string
  closed: boolean
  closedReason: string
}

const CATEGORY: [string, string][] = [
  ['xe-may', 'xe máy'],
  ['do-choi', 'đồ chơi'],
  ['quan-ao', 'thời trang'],
  ['cafe', 'cafe'],
  ['tap-hoa', 'tạp hoá'],
  ['do-an', 'đồ ăn'],
  ['dien-tu', 'điện tử'],
  ['noi-that', 'nội thất'],
]

const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {}

/** Giải mã giá trị Firestore REST thành giá trị JS. */
export function fromValue(v: unknown): unknown {
  const x = (v || {}) as Record<string, unknown>
  if ('stringValue' in x) return x.stringValue
  if ('booleanValue' in x) return x.booleanValue
  if ('integerValue' in x) return Number(x.integerValue)
  if ('doubleValue' in x) return x.doubleValue
  if ('timestampValue' in x) return x.timestampValue
  if ('mapValue' in x) return fromFields(((x.mapValue as Fields).fields || {}) as Fields)
  if ('arrayValue' in x) return (((x.arrayValue as Fields).values || []) as unknown[]).map(fromValue)
  return null
}

export function fromFields(f: Fields): Record<string, unknown> {
  return Object.fromEntries(Object.entries(f || {}).map(([k, v]) => [k, fromValue(v)]))
}

const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export function toOgStore(slug: string, d: Record<string, unknown>): OgStore {
  const theme = (d.theme || {}) as Record<string, unknown>
  return {
    name: s(d.name) || slug,
    slug,
    description: s(d.description),
    address: s(d.address),
    template: s(d.template),
    variant: s(theme.variant),
    logo: s(theme.logo),
    banner: s(theme.banner),
    primary: /^#[0-9a-fA-F]{6}$/.test(s(theme.primary)) ? s(theme.primary) : '#4f46e5',
    closed: d.status === 'closed',
    closedReason: s(d.closedReason),
  }
}

export function categoryLabel(st: Pick<OgStore, 'template' | 'variant'>): string {
  const key = st.variant || st.template
  return CATEGORY.find(([id]) => key === id || key.startsWith(id + '-'))?.[1] || ''
}

export function clip(t: string, n: number): string {
  const one = t.replace(/\s+/g, ' ').trim()
  return one.length > n ? one.slice(0, n - 1).trimEnd() + '…' : one
}

export function ogDescription(st: OgStore, productNames: string[]): string {
  const cat = categoryLabel(st)
  let d = st.description
  if (!d) {
    d = `${st.name} – cửa hàng ${cat || 'online'}${st.address ? ` tại ${st.address}` : ''}.`
    if (productNames.length) d += ` Đang bán: ${productNames.slice(0, 3).join(', ')}.`
    d += ' Đặt hàng online: COD, chuyển khoản hoặc Zalo.'
  }
  if (st.closed) d = `Cửa hàng tạm đóng${st.closedReason ? ` (${st.closedReason})` : ''}. ${d}`
  return clip(d, 200)
}

function esc(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function setMeta(html: string, attr: 'name' | 'property', key: string, value: string): string {
  const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`)
  return re.test(html) ? html.replace(re, `$1${esc(value)}$2`) : html.replace('</head>', `    <meta ${attr}="${key}" content="${esc(value)}" />\n  </head>`)
}

export interface OgMeta {
  title: string
  description: string
  url: string
  image: string
}

export function injectOg(html: string, m: OgMeta): string {
  let h = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(m.title)}</title>`)
  h = h.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(m.url)}$2`)
  h = setMeta(h, 'name', 'description', m.description)
  h = setMeta(h, 'property', 'og:title', m.title)
  h = setMeta(h, 'property', 'og:description', m.description)
  h = setMeta(h, 'property', 'og:url', m.url)
  h = setMeta(h, 'property', 'og:image', m.image)
  h = setMeta(h, 'name', 'twitter:title', m.title)
  h = setMeta(h, 'name', 'twitter:description', m.description)
  h = setMeta(h, 'name', 'twitter:image', m.image)
  return h
}

const DOCS = () =>
  `https://firestore.googleapis.com/v1/projects/${env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents`

async function getDoc(path: string): Promise<Record<string, unknown> | null> {
  const r = await fetch(`${DOCS()}/${path}?key=${env.VITE_FIREBASE_API_KEY}`)
  if (!r.ok) return null
  return fromFields(((await r.json()) as Fields).fields as Fields)
}

export async function listProducts(storeId: string): Promise<Record<string, unknown>[]> {
  const r = await fetch(`${DOCS()}/stores/${storeId}/products?pageSize=6&key=${env.VITE_FIREBASE_API_KEY}`)
  if (!r.ok) return []
  const docs = (((await r.json()) as Fields).documents || []) as Fields[]
  return docs.map((d) => fromFields(d.fields as Fields)).filter((p) => p.active !== false)
}

export async function loadStore(slug: string): Promise<{ id: string; store: OgStore } | null> {
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return null
  const sl = await getDoc(`slugs/${slug}`)
  const id = s(sl?.storeId)
  if (!id) return null
  const d = await getDoc(`stores/${id}`)
  if (!d || d.active !== true) return null
  return { id, store: toOgStore(slug, d) }
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const host = request.headers.get('x-forwarded-host') || url.host
  const origin = `https://${host}`
  const slug = (url.searchParams.get('slug') || '').toLowerCase()

  const page = await fetch(`${origin}/index.html`)
  let html = await page.text()
  try {
    const res = await loadStore(slug)
    if (res) {
      const st = res.store
      const products = st.closed ? [] : await listProducts(res.id)
      const ver = encodeURIComponent((st.banner || st.logo).slice(-16) || 'p' + products.length)
      html = injectOg(html, {
        title: st.closed ? `${st.name} (tạm đóng)` : st.name,
        description: ogDescription(st, products.map((p) => s(p.name)).filter(Boolean)),
        url: `${origin}/s/${slug}`,
        image: `${origin}/api/store-og-image?slug=${slug}&v=${ver}`,
      })
    }
  } catch {
    // Lỗi đọc Firestore: trả trang gốc, app vẫn chạy bình thường.
  }
  return new Response(html, {
    status: page.ok ? 200 : 502,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  })
}
