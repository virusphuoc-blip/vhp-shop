import { Link } from 'react-router-dom'
import { formatVND } from '../lib/money'
import { useStore } from './StoreContext'

export default function CartPage() {
  const { cart, setQty, removeItem, cartTotal, link, products, template } = useStore()
  if (!cart.length)
    return (
      <div className="px-4 py-20 text-center">
        <div className="text-5xl">🛒</div>
        <p className="mt-3 text-smuted">Giỏ hàng đang trống.</p>
        <Link to={link('san-pham')} className="s-btn mt-5">Chọn {template.productWord}</Link>
      </div>
    )
  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <h1 className="font-heading text-2xl font-bold">Giỏ hàng</h1>
      <ul className="mt-4 space-y-3">
        {cart.map((i) => {
          const p = products.find((x) => x.id === i.productId)
          return (
            <li key={i.key} className="flex gap-3 rounded-s border border-sborder bg-ssurf p-2.5" data-testid="cart-item">
              {i.thumb ? <img src={i.thumb} alt="" className="h-20 w-20 shrink-0 rounded object-cover" /> : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded bg-sborder/40 text-3xl">{template.icon}</div>}
              <div className="min-w-0 flex-1">
                <Link to={link(`san-pham/${i.productId}`)} className="line-clamp-2 font-semibold">{i.name}</Link>
                {i.size && <p className="text-xs text-smuted">Size: {i.size}</p>}
                {i.note && <p className="text-xs text-smuted">Ghi chú: {i.note}</p>}
                {!p && <p className="text-xs text-sa">Sản phẩm không còn bán</p>}
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center rounded border border-sborder">
                    <button type="button" className="px-2.5 py-1" onClick={() => (i.qty > 1 ? setQty(i.key, i.qty - 1) : removeItem(i.key))} aria-label="Giảm">−</button>
                    <span className="w-7 text-center text-sm font-bold">{i.qty}</span>
                    <button type="button" className="px-2.5 py-1" onClick={() => setQty(i.key, i.qty + 1)} aria-label="Tăng">+</button>
                  </div>
                  <span className="font-bold text-sp">{formatVND(i.qty * i.price)}</span>
                </div>
              </div>
              <button type="button" onClick={() => removeItem(i.key)} className="self-start p-1 text-xl leading-none text-smuted" aria-label={`Xoá ${i.name}`}>×</button>
            </li>
          )
        })}
      </ul>
      <div className="mt-5 flex items-center justify-between text-lg">
        <span>Tạm tính</span>
        <b className="text-sp">{formatVND(cartTotal)}</b>
      </div>
      <Link to={link('thanh-toan')} className="s-btn mt-4 w-full py-3 text-base">Tiến hành đặt hàng</Link>
      <Link to={link('san-pham')} className="mt-3 block text-center text-sm text-smuted underline">Tiếp tục mua sắm</Link>
    </div>
  )
}
