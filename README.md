# VHP Shop

Dịch vụ tạo website bán hàng cho khách: mỗi khách tự đăng ký, chọn 1 trong 32 mẫu thuộc 8 ngành hàng (Xe máy, Đồ chơi, Quần áo, Cafe, Tạp hoá, Đồ ăn, Điện tử, Nội thất – mỗi ngành 4 mẫu) và có cửa hàng riêng tại `ten-cua-hang.vhphuoc.shop`.

React + Vite + TypeScript + Tailwind, Firebase Auth + Firestore (gói Spark miễn phí, không dùng Cloud Storage).

## Chạy local

```bash
npm install
cp .env.example .env.local   # điền config Firebase
npm run dev
```

Thử với Firebase Emulator (không cần project thật):

```bash
# .env.emulator.local
VITE_FIREBASE_API_KEY=demo-key
VITE_FIREBASE_PROJECT_ID=demo-vhp-shop
VITE_FIREBASE_AUTH_DOMAIN=demo-vhp-shop.firebaseapp.com
VITE_FIREBASE_EMULATOR=1

npm run emulators                  # terminal 1
npx vite --mode emulator           # terminal 2
```

## Kiểm tra

```bash
npm run lint        # oxlint
npm test            # unit test (slug, VietQR, mã giảm giá, host, DNS, Zalo)
npm run test:rules  # test Firestore rules trên emulator (cần Java 21 + firebase-tools)
npm run build
```

## Đường dẫn

| Đường dẫn | Nội dung |
|---|---|
| `/` | Trang giới thiệu nền tảng |
| `/dang-ky`, `/dang-nhap` | Đăng ký / đăng nhập (Email + Google) |
| `/tao-cua-hang` | Tạo cửa hàng |
| `/quan-ly`, `/quan-ly/:storeId` | Quản trị cửa hàng của khách |
| `/quan-tri` | Quản trị nền tảng (chỉ Google virusphuoc@gmail.com) |
| `/mau/:templateId` | Xem thử mẫu (dữ liệu mẫu) |
| `/s/:slug` | Cửa hàng theo đường dẫn (khi chưa có wildcard DNS) |
| `https://<slug>.vhphuoc.shop` | Cửa hàng theo tên miền phụ |

## Hosting

Bản build là SPA tĩnh (`dist/`). `vercel.json` cho Vercel, `public/_headers` + fallback SPA cho Cloudflare Pages — đổi hosting chỉ cần đổi biến môi trường, không sửa code.

`firestore.rules` nằm trong repo, chủ sở hữu duyệt rồi tự đăng (`firebase deploy --only firestore:rules`).

---

© 2026 VH Phước. Mọi nội dung thuộc về VH Phước.
