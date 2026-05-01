import { NextRequest, NextResponse } from "next/server";
import { initializeCheckoutForm, PLAN_PRICES, PlanType, BillingCycle } from "@/lib/iyzico";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, clinicName, plan, billingCycle } = body as {
      userId: string;
      email: string;
      clinicName: string;
      plan: PlanType;
      billingCycle: BillingCycle;
    };

    if (!userId || !email || !plan || !billingCycle) {
      return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 });
    }

    const planData = PLAN_PRICES[plan];
    if (!planData) {
      return NextResponse.json({ error: "Geçersiz paket" }, { status: 400 });
    }

    const price = planData[billingCycle];
    const origin = new URL(req.url).origin;

    const safeClinicName = clinicName || "Klinik Kullanıcı";
    const nameParts = safeClinicName.split(" ");
    const firstName = nameParts[0] || "Klinik";
    const lastName = nameParts.slice(1).join(" ") || "Kullanıcı";

    const result = await initializeCheckoutForm({
      conversationId: userId,
      price,
      basketId: `basket_${userId}_${Date.now()}`,
      callbackUrl: `${origin}/api/payment/callback`,
      buyer: {
        id: userId,
        name: firstName,
        surname: lastName,
        email,
        identityNumber: "11111111111",
        registrationAddress: "İstanbul, Türkiye",
        city: "Istanbul",
        country: "Turkey",
        ip: "85.34.78.112",
      },
      basketItems: [
        {
          id: `plan_${plan}_${billingCycle}`,
          name: `${planData.name} (${billingCycle === "monthly" ? "Aylık" : "Yıllık"})`,
          category1: "Abonelik",
          itemType: "VIRTUAL",
          price: price,
        },
      ],
    });

    if (result.status === "success") {
      return NextResponse.json({
        checkoutFormContent: result.checkoutFormContent,
        token: result.token,
        paymentPageUrl: result.paymentPageUrl,
      });
    } else {
      console.error("İyzico result error:", result);
      return NextResponse.json(
        { error: result.errorMessage || "Ödeme başlatılamadı" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Payment initialize error:", error);
    return NextResponse.json(
      { 
        error: `Sunucu hatası: ${error.message || "Bilinmeyen hata"}`, 
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      }, 
      { status: 500 }
    );
  }
}
