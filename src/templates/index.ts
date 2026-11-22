import type { TemplateId } from '../lib/types'

export interface SpecField {
  key: string
  label: string
  placeholder?: string
  suffix?: string
  /** Show as a highlighted chip on product cards. */
  chip?: boolean
}

export interface OrderMode {
  id: string
  label: string
  needsAddress: boolean
  booking?: boolean
}

export interface TemplatePalette {
  primary: string
  accent: string
  bg: string
  surface: string
  text: string
  muted: string
  border: string
}

export interface TemplateDef {
  id: TemplateId
  name: string
  tagline: string
  icon: string
  palette: TemplatePalette
  dark: boolean
  headingFont: string
  bodyFont: string
  radius: string
  categories: string[]
  categoryIcons: Record<string, string>
  heroTitle: string
  heroSubtitle: string
  specFields: SpecField[]
  sizeOptions: string[]
  orderModes: OrderMode[]
  itemNote: boolean
  itemNoteLabel: string
  addLabel: string
  productWord: string
}

const BASE_FONT = "'Be Vietnam Pro', system-ui, sans-serif"

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'xe-may',
    name: 'Xe máy',
    tagline: 'Mạnh mẽ, tông tối + cam/đỏ, nổi bật thông số xe',
    icon: '🏍️',
    palette: { primary: '#f97316', accent: '#ef4444', bg: '#0b0b0f', surface: '#17171d', text: '#f4f4f5', muted: '#a1a1aa', border: '#2a2a33' },
    dark: true,
    headingFont: "'Oswald', 'Be Vietnam Pro', sans-serif",
    bodyFont: BASE_FONT,
    radius: '6px',
    categories: ['Xe tay ga', 'Xe số', 'Xe côn tay', 'Xe điện', 'Phụ tùng'],
    categoryIcons: { 'Xe tay ga': '🛵', 'Xe số': '🏍️', 'Xe côn tay': '🏁', 'Xe điện': '⚡', 'Phụ tùng': '🔧' },
    heroTitle: 'Xe chất – Giá thật – Giấy tờ chuẩn',
    heroSubtitle: 'Xe mới và xe lướt chính hãng, hỗ trợ trả góp, bảo hành rõ ràng.',
    specFields: [
      { key: 'brand', label: 'Hãng xe', placeholder: 'Honda' },
      { key: 'cc', label: 'Phân khối', placeholder: '150', suffix: 'cc', chip: true },
      { key: 'year', label: 'Đời xe', placeholder: '2024', chip: true },
      { key: 'odo', label: 'Đã đi', placeholder: '5.000', suffix: 'km', chip: true },
      { key: 'color', label: 'Màu sắc', placeholder: 'Đen nhám' },
      { key: 'condition', label: 'Tình trạng', placeholder: 'Mới 100% / Đã qua sử dụng' },
    ],
    sizeOptions: [],
    orderModes: [
      { id: 'delivery', label: 'Giao xe tận nơi', needsAddress: true },
      { id: 'pickup', label: 'Đến cửa hàng xem xe & nhận xe', needsAddress: false },
    ],
    itemNote: false,
    itemNoteLabel: '',
    addLabel: 'Đặt cọc / Mua xe',
    productWord: 'xe',
  },
  {
    id: 'do-choi',
    name: 'Đồ chơi',
    tagline: 'Tươi sáng, nhiều màu, thân thiện với trẻ em',
    icon: '🧸',
    palette: { primary: '#ec4899', accent: '#06b6d4', bg: '#fffdf5', surface: '#ffffff', text: '#1e1b4b', muted: '#6b7280', border: '#fde68a' },
    dark: false,
    headingFont: "'Baloo 2', 'Be Vietnam Pro', sans-serif",
    bodyFont: BASE_FONT,
    radius: '22px',
    categories: ['Giáo dục', 'Lắp ráp', 'Búp bê', 'Xe đồ chơi', 'Sơ sinh', 'Ngoài trời'],
    categoryIcons: { 'Giáo dục': '🧩', 'Lắp ráp': '🧱', 'Búp bê': '🪆', 'Xe đồ chơi': '🚗', 'Sơ sinh': '🍼', 'Ngoài trời': '🪁' },
    heroTitle: 'Thế giới đồ chơi cho bé yêu',
    heroSubtitle: 'An toàn, sáng tạo, vui học mỗi ngày – giao nhanh tận nhà.',
    specFields: [
      { key: 'age', label: 'Độ tuổi', placeholder: '3+ tuổi', chip: true },
      { key: 'material', label: 'Chất liệu', placeholder: 'Nhựa ABS an toàn' },
      { key: 'brand', label: 'Thương hiệu', placeholder: 'Lego' },
    ],
    sizeOptions: [],
    orderModes: [
      { id: 'delivery', label: 'Giao hàng tận nơi', needsAddress: true },
      { id: 'pickup', label: 'Nhận tại cửa hàng', needsAddress: false },
    ],
    itemNote: false,
    itemNoteLabel: '',
    addLabel: 'Thêm vào giỏ',
    productWord: 'đồ chơi',
  },
  {
    id: 'quan-ao',
    name: 'Quần áo',
    tagline: 'Sạch, thời trang, lưới sản phẩm lớn, lọc theo size',
    icon: '👗',
    palette: { primary: '#111111', accent: '#e11d48', bg: '#ffffff', surface: '#f7f7f7', text: '#111111', muted: '#6b7280', border: '#e5e7eb' },
    dark: false,
    headingFont: "'Playfair Display', 'Be Vietnam Pro', serif",
    bodyFont: BASE_FONT,
    radius: '0px',
    categories: ['Áo', 'Quần', 'Váy đầm', 'Áo khoác', 'Phụ kiện'],
    categoryIcons: { 'Áo': '👕', 'Quần': '👖', 'Váy đầm': '👗', 'Áo khoác': '🧥', 'Phụ kiện': '👜' },
    heroTitle: 'Bộ sưu tập mới',
    heroSubtitle: 'Tối giản, dễ phối, chất liệu thoáng mát – đổi size miễn phí 7 ngày.',
    specFields: [
      { key: 'material', label: 'Chất liệu', placeholder: 'Cotton 100%' },
      { key: 'color', label: 'Màu sắc', placeholder: 'Trắng, Đen' },
      { key: 'fit', label: 'Form dáng', placeholder: 'Regular fit' },
    ],
    sizeOptions: ['S', 'M', 'L', 'XL', 'XXL'],
    orderModes: [
      { id: 'delivery', label: 'Giao hàng tận nơi', needsAddress: true },
      { id: 'pickup', label: 'Nhận tại cửa hàng', needsAddress: false },
    ],
    itemNote: false,
    itemNoteLabel: '',
    addLabel: 'Thêm vào giỏ',
    productWord: 'sản phẩm',
  },
  {
    id: 'cafe',
    name: 'Cafe',
    tagline: 'Ấm áp nâu kem, menu đồ uống, đặt bàn / mang đi',
    icon: '☕',
    palette: { primary: '#6f4e37', accent: '#c8a27a', bg: '#faf6f0', surface: '#fffdf9', text: '#3b2a20', muted: '#8a7564', border: '#eadfd2' },
    dark: false,
    headingFont: "'Playfair Display', 'Be Vietnam Pro', serif",
    bodyFont: BASE_FONT,
    radius: '14px',
    categories: ['Cà phê', 'Trà', 'Đá xay', 'Nước ép', 'Bánh ngọt'],
    categoryIcons: { 'Cà phê': '☕', 'Trà': '🍵', 'Đá xay': '🥤', 'Nước ép': '🍹', 'Bánh ngọt': '🍰' },
    heroTitle: 'Một tách cà phê, một ngày an yên',
    heroSubtitle: 'Hạt rang mộc, pha thủ công. Đặt bàn trước hoặc gọi mang đi chỉ vài chạm.',
    specFields: [{ key: 'volume', label: 'Dung tích', placeholder: '350ml' }],
    sizeOptions: ['S', 'M', 'L'],
    orderModes: [
      { id: 'takeaway', label: 'Mang đi (đến lấy)', needsAddress: false },
      { id: 'delivery', label: 'Giao tận nơi', needsAddress: true },
      { id: 'dinein', label: 'Đặt bàn tại quán', needsAddress: false, booking: true },
    ],
    itemNote: true,
    itemNoteLabel: 'Ghi chú (ít đường, ít đá...)',
    addLabel: 'Thêm vào order',
    productWord: 'món',
  },
  {
    id: 'tap-hoa',
    name: 'Tạp hoá',
    tagline: 'Thực dụng, nhiều danh mục, giá rõ, tìm nhanh',
    icon: '🛒',
    palette: { primary: '#16a34a', accent: '#f59e0b', bg: '#f4f6f8', surface: '#ffffff', text: '#111827', muted: '#6b7280', border: '#e5e7eb' },
    dark: false,
    headingFont: BASE_FONT,
    bodyFont: BASE_FONT,
    radius: '10px',
    categories: ['Gạo & ngũ cốc', 'Mì & đồ khô', 'Gia vị', 'Dầu ăn', 'Nước giải khát', 'Sữa', 'Bánh kẹo', 'Đồ hộp', 'Hoá phẩm', 'Chăm sóc cá nhân', 'Rau củ', 'Trứng & thịt'],
    categoryIcons: {
      'Gạo & ngũ cốc': '🌾', 'Mì & đồ khô': '🍜', 'Gia vị': '🧂', 'Dầu ăn': '🫒', 'Nước giải khát': '🥤', 'Sữa': '🥛',
      'Bánh kẹo': '🍬', 'Đồ hộp': '🥫', 'Hoá phẩm': '🧴', 'Chăm sóc cá nhân': '🪥', 'Rau củ': '🥬', 'Trứng & thịt': '🥚',
    },
    heroTitle: 'Đi chợ online – Giao nhanh trong khu vực',
    heroSubtitle: 'Hàng thiết yếu mỗi ngày, giá niêm yết rõ ràng.',
    specFields: [
      { key: 'unit', label: 'Đơn vị tính', placeholder: 'gói / chai / kg', chip: true },
      { key: 'brand', label: 'Thương hiệu', placeholder: 'Vinamilk' },
    ],
    sizeOptions: [],
    orderModes: [
      { id: 'delivery', label: 'Giao hàng tận nơi', needsAddress: true },
      { id: 'pickup', label: 'Đến cửa hàng lấy', needsAddress: false },
    ],
    itemNote: false,
    itemNoteLabel: '',
    addLabel: 'Thêm',
    productWord: 'mặt hàng',
  },
  {
    id: 'do-an',
    name: 'Đồ ăn',
    tagline: 'Ngon mắt, ảnh món lớn, đặt món kèm ghi chú',
    icon: '🍜',
    palette: { primary: '#e4572e', accent: '#ffb627', bg: '#fff8f1', surface: '#ffffff', text: '#2b1d14', muted: '#7c6a5c', border: '#fde3cf' },
    dark: false,
    headingFont: "'Nunito', 'Be Vietnam Pro', sans-serif",
    bodyFont: BASE_FONT,
    radius: '18px',
    categories: ['Món chính', 'Cơm', 'Bún & phở', 'Ăn vặt', 'Đồ uống', 'Combo'],
    categoryIcons: { 'Món chính': '🍲', 'Cơm': '🍛', 'Bún & phở': '🍜', 'Ăn vặt': '🍢', 'Đồ uống': '🧋', 'Combo': '🍱' },
    heroTitle: 'Nóng hổi, vừa thổi vừa ăn',
    heroSubtitle: 'Nấu mới mỗi ngày – đặt món online, ghi chú khẩu vị theo ý bạn.',
    specFields: [
      { key: 'portion', label: 'Khẩu phần', placeholder: '1 người', chip: true },
      { key: 'prep', label: 'Thời gian chuẩn bị', placeholder: '15 phút' },
    ],
    sizeOptions: [],
    orderModes: [
      { id: 'delivery', label: 'Giao tận nơi', needsAddress: true },
      { id: 'pickup', label: 'Tự đến lấy', needsAddress: false },
    ],
    itemNote: true,
    itemNoteLabel: 'Ghi chú cho bếp (ít cay, không hành...)',
    addLabel: 'Đặt món',
    productWord: 'món',
  },
]

export function getTemplate(id: string): TemplateDef {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0]
}

export function isTemplateId(id: string): id is TemplateId {
  return TEMPLATES.some((t) => t.id === id)
}
