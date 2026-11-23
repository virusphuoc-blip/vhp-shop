import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert, Stars } from '../components/ui'
import { formatVND } from '../lib/money'
import type { Review } from '../lib/types'
import { Price, ProductGrid } from './ProductBits'
import { ratingFor, useStore } from './StoreContext'

function Gallery({ images, alt, icon }: { images: string[]; alt: string; icon: string }) {
  const [i, setI] = useState(0)
  if (!images.length) return <div className="flex aspect-square items-center justify-center rounded-s bg-sborder/40 text-8xl">{icon}</div>
  return (
    <div>
      <img src={images[Math.min(i, images.length - 1)]} alt={alt} className="aspect-square w-full rounded-s bg-white object-cover" />
      {images.length > 1 && (
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {images.map((src, k) => (
            <button key={k} type="button" onClick={() => setI(k)} className={`h-16 w-16 shrink-0 overflow-hidden rounded border-2 ${k === i ? 'border-sp' : 'border-transparent'}`} aria-label={`Ảnh ${k + 1}`}>
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Reviews({ productId }: { productId: string }) {
  const { reviews, api, addLocalReview } = useStore()
  const list = reviews.filter((r) => r.productId === productId)
  const { avg, count } = ratingFor(reviews, productId)
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      const r: Review = await api.addReview({ productId, name: name.trim(), rating, comment: comment.trim() })
      addLocalReview(r)
      setName('')
      setComment('')
      setRating(5)
      setMsg({ kind: 'success', text: 'Cảm ơn bạn đã đánh giá!' })
    } catch {
      setMsg({ kind: 'error', text: 'Không gửi được đánh giá, vui lòng thử lại.' })
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="mt-10">
      <h2 className="font-heading text-xl font-bold">Đánh giá ({count})</h2>
      {count > 0 && (
        <div className="mt-1 flex items-center gap-2">
          <Stars value={avg} size={20} /> <span className="font-bold">{avg.toFixed(1)}/5</span>
        </div>
      )}
      <form onSubmit={submit} className="mt-4 space-y-2 rounded-s border border-sborder bg-ssurf p-3">
        <div className="flex items-center gap-2 text-sm">
          Chấm điểm: <Stars value={rating} size={26} onChange={setRating} />
        </div>
        <input className="s-field" placeholder="Tên của bạn" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} aria-label="Tên của bạn" />
        <textarea className="s-field" rows={2} placeholder="Cảm nhận của bạn..." value={comment} onChange={(e) => setComment(e.target.value)} required maxLength={500} aria-label="Nội dung đánh giá" />
        {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
        <button className="s-btn" disabled={busy}>{busy ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
      </form>
      <ul className="mt-4 space-y-3">
        {list.map((r) => (
          <li key={r.id} className="border-b border-sborder pb-3">
            <div className="flex items-center gap-2">
              <b>{r.name}</b> <Stars value={r.rating} size={13} />
            </div>
            <p className="mt-0.5 text-sm text-smuted">{r.comment}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function ProductDetail() {
  const { productId = '' } = useParams()
  const { products, template, link, addToCart, api, cart } = useStore()
  const nav = useNavigate()
  const p = products.find((x) => x.id === productId)
  const [media, setMedia] = useState<{ id: string; images: string[] }>({ id: '', images: [] })
  const [qty, setQty] = useState(1)
  const [size, setSize] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!p || !p.uploadCount) return
    let cancelled = false
    api.getMedia(p.id).then((images) => !cancelled && setMedia({ id: p.id, images }), () => {})
    return () => {
      cancelled = true
    }
  }, [p, api])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [productId])

  if (!p)
    return (
      <div className="px-4 py-20 text-center">
        <p>Không tìm thấy {template.productWord} này.</p>
        <Link to={link('san-pham')} className="s-btn mt-4">Xem {template.productWord} khác</Link>
      </div>
    )

  const uploaded = media.id === p.id ? media.images : []
  const images = [...uploaded, ...p.images].filter(Boolean)
  if (!images.length && p.thumb) images.push(p.thumb)
  const inCart = cart.filter((i) => i.productId === p.id).reduce((s, i) => s + i.qty, 0)
  const maxQty = Math.max(0, p.stock - inCart)
  const specs = template.specFields.filter((f) => p.specs[f.key])
  const related = products.filter((x) => x.id !== p.id && x.category === p.category).slice(0, 4)
  const fill = related.length < 4 ? products.filter((x) => x.id !== p.id && x.category !== p.category).slice(0, 4 - related.length) : []

  const add = (go: boolean) => {
    setErr('')
    if (p.sizes.length && !size) return setErr('Vui lòng chọn size.')
    if (qty > maxQty) return setErr(maxQty ? `Chỉ còn ${maxQty} sản phẩm.` : 'Sản phẩm đã hết hàng.')
    addToCart(p, { qty, size, note: note.trim() })
    setAdded(true)
    setNote('')
    if (go) nav(link('gio-hang'))
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-5">
      <nav className="mb-3 text-sm text-smuted">
        <Link to={link()} className="hover:text-sp">Trang chủ</Link> / <Link to={`${link('san-pham')}?cat=${encodeURIComponent(p.category)}`} className="hover:text-sp">{p.category}</Link>
      </nav>
      <div className="grid gap-6 md:grid-cols-2">
        <Gallery images={images} alt={p.name} icon={template.categoryIcons[p.category] || template.icon} />
        <div>
          <h1 className={`font-heading text-2xl leading-tight font-bold sm:text-3xl ${template.category === 'xe-may' ? 'uppercase' : ''}`}>{p.name}</h1>
          <div className="mt-2">
            <Price p={p} big />
          </div>
          {(template.category === 'xe-may' || template.category === 'dien-tu') && specs.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {specs.filter((f) => f.chip).map((f) => (
                <div key={f.key} className="rounded-s border border-sp/40 bg-sp/10 p-2 text-center">
                  <div className="text-[11px] text-smuted uppercase">{f.label}</div>
                  <div className="font-heading text-xl font-bold text-sp">{p.specs[f.key]}<span className="text-sm">{f.suffix ? ` ${f.suffix}` : ''}</span></div>
                </div>
              ))}
            </div>
          )}
          <p className={`mt-3 text-sm font-semibold ${p.stock > 0 ? 'text-emerald-500' : 'text-sa'}`}>{p.stock > 0 ? `Còn ${p.stock} sản phẩm` : 'Hết hàng'}</p>
          {p.sizes.length > 0 && (
            <div className="mt-4">
              <div className="mb-1 text-sm font-semibold">Chọn size</div>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => (
                  <button key={s} type="button" onClick={() => setSize(s)} aria-pressed={size === s} className={`min-w-11 rounded-s border px-3 py-2 text-sm font-bold ${size === s ? 'border-sp bg-sp text-white' : 'border-sborder bg-ssurf'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {template.itemNote && (
            <div className="mt-4">
              <label className="mb-1 block text-sm font-semibold" htmlFor="item-note">{template.itemNoteLabel}</label>
              <input id="item-note" className="s-field" value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} />
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center rounded-s border border-sborder bg-ssurf">
              <button type="button" className="px-3 py-2 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Giảm số lượng">−</button>
              <span className="w-8 text-center font-bold" data-testid="qty">{qty}</span>
              <button type="button" className="px-3 py-2 text-lg" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="Tăng số lượng">+</button>
            </div>
            <span className="text-sm text-smuted">Tạm tính: <b className="text-stext">{formatVND(qty * p.price)}</b></span>
          </div>
          {err && <div className="mt-3"><Alert>{err}</Alert></div>}
          {added && !err && <div className="mt-3"><Alert kind="success">Đã thêm vào giỏ hàng. <Link to={link('gio-hang')} className="font-bold underline">Xem giỏ</Link></Alert></div>}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" className="s-btn-outline" disabled={p.stock <= 0} onClick={() => add(false)}>{template.addLabel}</button>
            <button type="button" className="s-btn" disabled={p.stock <= 0} onClick={() => add(true)}>Mua ngay</button>
          </div>
          {specs.length > 0 && (
            <table className="mt-6 w-full text-sm">
              <tbody>
                {specs.map((f) => (
                  <tr key={f.key} className="border-b border-sborder">
                    <th className="py-2 pr-3 text-left font-medium text-smuted">{f.label}</th>
                    <td className="py-2 font-semibold">{p.specs[f.key]}{f.suffix ? ` ${f.suffix}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {p.description && <p className="mt-5 text-[15px] leading-relaxed whitespace-pre-line">{p.description}</p>}
        </div>
      </div>
      <Reviews productId={p.id} />
      {related.length + fill.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading mb-4 text-xl font-bold">{template.productWord[0].toUpperCase()}{template.productWord.slice(1)} liên quan</h2>
          <ProductGrid products={[...related, ...fill]} />
        </section>
      )}
    </div>
  )
}
