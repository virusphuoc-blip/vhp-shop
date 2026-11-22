import type { Product, TemplateId } from '../lib/types'

type Sample = Pick<Product, 'name' | 'price' | 'oldPrice' | 'stock' | 'description' | 'category'> & {
  specs?: Record<string, string>
  sizes?: string[]
}

const S: Record<TemplateId, Sample[]> = {
  'xe-may': [
    { name: 'Honda Vision 2024 bản đặc biệt', price: 36500000, oldPrice: 38000000, stock: 3, category: 'Xe tay ga', description: 'Xe mới 100%, bảo hành chính hãng 3 năm. Hỗ trợ đăng ký biển số.', specs: { brand: 'Honda', cc: '110', year: '2024', odo: '0', color: 'Đỏ đen', condition: 'Mới 100%' } },
    { name: 'Yamaha Exciter 155 VVA', price: 47900000, oldPrice: 0, stock: 2, category: 'Xe côn tay', description: 'Động cơ VVA mạnh mẽ, phanh ABS, côn tay 6 số.', specs: { brand: 'Yamaha', cc: '155', year: '2024', odo: '0', color: 'Xanh GP', condition: 'Mới 100%' } },
    { name: 'Honda Wave Alpha cũ', price: 12500000, oldPrice: 14000000, stock: 1, category: 'Xe số', description: 'Xe lướt chính chủ, máy zin, giấy tờ đầy đủ.', specs: { brand: 'Honda', cc: '110', year: '2021', odo: '12.000', color: 'Trắng', condition: 'Đã qua sử dụng' } },
    { name: 'Honda SH 160i ABS', price: 92000000, oldPrice: 0, stock: 1, category: 'Xe tay ga', description: 'Phiên bản ABS, smartkey, cốp rộng.', specs: { brand: 'Honda', cc: '160', year: '2023', odo: '3.500', color: 'Đen nhám', condition: 'Đã qua sử dụng' } },
    { name: 'VinFast Evo200', price: 22000000, oldPrice: 24000000, stock: 4, category: 'Xe điện', description: 'Đi 200km/lần sạc, không cần bằng lái.', specs: { brand: 'VinFast', cc: 'Điện', year: '2024', odo: '0', color: 'Xám', condition: 'Mới 100%' } },
    { name: 'Nhớt Motul 300V 1L', price: 320000, oldPrice: 350000, stock: 30, category: 'Phụ tùng', description: 'Nhớt tổng hợp cao cấp cho xe côn tay.', specs: { brand: 'Motul' } },
  ],
  'do-choi': [
    { name: 'Bộ xếp hình gỗ 100 chi tiết', price: 189000, oldPrice: 250000, stock: 25, category: 'Giáo dục', description: 'Gỗ tự nhiên, sơn an toàn, giúp bé phát triển tư duy.', specs: { age: '3+ tuổi', material: 'Gỗ thông' } },
    { name: 'Lego Classic hộp sáng tạo', price: 599000, oldPrice: 0, stock: 10, category: 'Lắp ráp', description: '484 mảnh ghép nhiều màu sắc.', specs: { age: '4+ tuổi', brand: 'Lego' } },
    { name: 'Búp bê công chúa tóc dài', price: 245000, oldPrice: 290000, stock: 15, category: 'Búp bê', description: 'Kèm váy thay và phụ kiện chải tóc.', specs: { age: '3+ tuổi' } },
    { name: 'Xe ô tô điều khiển từ xa', price: 359000, oldPrice: 420000, stock: 8, category: 'Xe đồ chơi', description: 'Sạc USB, chạy 20 phút, chống va đập.', specs: { age: '6+ tuổi' } },
    { name: 'Xúc xắc lục lạc cho bé', price: 79000, oldPrice: 0, stock: 40, category: 'Sơ sinh', description: 'Nhựa nguyên sinh, không BPA.', specs: { age: '0–12 tháng' } },
    { name: 'Diều vải hình cá chép', price: 95000, oldPrice: 120000, stock: 20, category: 'Ngoài trời', description: 'Kèm 100m dây, dễ bay.', specs: { age: '5+ tuổi' } },
  ],
  'quan-ao': [
    { name: 'Áo thun cotton basic', price: 159000, oldPrice: 199000, stock: 50, category: 'Áo', description: 'Cotton 100% co giãn 4 chiều, thấm hút tốt.', specs: { material: 'Cotton 100%', color: 'Trắng, Đen, Be', fit: 'Regular' }, sizes: ['S', 'M', 'L', 'XL'] },
    { name: 'Quần jean ống suông', price: 389000, oldPrice: 0, stock: 30, category: 'Quần', description: 'Denim dày dặn, wash nhẹ, ống suông trẻ trung.', specs: { material: 'Denim', color: 'Xanh nhạt' }, sizes: ['S', 'M', 'L'] },
    { name: 'Đầm midi hoa nhí', price: 459000, oldPrice: 520000, stock: 12, category: 'Váy đầm', description: 'Vải voan hai lớp, tay phồng nữ tính.', specs: { material: 'Voan', color: 'Hoa nhí xanh' }, sizes: ['S', 'M', 'L'] },
    { name: 'Áo khoác blazer form rộng', price: 690000, oldPrice: 790000, stock: 8, category: 'Áo khoác', description: 'Đứng form, lót lụa, phù hợp đi làm.', specs: { material: 'Tuyết mưa', color: 'Be, Đen' }, sizes: ['M', 'L', 'XL'] },
    { name: 'Sơ mi linen tay ngắn', price: 299000, oldPrice: 0, stock: 25, category: 'Áo', description: 'Linen thoáng mát cho mùa hè.', specs: { material: 'Linen', color: 'Kem' }, sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
    { name: 'Túi tote canvas', price: 129000, oldPrice: 159000, stock: 40, category: 'Phụ kiện', description: 'Canvas dày, có ngăn khoá kéo.', specs: { material: 'Canvas' } },
  ],
  cafe: [
    { name: 'Cà phê sữa đá', price: 29000, oldPrice: 0, stock: 999, category: 'Cà phê', description: 'Robusta rang mộc pha phin, sữa đặc béo ngậy.', specs: { volume: '350ml' }, sizes: ['M', 'L'] },
    { name: 'Bạc xỉu', price: 32000, oldPrice: 0, stock: 999, category: 'Cà phê', description: 'Nhiều sữa, ít cà phê, thơm dịu.', specs: { volume: '350ml' }, sizes: ['M', 'L'] },
    { name: 'Cold brew cam sả', price: 45000, oldPrice: 49000, stock: 999, category: 'Cà phê', description: 'Ủ lạnh 18 giờ, thêm cam tươi và sả.', specs: { volume: '400ml' } },
    { name: 'Trà đào cam sả', price: 39000, oldPrice: 0, stock: 999, category: 'Trà', description: 'Trà đen, đào miếng, cam, sả.', specs: { volume: '500ml' }, sizes: ['M', 'L'] },
    { name: 'Matcha đá xay', price: 49000, oldPrice: 55000, stock: 999, category: 'Đá xay', description: 'Matcha Nhật, kem tươi.', specs: { volume: '450ml' } },
    { name: 'Bánh croissant bơ', price: 35000, oldPrice: 0, stock: 20, category: 'Bánh ngọt', description: 'Nướng mới mỗi sáng.' },
  ],
  'tap-hoa': [
    { name: 'Gạo ST25 túi 5kg', price: 185000, oldPrice: 199000, stock: 40, category: 'Gạo & ngũ cốc', description: 'Gạo thơm Sóc Trăng, dẻo mềm.', specs: { unit: 'túi 5kg', brand: 'ST25' } },
    { name: 'Mì Hảo Hảo tôm chua cay (thùng 30 gói)', price: 118000, oldPrice: 0, stock: 25, category: 'Mì & đồ khô', description: 'Thùng 30 gói x 75g.', specs: { unit: 'thùng', brand: 'Acecook' } },
    { name: 'Nước mắm Nam Ngư 750ml', price: 42000, oldPrice: 45000, stock: 60, category: 'Gia vị', description: 'Nước mắm cá cơm.', specs: { unit: 'chai', brand: 'Chin-su' } },
    { name: 'Dầu ăn Simply 1L', price: 59000, oldPrice: 0, stock: 35, category: 'Dầu ăn', description: 'Dầu đậu nành nguyên chất.', specs: { unit: 'chai 1L', brand: 'Simply' } },
    { name: 'Sữa tươi Vinamilk 1L', price: 36000, oldPrice: 38000, stock: 50, category: 'Sữa', description: 'Sữa tươi tiệt trùng có đường.', specs: { unit: 'hộp 1L', brand: 'Vinamilk' } },
    { name: 'Trứng gà ta (vỉ 10 quả)', price: 38000, oldPrice: 0, stock: 30, category: 'Trứng & thịt', description: 'Trứng gà ta tươi mỗi ngày.', specs: { unit: 'vỉ 10' } },
  ],
  'do-an': [
    { name: 'Phở bò tái nạm', price: 55000, oldPrice: 0, stock: 100, category: 'Bún & phở', description: 'Nước dùng ninh xương 12 tiếng, bò tươi.', specs: { portion: '1 người', prep: '10 phút' } },
    { name: 'Cơm tấm sườn bì chả', price: 49000, oldPrice: 55000, stock: 100, category: 'Cơm', description: 'Sườn nướng than hoa, bì, chả trứng.', specs: { portion: '1 người', prep: '12 phút' } },
    { name: 'Bún chả Hà Nội', price: 52000, oldPrice: 0, stock: 100, category: 'Bún & phở', description: 'Chả nướng, nem rán, nước chấm chua ngọt.', specs: { portion: '1 người' } },
    { name: 'Gà rán giòn (3 miếng)', price: 79000, oldPrice: 89000, stock: 50, category: 'Món chính', description: 'Giòn rụm, sốt mật ong cay.', specs: { portion: '1–2 người', prep: '15 phút' } },
    { name: 'Combo gia đình 4 người', price: 299000, oldPrice: 350000, stock: 20, category: 'Combo', description: '4 phần cơm, 1 gà rán, 4 nước.', specs: { portion: '4 người', prep: '25 phút' } },
    { name: 'Trà tắc', price: 15000, oldPrice: 0, stock: 200, category: 'Đồ uống', description: 'Mát lạnh, giải nhiệt.', specs: { portion: '500ml' } },
  ],
}

export function sampleProducts(template: TemplateId): Omit<Product, 'id'>[] {
  return S[template].map((s) => ({
    name: s.name,
    price: s.price,
    oldPrice: s.oldPrice,
    stock: s.stock,
    description: s.description,
    category: s.category,
    images: [],
    thumb: '',
    uploadCount: 0,
    specs: s.specs || {},
    sizes: s.sizes || [],
    active: true,
  }))
}
