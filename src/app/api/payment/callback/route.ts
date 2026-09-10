import { NextRequest, NextResponse } from "next/server";
import { retrieveCheckoutForm } from "@/lib/iyzico";
import { createClient } from "@supabase/supabase-js";

// Client-side redirect helper to break out of POST context and avoid white screens
function clientRedirect(origin: string, path: string) {
  // Faz 4.2: Whitelist/Origin check - only allow relative paths
  if (!path.startsWith("/")) {
    path = "/";
  }
  const fullUrl = `${origin}${path}`;
  // BUG-03 FIX: Sanitize URL to prevent XSS injection
  const safeUrl = encodeURI(fullUrl).replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;');
  // SEC-11 FIX: Replaced inline <script> and <style> with CSP-compliant alternatives
  return new NextResponse(
    `<html>
      <head>
        <meta http-equiv="refresh" content="0;url=${safeUrl}">
      </head>
      <body style="background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; margin: 0;">
        <div style="text-align: center;">
          <p style="color: #64748b; font-weight: 500; font-size: 1.125rem;">Sisteme yönlendiriliyorsunuz. Lütfen bekleyin...</p>
        </div>
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
      return clientRedirect(origin, "/odeme?status=error&message=Token bulunamadı");
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
        return clientRedirect(origin, "/odeme?status=error&message=Kullanıcı bilgisi alınamadı");
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
        return clientRedirect(origin, `/odeme?status=error&message=${encodeURIComponent("Profil güncellenemedi")}`);
      }

      return clientRedirect(origin, "/odeme?status=success");
    } else {
      return clientRedirect(origin, `/odeme?status=error&message=${encodeURIComponent(result.errorMessage || "Ödeme başarısız")}`);
    }
  } catch (error: any) {
    console.error("Payment callback CRITICAL error:", error);
    return clientRedirect(origin, `/odeme?status=error&message=${encodeURIComponent("Sunucu hatası")}`);
  }
}
