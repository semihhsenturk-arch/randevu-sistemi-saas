import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * Server-side API to set the initial plan for a newly registered user.
 * Uses service_role key to bypass RLS and ensure the plan is correctly written.
 * This prevents the race condition where the Supabase auth trigger overwrites
 * the plan value set by the client.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { success, limit, remaining, reset } = checkRateLimit(`set-plan:${ip}`, 10, 60000); // 10 requests per minute per IP
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString()
          }
        }
      );
    }

    const body = await req.json();
    const { userId, plan, billingCycle, email } = body;

    if (!userId || !plan) {
      return NextResponse.json(
        { error: "userId ve plan alanları zorunludur" },
        { status: 400 }
      );
    }

    // Validate plan value
    const validPlans = ["starter", "professional", "advanced"];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: "Geçersiz plan değeri" },
        { status: 400 }
      );
    }

    // ──── BUG-02 & SEC-05 FIX: Auth doğrulaması ────
    // Two-tier verification:
    // 1) If session exists: caller must be the same user
    // 2) If no session (registration flow): user must be recently created (<5 min) + email match
    const { getAuthenticatedUser, createServiceClient } = await import("@/lib/supabase-server");
    const authUserSession = await getAuthenticatedUser();

    const supabaseAdmin = createServiceClient();

    // userId'nin gerçek bir kullanıcı olduğunu doğrula (service_role ile)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError || !authUser?.user) {
      logger.error("set-plan: Invalid userId — user not found", authError, { userId });
      return NextResponse.json(
        { error: "Geçersiz kullanıcı ID" },
        { status: 403 }
      );
    }

    if (authUserSession) {
      // Tier 1: Session var — userId eşleşmesi zorunlu
      if (authUserSession.id !== userId) {
        logger.warn("set-plan: userId mismatch with session", { expected: authUserSession.id, actual: userId });
        return NextResponse.json(
          { error: "Yetkisiz erişim" },
          { status: 403 }
        );
      }
    } else {
      // Tier 2: Session yok (kayıt akışı) — kullanıcı son 5 dk içinde oluşturulmuş olmalı + email eşleşmeli
      const createdAt = new Date(authUser.user.created_at);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const FIVE_MINUTES = 5 * 60 * 1000;

      if (diffMs > FIVE_MINUTES) {
        logger.warn("set-plan: No session and user is not recently created", { diffMs, userId });
        return NextResponse.json(
          { error: "Yetkisiz erişim" },
          { status: 403 }
        );
      }

      if (!email || authUser.user.email !== email) {
        logger.warn("set-plan: No session and email mismatch", { userId });
        return NextResponse.json(
          { error: "Yetkisiz erişim" },
          { status: 403 }
        );
      }
    }


    // ──── BUG-09 FIX: Polling ile profil oluşmasını bekle ────
    let profileExists = false;
    for (let attempt = 0; attempt < 6; attempt++) {
      const { data: checkProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (checkProfile) {
        profileExists = true;
        break;
      }
      // Her denemede 500ms bekle (max 3 saniye)
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!profileExists) {
      logger.warn("set-plan: Profile not found after polling for user", { userId });
      // Profil henüz oluşmadıysa upsert ile oluştur
      const { error: upsertError } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: userId,
            plan: plan,
            payment_status: "pending",
            billing_cycle: billingCycle || "monthly",
            email: email || null,
          },
          { onConflict: "id" }
        );

      if (upsertError) {
        logger.error("set-plan upsert error:", upsertError, { userId });
        return NextResponse.json(
          { error: "Profil oluşturulamadı: " + upsertError.message },
          { status: 500 }
        );
      }
    } else {
      // Profil var, güncelle
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          plan: plan,
          payment_status: "pending",
          billing_cycle: billingCycle || "monthly",
          email: email || null,
        })
        .eq("id", userId);

      if (updateError) {
        logger.error("set-plan update error:", updateError, { userId });
        return NextResponse.json(
          { error: "Profil güncellenemedi: " + updateError.message },
          { status: 500 }
        );
      }
    }

    // Verify the plan was set correctly
    const { data: verify } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    if (verify && verify.plan !== plan) {
      logger.warn(`Plan verification failed! Expected: ${plan}, Got: ${verify.plan}. Force updating...`, { userId });
      await supabaseAdmin
        .from("profiles")
        .update({ plan: plan })
        .eq("id", userId);
    }

    logger.info(`Plan set successfully for user`, { userId, plan });
    return NextResponse.json({ success: true, plan: plan });
  } catch (error: any) {
    logger.error("set-plan critical error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası: " + (error.message || "Bilinmeyen hata") },
      { status: 500 }
    );
  }
}
