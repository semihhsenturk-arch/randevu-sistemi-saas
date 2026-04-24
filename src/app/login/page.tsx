"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg("Hata: " + error.message);
      setLoading(false);
    } else {
      // Profil onayı kontrolü
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("is_approved")
        .eq("id", data.user?.id)
        .single();

      if (pErr || !profile || profile.is_approved === false) {
        await supabase.auth.signOut().catch(() => {});
        setErrorMsg(!profile ? "Giriş başarısız. Profiliniz başlatılamadı." : "Hesabınız inceleniyor. Henüz yönetici tarafından onaylanmadı.");
        setLoading(false);
        return;
      }

      router.replace("/takvim");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative">
      <Link 
        href="/" 
        className="absolute top-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-700 transition-colors md:left-6 left-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Ana Sayfaya Dön
      </Link>
      <Card className="w-full max-w-md shadow-lg border-emerald-100">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-crosshair">
              <circle cx="12" cy="12" r="10" />
              <line x1="22" x2="18" y1="12" y2="12" />
              <line x1="6" x2="2" y1="12" y2="12" />
              <line x1="12" x2="12" y1="6" y2="2" />
              <line x1="12" x2="12" y1="22" y2="18" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900">Klinik Yönetim Sistemi</CardTitle>
          <CardDescription className="font-medium text-slate-500">
            Klinik Yönetim Sistemine Giriş Yapın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta Adresi</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@klinik.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 focus-visible:ring-emerald-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 focus-visible:ring-emerald-700"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold bg-[#0a3d34] hover:bg-[#072b25]">
              {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t py-6 bg-slate-50/50 rounded-b-xl border-emerald-50">
          <p className="text-sm text-slate-500">
            Hesabınız yok mu?{" "}
            <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline">
              Kayıt Olun
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
