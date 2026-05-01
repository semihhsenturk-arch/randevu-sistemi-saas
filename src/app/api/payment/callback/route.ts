import { NextRequest, NextResponse } from "next/server";
import { retrieveCheckoutForm } from "@/lib/iyzico";
import { createClient } from "@supabase/supabase-js";

// Client-side redirect helper to break out of POST context and avoid white screens
function clientRedirect(url: string) {
  return new NextResponse(
    `<html>
      <body style="background: #f8fafc; display: flex; items-center; justify-content; min-height: 100vh; font-family: sans-serif;">
        <div style="margin: auto; text-align: center;">
          <div style="border: 4px solid #f3f3f3; border-top: 4px solid #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
          <p style="color: #64748b; font-weight: 500;">Sisteme yönlendiriliyorsunuz...</p>
        </div>
        <style>
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
        <script>window.location.href = "${url}";</script>
      </body>
    </html>`,
    {
      headers: { "Content-Type": "text/html" },
    }
  );
}

export async function POST(req: NextRequest) {
  const origin = new URL(req.url).origin;
  
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string;

    if (!token) {
      console.error("Payment callback: Token not found in formData");
      return clientRedirect("/odeme?status=error&message=Token bulunamadı");
    }

    // İyzico'dan ödeme sonucunu al
    const result = await retrieveCheckoutForm(token);
    
    if (result.status === "success" && (result.paymentStatus === "SUCCESS" || result.paymentStatus === "INIT_THREEDS")) {
      let userId = result.conversationId;
      
      if (!userId && result.basketId && result.basketId.startsWith("basket_")) {
        const parts = result.basketId.split("_");
        if (parts.length >= 2) {
          userId = parts[1];
        }
      }

      if (!userId) {
        console.error("Payment successful but userId is missing");
        return clientRedirect("/odeme?status=error&message=Kullanıcı bilgisi alınamadı");
      }

      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ payment_status: "paid" })
        .eq("id", userId);

      if (updateError) {
        console.error("Profile update FAILED:", updateError);
        return clientRedirect(`/odeme?status=error&message=${encodeURIComponent("Profil güncellenemedi")}`);
      }

      return clientRedirect("/odeme?status=success");
    } else {
      return clientRedirect(`/odeme?status=error&message=${encodeURIComponent(result.errorMessage || "Ödeme başarısız")}`);
    }
  } catch (error: any) {
    console.error("Payment callback CRITICAL error:", error);
    return clientRedirect(`/odeme?status=error&message=${encodeURIComponent("Sunucu hatası")}`);
  }
}
