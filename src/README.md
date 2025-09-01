# เสน่ห์ข้าวมันไก่ POS System

ระบบขายหน้าร้านที่ครบครันสำหรับร้านอาหาร พัฒนาด้วย Next.js 14, TypeScript, Tailwind CSS และ Supabase

## ✨ Features หลัก

### 🛒 POS System
- เลือกประเภทออเดอร์ (นั่งทาน/กลับบ้าน/เดลิเวอรี่)
- เมนูมีรูปภาพและตัวเลือกเพิ่มเติม
- ตะกร้าสินค้าแบบ Real-time
- ส่งออเดอร์ไปครัวทันที

### 👨‍🍳 KDS (Kitchen Display System)
- แสดงออเดอร์แบบ Real-time
- แยกสถานี (ครัว/เครื่องดื่ม)
- อัปเดตสถานะ (รอทำ/กำลังทำ/เสร็จแล้ว)
- การแจ้งเตือนออเดอร์ใหม่

### 💰 Bills Management  
- ดูบิลแบบ Real-time
- ชำระเงิน (เงินสด/บัตร/โอนเงิน)
- พิมพ์ใบเสร็จ
- ติดตามสถานะการชำระ

### 📊 Manager Dashboard
- Dashboard แสดงสถิติยอดขาย
- จัดการเมนูและราคา
- ส่งออกรายงาน CSV
- เมนูยอดนิยม

### 🔐 User Management
- ระบบล็อกอิน PIN 4 หลัก
- บทบาทผู้ใช้ (POS/KDS/Manager)
- การจัดการสิทธิ์การเข้าใช้

