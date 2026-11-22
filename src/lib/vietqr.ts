/** Builds a NAPAS 247 / VietQR (EMVCo) payload that any Vietnamese banking app can scan. */
function tlv(id: string, value: string): string {
  return id + String(value.length).padStart(2, '0') + value
}

export function crc16(data: string): string {
  let crc = 0xffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function sanitizeTransferNote(note: string): string {
  return note
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .slice(0, 50)
    .trim()
}

export function buildVietQRPayload(bin: string, accountNo: string, amount?: number, note?: string): string {
  const account = tlv('00', 'A000000727') + tlv('01', tlv('00', bin) + tlv('01', accountNo)) + tlv('02', 'QRIBFTTA')
  let s = tlv('00', '01') + tlv('01', amount ? '12' : '11') + tlv('38', account) + tlv('53', '704')
  if (amount && amount > 0) s += tlv('54', String(Math.round(amount)))
  s += tlv('58', 'VN')
  const cleanNote = note ? sanitizeTransferNote(note) : ''
  if (cleanNote) s += tlv('62', tlv('08', cleanNote))
  s += '6304'
  return s + crc16(s)
}
