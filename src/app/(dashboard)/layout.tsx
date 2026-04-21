import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-slate-50 overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 lg:ml-[280px] p-5 md:p-8 pt-20 lg:pt-8 w-full max-w-[1600px] mx-auto min-h-screen transition-all">
        {children}
      </main>
    </div>
  );
}
