import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwfc8JSGlL4JetSTE4xwV4OMAONk1_GgYHyEKl2yrdADvDNENfAZxzdI7ycv9cctzmDeA/exec";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { success, limit, remaining, reset } = checkRateLimit(`demo-report:${ip}`, 3, 60000);
    
    if (!success) {
      return NextResponse.json(
        { status: "error", error: "Çok fazla istek gönderdiniz. Lütfen 1 dakika sonra tekrar deneyin." },
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

    // ──── BUG-11 FIX: Basic Referer Check ────
    // Ensure the request comes from our own frontend to prevent naive cross-site POSTs
    const referer = req.headers.get("referer");
    if (!referer || !referer.includes(process.env.NEXT_PUBLIC_SITE_URL || "localhost")) {
      console.warn("demo-report: Invalid or missing referer", referer);
      return NextResponse.json(
        { status: "error", error: "Yetkisiz istek." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const params = new URLSearchParams({
      tip:     body.tip     || "-",
      ad:      body.ad      || "-",
      telefon: body.telefon || "-",
      klinik:  body.klinik  || "-",
      mesaj:   body.mesaj   || "-",
    });

    const response = await fetch(`${SCRIPT_URL}?${params.toString()}`, {
      method: "GET",
    });

    const text = await response.text();
    return NextResponse.json({ status: "ok", response: text });
  } catch (err) {
    return NextResponse.json({ status: "error", error: String(err) }, { status: 500 });
  }
}
