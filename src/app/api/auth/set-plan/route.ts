import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-side API to set the initial plan for a newly registered user.
 * Uses service_role key to bypass RLS and ensure the plan is correctly written.
 * This prevents the race condition where the Supabase auth trigger overwrites
 * the plan value set by the client.
 */
export async function POST(req: NextRequest) {
  try {
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

    // ──── BUG-02 FIX: Auth doğrulaması ────
    // Kayıt sırasında kullanıcı henüz signUp yapmış ve hemen set-plan çağırıyor.
    // Bu noktada session token mevcut olabilir. Eğer Authorization header varsa doğrulayalım.
    // Eğer yoksa, en azından userId'nin gerçek bir auth.users kaydı olduğunu doğrulayalım.
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // userId'nin gerçek bir kullanıcı olduğunu doğrula (service_role ile)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError || !authUser?.user) {
      console.error("set-plan: Invalid userId — user not found:", userId);
      return NextResponse.json(
        { error: "Geçersiz kullanıcı ID" },
        { status: 403 }
      );
    }

    // Ek güvenlik: Eğer email parametresi gönderildiyse, auth user'ın email'i ile eşleşmeli
    if (email && authUser.user.email && email !== authUser.user.email) {
      console.error("set-plan: Email mismatch", { provided: email, actual: authUser.user.email });
      return NextResponse.json(
        { error: "Email doğrulaması başarısız" },
        { status: 403 }
      );
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
      console.error("set-plan: Profile not found after polling for user:", userId);
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
        console.error("set-plan upsert error:", upsertError);
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
        console.error("set-plan update error:", updateError);
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
      console.warn(
        `Plan verification failed! Expected: ${plan}, Got: ${verify.plan}. Force updating...`
      );
      await supabaseAdmin
        .from("profiles")
        .update({ plan: plan })
        .eq("id", userId);
    }

    console.log(`Plan set successfully for user ${userId}: ${plan}`);
    return NextResponse.json({ success: true, plan: plan });
  } catch (error: any) {
    console.error("set-plan critical error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası: " + (error.message || "Bilinmeyen hata") },
      { status: 500 }
    );
  }
}
