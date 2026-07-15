import { NextRequest, NextResponse } from "next/server";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwfc8JSGlL4JetSTE4xwV4OMAONk1_GgYHyEKl2yrdADvDNENfAZxzdI7ycv9cctzmDeA/exec";

export async function POST(req: NextRequest) {
  try {
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
