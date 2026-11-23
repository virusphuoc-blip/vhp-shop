import type { CategoryId, StoredTemplateId, TemplateId } from '../lib/types'

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
  /** Ngành hàng – quyết định bố cục trang và nghiệp vụ. */
  category: CategoryId
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

const ORIGINALS: TemplateDef[] = [
  {
    id: 'xe-may',
    category: 'xe-may',
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
    category: 'do-choi',
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
    category: 'quan-ao',
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
    category: 'cafe',
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
    category: 'tap-hoa',
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
    category: 'do-an',
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

const DIEN_TU: TemplateDef = {
  id: 'dien-tu',
  category: 'dien-tu',
  name: 'Điện tử',
  tagline: 'Hiện đại, xanh dương công nghệ, nổi bật thông số & bảo hành',
  icon: '📱',
  palette: { primary: '#2563eb', accent: '#f43f5e', bg: '#f1f5f9', surface: '#ffffff', text: '#0f172a', muted: '#64748b', border: '#dbe3ee' },
  dark: false,
  headingFont: "'Lexend', 'Be Vietnam Pro', sans-serif",
  bodyFont: BASE_FONT,
  radius: '12px',
  categories: ['Điện thoại', 'Laptop', 'Tivi', 'Gia dụng', 'Phụ kiện'],
  categoryIcons: { 'Điện thoại': '📱', 'Laptop': '💻', 'Tivi': '📺', 'Gia dụng': '🔌', 'Phụ kiện': '🎧' },
  heroTitle: 'Chính hãng – Bảo hành rõ ràng',
  heroSubtitle: 'Điện thoại, laptop, tivi và đồ gia dụng chính hãng, hỗ trợ trả góp, đổi trả 7 ngày.',
  specFields: [
    { key: 'brand', label: 'Hãng', placeholder: 'Samsung', chip: true },
    { key: 'model', label: 'Model', placeholder: 'Galaxy A55' },
    { key: 'spec', label: 'Thông số / Công suất', placeholder: '8GB/256GB', chip: true },
    { key: 'warranty', label: 'Bảo hành', placeholder: '12 tháng', chip: true },
    { key: 'condition', label: 'Tình trạng', placeholder: 'Mới 100% / Like new' },
  ],
  sizeOptions: [],
  orderModes: [
    { id: 'delivery', label: 'Giao hàng tận nơi', needsAddress: true },
    { id: 'pickup', label: 'Nhận tại cửa hàng', needsAddress: false },
    { id: 'install', label: 'Giao & lắp đặt tận nơi', needsAddress: true },
  ],
  itemNote: false,
  itemNoteLabel: '',
  addLabel: 'Thêm vào giỏ',
  productWord: 'sản phẩm',
}

const NOI_THAT: TemplateDef = {
  id: 'noi-that',
  category: 'noi-that',
  name: 'Nội thất',
  tagline: 'Ấm cúng, tông be gỗ, ảnh không gian lớn, ghi rõ kích thước',
  icon: '🛋️',
  palette: { primary: '#8b5e34', accent: '#d97706', bg: '#f7f3ee', surface: '#ffffff', text: '#2d2219', muted: '#7d6e60', border: '#e7ddd1' },
  dark: false,
  headingFont: "'Lora', 'Be Vietnam Pro', serif",
  bodyFont: BASE_FONT,
  radius: '8px',
  categories: ['Sofa', 'Bàn ghế', 'Giường tủ', 'Trang trí', 'Đèn'],
  categoryIcons: { 'Sofa': '🛋️', 'Bàn ghế': '🪑', 'Giường tủ': '🛏️', 'Trang trí': '🪴', 'Đèn': '💡' },
  heroTitle: 'Không gian sống của bạn, đẹp hơn mỗi ngày',
  heroSubtitle: 'Nội thất gia đình bền đẹp, giao và lắp đặt tận nhà, bảo hành dài hạn.',
  specFields: [
    { key: 'material', label: 'Chất liệu', placeholder: 'Gỗ sồi, vải bố', chip: true },
    { key: 'size', label: 'Kích thước', placeholder: '200 × 90 × 85 cm', chip: true },
    { key: 'color', label: 'Màu sắc', placeholder: 'Be, Xám' },
    { key: 'warranty', label: 'Bảo hành', placeholder: '24 tháng' },
  ],
  sizeOptions: [],
  orderModes: [
    { id: 'delivery', label: 'Giao hàng tận nơi', needsAddress: true },
    { id: 'install', label: 'Giao & lắp đặt tận nơi', needsAddress: true },
    { id: 'pickup', label: 'Nhận tại cửa hàng', needsAddress: false },
  ],
  itemNote: true,
  itemNoteLabel: 'Ghi chú (màu, kích thước theo yêu cầu...)',
  addLabel: 'Thêm vào giỏ',
  productWord: 'sản phẩm',
}

const BASES: TemplateDef[] = [...ORIGINALS, DIEN_TU, NOI_THAT]

type VariantDef = Pick<TemplateDef, 'id' | 'name' | 'tagline' | 'palette' | 'dark' | 'headingFont' | 'radius' | 'heroTitle' | 'heroSubtitle'> & Partial<TemplateDef>

function variant(category: CategoryId, v: VariantDef): TemplateDef {
  const base = BASES.find((t) => t.id === category)!
  return { ...base, ...v, category }
}

const VARIANTS: TemplateDef[] = [
  variant('xe-may', {
    id: 'xe-may-showroom',
    name: 'Xe máy – Showroom sáng',
    tagline: 'Sáng sủa, trắng + xanh dương, kiểu đại lý chính hãng',
    palette: { primary: '#1d4ed8', accent: '#dc2626', bg: '#f8fafc', surface: '#ffffff', text: '#0f172a', muted: '#64748b', border: '#e2e8f0' },
    dark: false,
    headingFont: "'Montserrat', 'Be Vietnam Pro', sans-serif",
    radius: '14px',
    heroTitle: 'Showroom xe chính hãng',
    heroSubtitle: 'Đủ dòng xe số, tay ga, côn tay. Lái thử miễn phí, trả góp 0% lãi suất.',
  }),
  variant('xe-may', {
    id: 'xe-may-the-thao',
    name: 'Xe máy – Thể thao tốc độ',
    tagline: 'Tối, xanh neon, góc cạnh như đường đua',
    palette: { primary: '#a3e635', accent: '#facc15', bg: '#050a0e', surface: '#0f1a20', text: '#ecfccb', muted: '#94a3b8', border: '#1f2f38' },
    dark: true,
    headingFont: "'Chakra Petch', 'Be Vietnam Pro', sans-serif",
    radius: '0px',
    heroTitle: 'Bứt tốc mọi cung đường',
    heroSubtitle: 'Côn tay, phân khối lớn, đồ chơi xe độ – thông số rõ, giá tốt cho dân mê tốc độ.',
  }),
  variant('xe-may', {
    id: 'xe-may-co-dien',
    name: 'Xe máy – Cổ điển',
    tagline: 'Hoài cổ, kem + xanh rêu, chữ có chân, chất xe xưa',
    palette: { primary: '#4d5b2a', accent: '#b45309', bg: '#f5efe1', surface: '#fffaf0', text: '#2f2a1d', muted: '#7a705b', border: '#e4d9c0' },
    dark: false,
    headingFont: "'Roboto Slab', 'Be Vietnam Pro', serif",
    radius: '4px',
    heroTitle: 'Xe xưa – Chất riêng',
    heroSubtitle: 'Cub, Vespa, Cub 50 và xe cổ phục chế, giấy tờ hợp lệ, bao test máy.',
  }),

  variant('do-choi', {
    id: 'do-choi-pastel',
    name: 'Đồ chơi – Pastel dịu nhẹ',
    tagline: 'Pastel tím hồng, bo tròn mềm mại, cho bé sơ sinh & mầm non',
    palette: { primary: '#a855f7', accent: '#2dd4bf', bg: '#faf5ff', surface: '#ffffff', text: '#3b0764', muted: '#7c6f8f', border: '#ead7fb' },
    dark: false,
    headingFont: "'Quicksand', 'Be Vietnam Pro', sans-serif",
    radius: '28px',
    heroTitle: 'Nhẹ nhàng cho bé từng ngày lớn',
    heroSubtitle: 'Đồ chơi an toàn, màu dịu mắt, phù hợp từng giai đoạn phát triển của bé.',
  }),
  variant('do-choi', {
    id: 'do-choi-vu-tru',
    name: 'Đồ chơi – Vũ trụ phiêu lưu',
    tagline: 'Nền tối xanh đêm, vàng sao, cho bé mê khám phá',
    palette: { primary: '#facc15', accent: '#38bdf8', bg: '#0b1026', surface: '#151c3d', text: '#eef2ff', muted: '#a5b4fc', border: '#26306b' },
    dark: true,
    headingFont: "'Lexend', 'Be Vietnam Pro', sans-serif",
    radius: '16px',
    heroTitle: 'Bay vào thế giới khám phá',
    heroSubtitle: 'Lắp ráp, robot, khoa học STEM – nuôi dưỡng trí tò mò của bé.',
  }),
  variant('do-choi', {
    id: 'do-choi-go',
    name: 'Đồ chơi – Gỗ Montessori',
    tagline: 'Mộc mạc, màu gỗ + xanh lá, đồ chơi giáo dục tự nhiên',
    palette: { primary: '#15803d', accent: '#ea580c', bg: '#f6f1e7', surface: '#fffdf8', text: '#2b2418', muted: '#7b6f5b', border: '#e6dcc8' },
    dark: false,
    headingFont: "'Lora', 'Be Vietnam Pro', serif",
    radius: '10px',
    heroTitle: 'Đồ chơi gỗ – Học mà chơi',
    heroSubtitle: 'Gỗ tự nhiên, sơn gốc nước, theo phương pháp Montessori.',
  }),

  variant('quan-ao', {
    id: 'quan-ao-street',
    name: 'Quần áo – Streetwear',
    tagline: 'Nền đen, chữ đậm hẹp, điểm nhấn cam neon – chất đường phố',
    palette: { primary: '#f97316', accent: '#22d3ee', bg: '#0a0a0a', surface: '#161616', text: '#fafafa', muted: '#a3a3a3', border: '#2a2a2a' },
    dark: true,
    headingFont: "'Barlow Condensed', 'Be Vietnam Pro', sans-serif",
    radius: '4px',
    heroTitle: 'DROP MỚI – SỐ LƯỢNG CÓ HẠN',
    heroSubtitle: 'Oversize, hoodie, cargo – local brand chất, giao nhanh toàn quốc.',
  }),
  variant('quan-ao', {
    id: 'quan-ao-nu-tinh',
    name: 'Quần áo – Nữ tính',
    tagline: 'Hồng phấn, chữ thanh mảnh, bo góc mềm cho thời trang nữ',
    palette: { primary: '#be185d', accent: '#d4a373', bg: '#fff5f7', surface: '#ffffff', text: '#4a1d2f', muted: '#8f6b78', border: '#f6d5df' },
    dark: false,
    headingFont: "'Cormorant Garamond', 'Be Vietnam Pro', serif",
    radius: '20px',
    heroTitle: 'Dịu dàng là phong cách',
    heroSubtitle: 'Váy đầm, áo kiểu, set đồ đi làm – chất liệu mềm, form tôn dáng.',
  }),
  variant('quan-ao', {
    id: 'quan-ao-tre-trung',
    name: 'Quần áo – Trẻ trung năng động',
    tagline: 'Xanh dương + vàng, sáng khoẻ, cho học sinh sinh viên',
    palette: { primary: '#0284c7', accent: '#eab308', bg: '#f0f9ff', surface: '#ffffff', text: '#0c2a43', muted: '#5b7489', border: '#cfe8f7' },
    dark: false,
    headingFont: "'Josefin Sans', 'Be Vietnam Pro', sans-serif",
    radius: '12px',
    heroTitle: 'Mặc đẹp mỗi ngày, giá sinh viên',
    heroSubtitle: 'Áo thun, sơ mi, quần short năng động – mua 2 giảm thêm 10%.',
  }),

  variant('cafe', {
    id: 'cafe-dem',
    name: 'Cafe – Quán đêm acoustic',
    tagline: 'Tối espresso + vàng đồng, sang và trầm cho quán về đêm',
    palette: { primary: '#d4a24c', accent: '#e76f51', bg: '#16100c', surface: '#231a14', text: '#f5e9d7', muted: '#b8a48c', border: '#3a2c22' },
    dark: true,
    headingFont: "'Prata', 'Be Vietnam Pro', serif",
    radius: '8px',
    heroTitle: 'Cà phê, nhạc mộc và đêm dài',
    heroSubtitle: 'Acoustic mỗi tối thứ 6 – thứ 7. Đặt bàn trước để có chỗ đẹp.',
  }),
  variant('cafe', {
    id: 'cafe-san-vuon',
    name: 'Cafe – Sân vườn xanh',
    tagline: 'Xanh lá dịu, thoáng mát, hợp quán sân vườn & trà',
    palette: { primary: '#3f7d58', accent: '#e9a23b', bg: '#f1f6ef', surface: '#ffffff', text: '#1f3326', muted: '#68806f', border: '#d6e5d3' },
    dark: false,
    headingFont: "'Merriweather', 'Be Vietnam Pro', serif",
    radius: '20px',
    heroTitle: 'Giữa phố có một khu vườn',
    heroSubtitle: 'Cà phê, trà thảo mộc và bánh nhà làm dưới tán cây xanh.',
  }),
  variant('cafe', {
    id: 'cafe-toi-gian',
    name: 'Cafe – Tối giản',
    tagline: 'Trắng xám, góc vuông, tối giản kiểu specialty coffee',
    palette: { primary: '#262626', accent: '#c2410c', bg: '#fafafa', surface: '#ffffff', text: '#171717', muted: '#737373', border: '#e5e5e5' },
    dark: false,
    headingFont: "'Space Grotesk', 'Be Vietnam Pro', sans-serif",
    radius: '0px',
    heroTitle: 'Specialty coffee. Không cầu kỳ.',
    heroSubtitle: 'Hạt arabica rang mới mỗi tuần, pour-over và espresso chuẩn vị.',
  }),

  variant('tap-hoa', {
    id: 'tap-hoa-sieu-thi',
    name: 'Tạp hoá – Siêu thị mini',
    tagline: 'Đỏ + vàng nổi bật, khuyến mãi rõ, kiểu siêu thị',
    palette: { primary: '#dc2626', accent: '#facc15', bg: '#fff7f5', surface: '#ffffff', text: '#1f1414', muted: '#7a6565', border: '#f4d9d4' },
    dark: false,
    headingFont: "'Montserrat', 'Be Vietnam Pro', sans-serif",
    radius: '6px',
    heroTitle: 'Siêu thị mini – Giá tốt mỗi ngày',
    heroSubtitle: 'Hàng ngàn mặt hàng, khuyến mãi mỗi tuần, giao 2 giờ trong khu vực.',
  }),
  variant('tap-hoa', {
    id: 'tap-hoa-sach',
    name: 'Tạp hoá – Thực phẩm sạch',
    tagline: 'Xanh lá + nâu đất, thân thiện, cho cửa hàng organic',
    palette: { primary: '#4d7c0f', accent: '#b45309', bg: '#f7faf2', surface: '#ffffff', text: '#1c2a12', muted: '#6b7a5e', border: '#dfe9d0' },
    dark: false,
    headingFont: "'Nunito', 'Be Vietnam Pro', sans-serif",
    radius: '16px',
    heroTitle: 'Thực phẩm sạch cho bữa cơm nhà',
    heroSubtitle: 'Rau củ VietGAP, gạo hữu cơ, đồ khô rõ nguồn gốc.',
  }),
  variant('tap-hoa', {
    id: 'tap-hoa-24h',
    name: 'Tạp hoá – Cửa hàng 24/7',
    tagline: 'Nền tối, xanh ngọc, nhanh gọn cho cửa hàng mở xuyên đêm',
    palette: { primary: '#14b8a6', accent: '#f472b6', bg: '#0f172a', surface: '#1e293b', text: '#f1f5f9', muted: '#94a3b8', border: '#334155' },
    dark: true,
    headingFont: "'Archivo', 'Be Vietnam Pro', sans-serif",
    radius: '4px',
    heroTitle: 'Mở cửa 24/7 – Cần là có',
    heroSubtitle: 'Đồ ăn nhanh, nước uống, đồ dùng cá nhân – giao trong 30 phút, kể cả nửa đêm.',
  }),

  variant('do-an', {
    id: 'do-an-quan-nhau',
    name: 'Đồ ăn – Quán nhậu đêm',
    tagline: 'Tối than + đỏ lửa, chữ đậm, cho quán nướng & nhậu',
    palette: { primary: '#ef4444', accent: '#f59e0b', bg: '#121212', surface: '#1e1e1e', text: '#fafafa', muted: '#a8a29e', border: '#2e2e2e' },
    dark: true,
    headingFont: "'Oswald', 'Be Vietnam Pro', sans-serif",
    radius: '8px',
    heroTitle: 'Nướng than hoa – Lai rai tới khuya',
    heroSubtitle: 'Hải sản, đồ nướng, lẩu – đặt trước bàn nhóm hoặc giao tận nơi.',
  }),
  variant('do-an', {
    id: 'do-an-healthy',
    name: 'Đồ ăn – Healthy xanh',
    tagline: 'Xanh chanh tươi mát, bo tròn, cho salad & eat clean',
    palette: { primary: '#65a30d', accent: '#f97316', bg: '#f7fdf0', surface: '#ffffff', text: '#1a2e05', muted: '#64748b', border: '#e2f2cf' },
    dark: false,
    headingFont: "'Quicksand', 'Be Vietnam Pro', sans-serif",
    radius: '24px',
    heroTitle: 'Ăn lành – Sống khoẻ',
    heroSubtitle: 'Salad, bowl, nước ép ít đường – có ghi rõ calo từng món.',
  }),
  variant('do-an', {
    id: 'do-an-com-nha',
    name: 'Đồ ăn – Cơm nhà truyền thống',
    tagline: 'Vàng rơm + nâu, chữ có chân, ấm cúng như bữa cơm nhà',
    palette: { primary: '#a16207', accent: '#b91c1c', bg: '#fdf8ec', surface: '#fffdf7', text: '#3a2a12', muted: '#80705a', border: '#eee2c6' },
    dark: false,
    headingFont: "'Lora', 'Be Vietnam Pro', serif",
    radius: '12px',
    heroTitle: 'Cơm nhà nấu – Vị mẹ nấu',
    heroSubtitle: 'Cơm phần, canh, món kho mỗi ngày một thực đơn. Đặt trước 10h có cơm trưa.',
  }),

  variant('dien-tu', {
    id: 'dien-tu-cong-nghe',
    name: 'Điện tử – Công nghệ tối',
    tagline: 'Nền tối, tím xanh neon, góc vuông – chất gaming & công nghệ',
    palette: { primary: '#8b5cf6', accent: '#22d3ee', bg: '#09090f', surface: '#14141f', text: '#f4f4f5', muted: '#a1a1aa', border: '#27273a' },
    dark: true,
    headingFont: "'Chakra Petch', 'Be Vietnam Pro', sans-serif",
    radius: '2px',
    heroTitle: 'Gear xịn – Hiệu năng đỉnh',
    heroSubtitle: 'Laptop gaming, PC, màn hình, phụ kiện – build cấu hình theo yêu cầu.',
  }),
  variant('dien-tu', {
    id: 'dien-tu-gia-dung',
    name: 'Điện tử – Điện máy gia dụng',
    tagline: 'Cam + xanh lá, rõ giá, kiểu siêu thị điện máy',
    palette: { primary: '#ea580c', accent: '#16a34a', bg: '#fff8f1', surface: '#ffffff', text: '#1f160d', muted: '#77685a', border: '#f6e0cb' },
    dark: false,
    headingFont: "'Montserrat', 'Be Vietnam Pro', sans-serif",
    radius: '8px',
    heroTitle: 'Điện máy gia đình – Giá tốt, lắp đặt miễn phí',
    heroSubtitle: 'Tivi, tủ lạnh, máy giặt, điều hoà chính hãng, trả góp 0%.',
  }),
  variant('dien-tu', {
    id: 'dien-tu-cao-cap',
    name: 'Điện tử – Cao cấp tối giản',
    tagline: 'Trắng xám bạc, chữ mảnh, bo tròn lớn kiểu cửa hàng cao cấp',
    palette: { primary: '#111827', accent: '#0ea5e9', bg: '#f5f5f7', surface: '#ffffff', text: '#1d1d1f', muted: '#6e6e73', border: '#e3e3e8' },
    dark: false,
    headingFont: "'Space Grotesk', 'Be Vietnam Pro', sans-serif",
    radius: '22px',
    heroTitle: 'Công nghệ tinh tế.',
    heroSubtitle: 'Điện thoại, máy tính bảng, tai nghe cao cấp – chính hãng, bảo hành 12–24 tháng.',
  }),

  variant('noi-that', {
    id: 'noi-that-bac-au',
    name: 'Nội thất – Bắc Âu tối giản',
    tagline: 'Trắng + xám xanh, góc vuông, phong cách Scandinavian',
    palette: { primary: '#334155', accent: '#c08457', bg: '#f8f8f6', surface: '#ffffff', text: '#1e293b', muted: '#6b7280', border: '#e5e5e0' },
    dark: false,
    headingFont: "'Josefin Sans', 'Be Vietnam Pro', sans-serif",
    radius: '0px',
    heroTitle: 'Ít mà chất – Nội thất Bắc Âu',
    heroSubtitle: 'Thiết kế tối giản, gỗ sáng màu, phù hợp căn hộ hiện đại.',
  }),
  variant('noi-that', {
    id: 'noi-that-go',
    name: 'Nội thất – Gỗ mộc',
    tagline: 'Nâu gỗ đậm + xanh rêu, chữ có chân, mộc mạc ấm áp',
    palette: { primary: '#6b3f1d', accent: '#4d7c0f', bg: '#f3ece2', surface: '#fbf7f1', text: '#2a1c10', muted: '#7d6a58', border: '#dfd1bf' },
    dark: false,
    headingFont: "'Roboto Slab', 'Be Vietnam Pro', serif",
    radius: '6px',
    heroTitle: 'Gỗ thật – Bền cả đời',
    heroSubtitle: 'Bàn ghế, giường tủ gỗ tự nhiên, nhận đóng theo kích thước nhà bạn.',
  }),
  variant('noi-that', {
    id: 'noi-that-sang-trong',
    name: 'Nội thất – Sang trọng',
    tagline: 'Nền tối xanh đêm + vàng đồng, cho nội thất cao cấp',
    palette: { primary: '#c9a227', accent: '#e5e7eb', bg: '#0e1116', surface: '#181c24', text: '#f3f1ea', muted: '#a3a3a3', border: '#2b303b' },
    dark: true,
    headingFont: "'Cormorant Garamond', 'Be Vietnam Pro', serif",
    radius: '14px',
    heroTitle: 'Đẳng cấp trong từng chi tiết',
    heroSubtitle: 'Sofa da, đèn chùm, bàn đá – thiết kế sang trọng, tư vấn tận nơi.',
  }),
]

export const CATEGORIES: { id: CategoryId; name: string; icon: string }[] = BASES.map((t) => ({ id: t.category, name: t.name, icon: t.icon }))

export const TEMPLATES: TemplateDef[] = CATEGORIES.flatMap((c) => [...BASES, ...VARIANTS].filter((t) => t.category === c.id))

export function getTemplate(id: string): TemplateDef {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0]
}

export function isTemplateId(id: string): id is TemplateId {
  return TEMPLATES.some((t) => t.id === id)
}

/** Trường `template` lưu id ngành hàng; mẫu cụ thể nằm ở `theme.variant`. */
export function storedTemplateId(id: TemplateId): StoredTemplateId {
  return getTemplate(id).category
}

/** Cửa hàng tạo trước khi rules cho phép 'dien-tu'/'noi-that' đã lưu các ngành này dưới id cũ. */
const LEGACY_STORED_AS: Partial<Record<CategoryId, StoredTemplateId>> = { 'dien-tu': 'tap-hoa', 'noi-that': 'quan-ao' }

/** Mẫu hiển thị của cửa hàng từ trường `template` đã lưu và `theme.variant`. */
export function resolveTemplateId(stored: string, variant?: string): TemplateId {
  if (variant && isTemplateId(variant)) {
    const category = getTemplate(variant).category
    if (category === stored || LEGACY_STORED_AS[category] === stored) return variant
  }
  return getTemplate(stored).id
}