### 📱 PWA Support
- ติดตั้งเป็นแอปได้
- ทำงานออฟไลน์
- Service Worker caching
- Push notifications

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone [repository-url]
cd sanae-pos
npm install
```

### 2. Setup Supabase
1. สร้าง Project ใน [Supabase](https://supabase.com)
2. รัน SQL scripts:
   - `SCHEMA.sql` - สร้างตารางและ functions
   - `SEED.sql` - ใส่ข้อมูลตัวอย่าง
3. สร้าง Storage bucket ชื่อ `menu-images`

### 3. Environment Variables
สร้างไฟล์ `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Development
```bash
npm run dev
```
เปิด [http://localhost:3000](http://localhost:3000)

## 🏗️ Deployment

### Vercel (Recommended)
1. Push code ไป GitHub
2. Connect repository ใน [Vercel](https://vercel.com)
3. ตั้งค่า Environment Variables ใน Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Auto-Deploy Setup
- เมื่อ push ไป `main` branch จะ deploy production
- เมื่อ push ไป branch อื่น จะ deploy preview

## 🎯 User Guide

### PIN Codes (Demo)
- `1234` - POS Staff
- `2345` - POS Staff 2  
- `3456` - Kitchen Staff
- `4567` - Kitchen Staff 2
- `9999` - Manager (ทุกบทบาท)

### Roles & Permissions
| Feature | POS | KDS | Manager |
|---------|-----|-----|---------|
| รับออเดอร์ | ✅ | ❌ | ✅ |
| KDS ครัว | ❌ | ✅ | ✅ |
| KDS เครื่องดื่ม | ❌ | ✅ | ✅ |
| จัดการบิล | ✅ | ❌ | ✅ |
| รายงาน | ❌ | ❌ | ✅ |

### Workflow
1. **เข้าสู่ระบบ** → ใส่ PIN → เลือกบทบาท
2. **รับออเดอร์** → เลือกประเภท → เลือกเมนู → ส่งครัว
3. **ปรุงอาหาร** → ดู KDS → อัปเดตสถานะ
4. **ชำระเงิน** → ตรวจสอบบิล → เลือกวิธีชำระ → พิมพ์ใบเสร็จ

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **SweetAlert2** - Beautiful alerts
- **Lucide React** - Icons

### Backend
- **Supabase** - Database, Auth, Realtime, Storage
- **PostgreSQL** - Database with triggers
- **Row Level Security** - Data protection

### PWA
- **Service Worker** - Caching & offline
- **Web App Manifest** - Installable app
- **IndexedDB** - Offline storage

## 📁 Project Structure

```
sanae-pos/
├── app/                    # Next.js App Router
│   ├── login/             # Login page
│   ├── order-type/        # Order type selection
│   ├── pos/               # POS interface
│   ├── kds/
│   │   ├── kitchen/       # Kitchen display
│   │   └── tea/          # Beverage display
│   ├── bills/            # Bills management
│   ├── manager/          # Manager dashboard
│   └── layout.tsx        # Root layout
├── components/           # Reusable components
│   ├── AppShell.tsx     # Navigation shell
│   ├── MenuCard.tsx     # Menu item card
│   └── KdsTicket.tsx    # KDS ticket display
├── lib/                 # Utilities
│   ├── supabase.ts      # Supabase client
│   ├── utils.ts         # Helper functions
│   └── idb.ts           # IndexedDB helpers
├── public/             # Static files
│   ├── sw.js           # Service worker
│   └── manifest.webmanifest
├── styles/
│   └── globals.css     # Global styles
├── SCHEMA.sql          # Database schema
├── SEED.sql            # Sample data
└── README.md
```

## 🔧 Customization

### เพิ่มเมนูใหม่
1. เข้าหน้า Manager → จัดการเมนู
2. คลิก "เพิ่มเมนู"
3. กรอกข้อมูลและอัปโหลดรูป

### เปลี่ยนสีแบรนด์
แก้ไขใน `tailwind.config.js`:
```js
colors: {
  brand: {
    primary: '#761F1C',  // สีหลัก
    light: '#8B342F',
    dark: '#5A1813',
  }
}
```

### เพิ่มการชำระเงินแบบใหม่
แก้ไขใน `/app/bills/page.tsx`:
1. เพิ่ม payment method ใน enum
2. เพิ่มปุ่มในส่วน UI
3. อัปเดต `getPaymentMethodLabel()`

## 📱 PWA Installation

### iOS
1. เปิดเว็บใน Safari
2. กดปุ่ม Share
3. เลือก "Add to Home Screen"

### Android
1. เปิดเว็บใน Chrome
2. กด Menu (3 จุด)
3. เลือก "Add to Home screen"

### Desktop
1. เปิดเว็บใน Chrome/Edge
2. คลิกไอคอน + ใน address bar
3. เลือก "Install"

## 🔒 Security

### Database Security
- Row Level Security (RLS) enabled
- API keys เก็บใน Environment Variables
- Input validation และ sanitization

### Best Practices  
- ใช้ `NEXT_PUBLIC_` สำหรับ client-side เท่านั้น
- อย่าเปิดเผย `SERVICE_ROLE_KEY`
- Enable 2FA ใน Supabase dashboard

## 🐛 Troubleshooting

### ไม่สามารถเชื่อมต่อ Supabase
1. ตรวจสอบ Environment Variables
2. ตรวจสอบ URL และ API Key ใน Supabase dashboard
3. ตรวจสอบ Network/Firewall

### Real-time ไม่ทำงาน
1. ตรวจสอบ Supabase subscription limit
2. ตรวจสอบ RLS policies
3. เปิด Network tab ใน DevTools

### PWA ไม่ติดตั้งได้
1. ตรวจสอบ HTTPS (จำเป็นสำหรับ PWA)
2. ตรวจสอบ `manifest.webmanifest`
3. ตรวจสอบ Service Worker registration

## 📞 Support

สำหรับคำถามหรือข้อเสนอแนะ:
- เปิด GitHub Issue
- ติดต่อทีมพัฒนา

## 📄 License

MIT License - ใช้งานได้อย่างอิสระ

---

**Built with ❤️ for Thai restaurants**

ระบบนี้ออกแบบมาเพื่อร้านอาหารไทยโดยเฉพาะ พร้อมใช้งานจริงและขยายได้ตามความต้องการ