"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const [clinicName, setClinicName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: clinicName,
          clinic_name: clinicName
        }
      }
    });

    if (error) {
      setErrorMsg("Hata: " + (error.message || "Kayıt sırasında bir problem oluştu."));
      setLoading(false);
    } else {
      // Çıkış yapalım ki otomatik login olup sisteme düşmesin (çünkü onay bekliyor)
      await supabase.auth.signOut().catch(() => {});
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-emerald-100">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900">Klinik Yönetim Sistemi</CardTitle>
          <CardDescription className="font-medium text-slate-500">
            Yeni Klinik Hesabı Oluşturun
          </CardDescription>
        </CardHeader>
        
        {success ? (
          <CardContent className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Kayıt Başarılı!</h3>
            <p className="text-sm text-slate-500 mb-6">Hesabınız başarıyla oluşturuldu. Profiliniz yönetici tarafından incelenmektedir, onaylandıktan sonra sisteme giriş yapabilirsiniz.</p>
            <Button asChild className="w-full h-12 text-base font-bold bg-[#0a3d34] hover:bg-[#072b25]">
              <Link href="/login">Giriş Yap</Link>
            </Button>
          </CardContent>
        ) : (
          <>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Klinik Adı / Ünvan</Label>
                  <Input
                    id="clinicName"
                    type="text"
                    placeholder="Uzm. Dr. ..."
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    required
                    className="h-12 focus-visible:ring-emerald-700"
                  />
                </div>
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
                  {loading ? "Hesap Oluşturuluyor..." : "Hesap Oluştur"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center border-t py-6 bg-slate-50/50 rounded-b-xl border-emerald-50">
              <p className="text-sm text-slate-500">
                Zaten hesabınız var mı?{" "}
                <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline">
                  Giriş Yapın
                </Link>
              </p>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
