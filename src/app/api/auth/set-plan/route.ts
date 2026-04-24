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

    // Create admin client with service_role key (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Wait a bit for the auth trigger to create the profile first
    await new Promise((r) => setTimeout(r, 1500));

    // Update the profile with the correct plan using service_role (bypasses RLS)
    const { data, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        plan: plan,
        payment_status: "pending",
        billing_cycle: billingCycle || "monthly",
        email: email || null,
      })
      .eq("id", userId)
      .select("plan, payment_status, billing_cycle")
      .single();

    if (updateError) {
      console.error("set-plan update error:", updateError);

      // Fallback: try upsert
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
          { error: "Profil güncellenemedi: " + upsertError.message },
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
      // Force update one more time
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
