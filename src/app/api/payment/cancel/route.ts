import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body as { userId: string };

    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı bilgisi eksik" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Kullanıcının profilini kontrol et
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("id, payment_status, plan, billing_cycle")
      .eq("id", userId)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    if (profile.payment_status === "cancelled") {
      return NextResponse.json({ error: "Abonelik zaten iptal edilmiş" }, { status: 400 });
    }

    // Aboneliği iptal et — dönem sonuna kadar erişim devam eder
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        payment_status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Abonelik iptal hatası:", updateError);
      return NextResponse.json(
        { error: "Abonelik iptal edilemedi. Lütfen tekrar deneyin." },
        { status: 500 }
      );
    }

    console.log(`Abonelik iptal edildi: userId=${userId}`);

    return NextResponse.json({ success: true, message: "Aboneliğiniz başarıyla iptal edildi." });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: `Sunucu hatası: ${error.message || "Bilinmeyen hata"}` },
      { status: 500 }
    );
  }
}
