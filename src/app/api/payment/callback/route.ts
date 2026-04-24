import { NextRequest, NextResponse } from "next/server";
import { retrieveCheckoutForm } from "@/lib/iyzico";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string;

    if (!token) {
      console.error("Payment callback: Token not found in formData");
      return NextResponse.redirect(
        new URL("/odeme?status=error&message=Token bulunamadı", baseUrl)
      );
    }

    // İyzico'dan ödeme sonucunu al
    const result = await retrieveCheckoutForm(token);
    console.log("Iyzico Callback Result Keys:", Object.keys(result));
    
    if (result.status === "success" && (result.paymentStatus === "SUCCESS" || result.paymentStatus === "INIT_THREEDS")) {
      // UserId'yi hem conversationId hem de basketId'den çekmeyi dene (Hangisi doluysa)
      let userId = result.conversationId;
      
      // Eğer conversationId yoksa basketId'den ayıkla (basket_USERID_TIMESTAMP formatındaydı)
      if (!userId && result.basketId && result.basketId.startsWith("basket_")) {
        const parts = result.basketId.split("_");
        if (parts.length >= 2) {
          userId = parts[1];
          console.log("UserId extracted from basketId fallback:", userId);
        }
      }

      console.log("Payment successful for user:", userId);

      if (!userId) {
        console.error("Payment successful but userId (conversationId/basketId) is missing in result:", JSON.stringify(result));
        return NextResponse.redirect(
          new URL("/odeme?status=error&message=Kullanıcı bilgisi alınamadı. Lütfen destekle iletişime geçin.", baseUrl)
        );
      }

      // Supabase admin client'ı her istekte taze oluştur (env güvenliği için)
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Veritabanını güncelle
      const { data, error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ payment_status: "paid" })
        .eq("id", userId)
        .select();

      if (updateError) {
        console.error("Profile update FAILED in callback:", updateError);
        return NextResponse.redirect(
          new URL(`/odeme?status=error&message=${encodeURIComponent("Profil güncellenemedi: " + updateError.message)}`, baseUrl)
        );
      }

      console.log("Database update success for user:", userId, data);
      return NextResponse.redirect(new URL("/odeme?status=success", baseUrl));
    } else {
      console.error("İyzico payment failed or pending:", result);
      return NextResponse.redirect(
        new URL(
          `/odeme?status=error&message=${encodeURIComponent(result.errorMessage || "Ödeme başarısız veya onay bekliyor")}`,
          baseUrl
        )
      );
    }
  } catch (error: any) {
    console.error("Payment callback CRITICAL error:", error);
    return NextResponse.redirect(
      new URL(`/odeme?status=error&message=${encodeURIComponent(error.message || "Sunucu hatası")}`, baseUrl)
    );
  }
}
