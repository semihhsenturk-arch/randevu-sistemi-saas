import { NextRequest, NextResponse } from "next/server";
import { retrieveCheckoutForm } from "@/lib/iyzico";
import { logger } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase-server";

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

// SEC-IDOR FIX: UUID format validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const origin = new URL(req.url).origin;

  try {
    const formData = await req.formData();
    const token = formData.get("token") as string;

    if (!token) {
      logger.error("Payment callback: Token not found in formData");
      return clientRedirect(origin, "/odeme?status=error&message=Token bulunamadı");
    }

    // SEC-09 FIX: Token format validation to prevent injection or invalid requests
    if (typeof token !== "string" || !/^[a-zA-Z0-9_-]{10,100}$/.test(token)) {
      logger.warn("Payment callback: Invalid token format", { token });
      return clientRedirect(origin, "/odeme?status=error&message=Geçersiz istek formatı");
    }

    // İyzico'dan ödeme sonucunu al
    const result = await retrieveCheckoutForm(token);

    if (result.status === "success" && (result.paymentStatus === "SUCCESS" || result.paymentStatus === "INIT_THREEDS")) {
      // SEC-IDOR FIX: Extract userId from conversationId (primary) and basketId (secondary)
      const userIdFromConversation = result.conversationId || null;
      let userIdFromBasket: string | null = null;

      if (result.basketId && result.basketId.startsWith("basket_")) {
        const parts = result.basketId.split("_");
        if (parts.length >= 2) {
          userIdFromBasket = parts[1];
        }
      }

      // SEC-IDOR FIX: Cross-validate — if both sources exist, they must agree
      if (userIdFromConversation && userIdFromBasket && userIdFromConversation !== userIdFromBasket) {
        logger.error("Payment callback: userId mismatch between conversationId and basketId", {
          conversationId: userIdFromConversation,
          basketId: result.basketId,
        });
        return clientRedirect(origin, "/odeme?status=error&message=Ödeme doğrulama hatası");
      }

      const userId = userIdFromConversation || userIdFromBasket;

      if (!userId) {
        logger.error("Payment successful but userId is missing", { result });
        return clientRedirect(origin, "/odeme?status=error&message=Kullanıcı bilgisi alınamadı");
      }

      // SEC-IDOR FIX: Validate userId is a proper UUID to prevent injection
      if (!UUID_REGEX.test(userId)) {
        logger.error("Payment callback: Invalid userId format (not a UUID)", { userId });
        return clientRedirect(origin, "/odeme?status=error&message=Geçersiz kullanıcı bilgisi");
      }

      const supabaseAdmin = await createServiceClient();

      // SEC-IDOR FIX: Verify profile exists and is in 'pending' state before updating
      const { data: profile, error: fetchError } = await supabaseAdmin
        .from("profiles")
        .select("id, payment_status")
        .eq("id", userId)
        .single();

      if (fetchError || !profile) {
        logger.error("Payment callback: Profile not found for userId", { userId });
        return clientRedirect(origin, "/odeme?status=error&message=Kullanıcı bulunamadı");
      }

      // SEC-IDOR FIX: Only allow transition from 'pending' to 'paid'
      if (profile.payment_status === "paid") {
        logger.warn("Payment callback: Profile already paid, skipping update", { userId });
        return clientRedirect(origin, "/odeme?status=success");
      }

      if (profile.payment_status !== "pending") {
        logger.warn("Payment callback: Unexpected payment_status, blocking update", {
          userId,
          currentStatus: profile.payment_status,
        });
        return clientRedirect(origin, "/odeme?status=error&message=Ödeme durumu güncelenemedi");
      }

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ payment_status: "paid" })
        .eq("id", userId);

      if (updateError) {
        logger.error("Profile update FAILED:", updateError, { userId });
        return clientRedirect(origin, `/odeme?status=error&message=${encodeURIComponent("Profil güncellenemedi")}`);
      }

      logger.info("Payment successful, profile updated", { userId });
      return clientRedirect(origin, "/odeme?status=success");
    } else {
      logger.warn("Payment failed or invalid status", { result });
      return clientRedirect(origin, `/odeme?status=error&message=${encodeURIComponent(result.errorMessage || "Ödeme başarısız")}`);
    }
  } catch (error: any) {
    logger.error("Payment callback CRITICAL error:", error);
    return clientRedirect(origin, `/odeme?status=error&message=${encodeURIComponent("Sunucu hatası")}`);
  }
}
