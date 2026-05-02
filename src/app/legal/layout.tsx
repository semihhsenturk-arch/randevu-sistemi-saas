import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#0a3d34] rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <CalendarDays className="text-white w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-[#0a3d34]">BiCalendar</span>
          </Link>
          <Link 
            href="/" 
            className="text-sm font-bold text-slate-500 hover:text-[#0a3d34] flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Ana Sayfaya Dön
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 md:p-16">
          {children}
        </div>
      </main>

      {/* Footer Simple */}
      <footer className="max-w-4xl mx-auto px-6 pb-12 text-center">
        <p className="text-xs text-slate-400">
          © 2026 BiCalendar | Klinik Yönetim Sistemi. Tüm hakları saklıdır.
        </p>
      </footer>
    </div>
  );
}
