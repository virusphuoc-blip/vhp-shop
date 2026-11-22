export function formatVND(n: number): string {
  return `${Math.round(n || 0).toLocaleString('vi-VN')}₫`
}

export function discountPercent(price: number, oldPrice: number): number {
  if (!oldPrice || oldPrice <= price) return 0
  return Math.round(((oldPrice - price) / oldPrice) * 100)
}
