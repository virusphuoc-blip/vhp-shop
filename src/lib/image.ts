export const IMAGE_LIMITS = {
  product: { maxDim: 1000, maxKB: 150 },
  thumb: { maxDim: 360, maxKB: 25 },
  logo: { maxDim: 256, maxKB: 50 },
  banner: { maxDim: 1400, maxKB: 250 },
} as const

export const MAX_UPLOADS_PER_PRODUCT = 4

export function dataUrlKB(dataUrl: string): number {
  const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  return Math.round((b64.length * 3) / 4 / 1024)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Không đọc được ảnh.'))
    img.src = src
  })
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error('Không đọc được tệp.'))
    r.readAsDataURL(file)
  })
}

/**
 * Resizes and re-encodes an image until it fits under maxKB, returning a data URL.
 * Throws a Vietnamese error message when the image cannot be made small enough.
 */
export async function compressImage(
  source: File | string,
  opts: { maxDim: number; maxKB: number; transparent?: boolean },
): Promise<string> {
  if (source instanceof File && !source.type.startsWith('image/')) throw new Error('Tệp không phải hình ảnh.')
  const src = typeof source === 'string' ? source : await readFile(source)
  const img = await loadImage(src)
  let dim = opts.maxDim
  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, dim / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Trình duyệt không hỗ trợ nén ảnh.')
    if (!opts.transparent) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
    }
    ctx.drawImage(img, 0, 0, w, h)
    for (const q of [0.82, 0.7, 0.58, 0.45]) {
      let out = canvas.toDataURL(opts.transparent ? 'image/webp' : 'image/jpeg', q)
      if (opts.transparent && !out.startsWith('data:image/webp')) out = canvas.toDataURL('image/png')
      if (dataUrlKB(out) <= opts.maxKB) return out
    }
    dim = Math.round(dim * 0.75)
  }
  throw new Error(`Ảnh quá lớn, không nén được dưới ${opts.maxKB} KB. Hãy chọn ảnh khác hoặc dán link ảnh.`)
}

export function isImageUrl(s: string): boolean {
  return /^https:\/\/\S+$/i.test(s.trim())
}
