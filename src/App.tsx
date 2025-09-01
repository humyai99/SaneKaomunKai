import React from 'react'
import { ChefHat } from 'lucide-react'

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#761F1C] to-[#5A1813] flex items-center justify-center p-4">
      <div className="text-center">
        {/* Logo */}
        <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <ChefHat className="h-12 w-12 text-[#761F1C]" />
        </div>
        
        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-4">
          เสน่ห์ข้าวมันไก่
        </h1>
        <h2 className="text-xl text-white/90 mb-2">
          Sanae Hainanese Chicken Rice
        </h2>
        <p className="text-white/70 mb-8">
          ระบบขายหน้าร้าน (POS System)
        </p>

        {/* Getting Started Instructions */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-white mb-4">วิธีเริ่มใช้งาน</h3>
          <div className="space-y-3 text-left">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <p className="text-white/90 text-sm">
                ตั้งค่า Supabase และรัน SCHEMA.sql + SEED.sql
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <p className="text-white/90 text-sm">
                เพิ่ม Environment Variables ใน Vercel
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <p className="text-white/90 text-sm">
                Deploy และเริ่มใช้งาน
              </p>
            </div>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-md mx-auto">
          <h4 className="text-white font-medium mb-3">รหัส PIN ทดสอบ</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="text-center">
              <div className="font-mono bg-white/20 text-white px-3 py-2 rounded-lg">1234</div>
              <p className="text-white/70 mt-1">POS</p>
            </div>
            <div className="text-center">
              <div className="font-mono bg-white/20 text-white px-3 py-2 rounded-lg">3456</div>
              <p className="text-white/70 mt-1">KDS</p>
            </div>
            <div className="text-center col-span-2">
              <div className="font-mono bg-white/20 text-white px-3 py-2 rounded-lg">9999</div>
              <p className="text-white/70 mt-1">Manager</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/20">
          <p className="text-white/60 text-sm">
            Built with Next.js 14 + Supabase + Tailwind CSS
          </p>
          <p className="text-white/40 text-xs mt-1">
            Ready for production deployment
          </p>
        </div>
      </div>
    </div>
  );
}