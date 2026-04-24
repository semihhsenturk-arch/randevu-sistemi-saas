"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserProfile } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { getCacheSync, CACHE_KEYS } from "@/hooks/use-database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck, Zap, Star, CreditCard, Mail, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminUsersPage() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [userToReject, setUserToReject] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!profile || profile.role !== 'admin') {
        router.push('/dashboard');
      } else {
        // Load from cache first
        const cached = getCacheSync<UserProfile[]>(CACHE_KEYS.ADMIN_USERS);
        if (cached) setUsers(cached);
        
        fetchUsers();
      }
    }
  }, [profile, isLoading, router]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUsers(data as UserProfile[]);
        // Update cache
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEYS.ADMIN_USERS, JSON.stringify(data));
        }
      }
    } catch (e) {
      console.error("Admin fetch users failed:", e);
    }
  };

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: !currentStatus })
      .eq('id', id);

    if (!error) {
      const updatedUsers = users.map(u => u.id === id ? { ...u, is_approved: !currentStatus } : u);
      setUsers(updatedUsers);
      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEYS.ADMIN_USERS, JSON.stringify(updatedUsers));
      }
      toast.success(currentStatus ? "Yetki alındı." : "Kullanıcı onaylandı.");
    } else {
      toast.error("Durum güncellenirken bir hata oluştu.");
    }
  };

  const updateUserPlan = async (id: string, newPlan: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ plan: newPlan })
      .eq('id', id);

    if (!error) {
      const updatedUsers = users.map(u => u.id === id ? { ...u, plan: newPlan as any } : u);
      setUsers(updatedUsers);
      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEYS.ADMIN_USERS, JSON.stringify(updatedUsers));
      }
      toast.success("Hizmet paketi güncellendi.");
    } else {
      toast.error("Paket güncellenirken bir hata oluştu.");
    }
  };

  const confirmReject = async () => {
    if (!userToReject) return;
    setIsDeleting(true);
    
    // Profili sildiğimizde kişi bir daha asla giriş yapamaz.
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userToReject.id);

    if (!error) {
      setUsers(users.filter(u => u.id !== userToReject.id));
      setUserToReject(null);
    } else {
      alert("Kullanıcı reddedilirken bir hata oluştu.");
    }
    setIsDeleting(false);
  };

  const getPaymentBadge = (status?: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <CreditCard className="w-3 h-3" />
            Ödendi
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" />
            Beklemede
          </span>
        );
    }
  };

  const getBillingBadge = (cycle?: string) => {
    if (cycle === "yearly") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
          Yıllık
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
        Aylık
      </span>
    );
  };

  if (isLoading || profile?.role !== "admin") {
    return <div className="p-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kullanıcı Yönetimi</h1>
        <p className="text-slate-500 mt-1">Sisteme kayıt olan tüm klinikleri onayla veya reddet.</p>
      </div>

      <Card className="border-emerald-100 shadow-sm">
        <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-4">
          <CardTitle className="text-lg font-bold text-emerald-900">Kayıtlı Klinikler</CardTitle>
          <CardDescription>
            Sisteme yeni kayıt olan klinikleri buradan onaylayarak erişim verebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 relative min-h-[200px]">
          <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Klinik Adı / Ünvan</TableHead>
                  <TableHead className="font-semibold text-slate-700">E-posta</TableHead>
                  <TableHead className="font-semibold text-slate-700">Hizmet Paketi</TableHead>
                  <TableHead className="font-semibold text-slate-700">Ödeme</TableHead>
                  <TableHead className="font-semibold text-slate-700">Rol</TableHead>
                  <TableHead className="font-semibold text-slate-700">Durum</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Sistemde kayıtlı kullanıcı bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-900">{u.clinic_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {u.email || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={u.plan || "starter"}
                            onValueChange={(value) => updateUserPlan(u.id, value)}
                            disabled={u.role === 'admin'}
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="starter">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-3 h-3 text-amber-500" />
                                  <span>Starter</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="professional">
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                  <span>Professional</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="advanced">
                                <div className="flex items-center gap-2">
                                  <Star className="w-3 h-3 text-purple-500" />
                                  <span>Advanced</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {getBillingBadge(u.billing_cycle)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.role === 'admin' ? (
                          <span className="text-xs text-slate-400 italic">—</span>
                        ) : (
                          getPaymentBadge(u.payment_status)
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                          {u.role === 'admin' ? 'Yönetici' : 'Kiracı (Tenant)'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {u.is_approved ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Onaylı
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            <XCircle className="w-3.5 h-3.5" />
                            Beklemede
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant={u.is_approved ? "outline" : "default"} 
                            size="sm"
                            onClick={() => toggleApproval(u.id, u.is_approved)}
                            className={!u.is_approved ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-slate-600"}
                            disabled={u.role === 'admin'}
                          >
                            {u.is_approved ? "Yetkiyi Al" : "Onayla"}
                          </Button>
                          
                          {/* Reddet butonu sadece Admin değilse görünsün */}
                          {u.role !== 'admin' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setUserToReject(u)}
                              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                            >
                              Reddet
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

      {/* Reddetme (Silme) Onay Modalı */}
      <Dialog open={!!userToReject} onOpenChange={(open) => !open && !isDeleting && setUserToReject(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle className="text-xl">Kliniği Reddet ve Sil</DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2">
              <strong className="text-slate-900">{userToReject?.clinic_name}</strong> adlı kliniğin kaydını sistemden tamamen kaldırmak istediğinize emin misiniz?
            </DialogDescription>
            <DialogDescription className="text-red-600 bg-red-50 p-3 rounded-md mt-2">
              Bu işlem geri alınamaz ve kullanıcının sisteme olan tüm yetkileri kalıcı olarak iptal edilir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setUserToReject(null)}
              disabled={isDeleting}
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={confirmReject}
              disabled={isDeleting}
            >
              {isDeleting ? "Siliniyor..." : "Evet, Tamamen Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
