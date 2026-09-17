import { NextRequest, NextResponse } from "next/server";

// SEC-2.2: Server-side login rate limiting
// In-memory store — works for single-instance deployments
// For multi-instance, use Redis/KV store
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

// Periodic cleanup to prevent memory leaks
let lastCleanup = Date.now();
function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, value] of loginAttempts.entries()) {
    if (value.lockedUntil > 0 && now > value.lockedUntil) {
      loginAttempts.delete(key);
    }
  }
}

function getClientIP(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

export async function POST(req: NextRequest) {
  cleanupStaleEntries();

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-posta ve şifre gereklidir" },
        { status: 400 }
      );
    }

    // Rate limit key: combine IP + email to prevent both IP-based and email-based brute force
    const ip = getClientIP(req);
    const rateLimitKey = `${ip}:${email.toLowerCase()}`;

    const attempt = loginAttempts.get(rateLimitKey);
    if (attempt) {
      // Check if locked
      if (attempt.lockedUntil > 0 && Date.now() < attempt.lockedUntil) {
        const remainingMinutes = Math.ceil(
          (attempt.lockedUntil - Date.now()) / 60000
        );
        return NextResponse.json(
          {
            error: `Çok fazla başarısız deneme. Lütfen ${remainingMinutes} dakika sonra tekrar deneyin.`,
            locked: true,
            remainingMinutes,
          },
          { status: 429 }
        );
      }
    }

    // Forward to Supabase Auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Sunucu yapılandırma hatası" },
        { status: 500 }
      );
    }

    const authResponse = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ email, password }),
      }
    );

    const authData = await authResponse.json();

    if (!authResponse.ok) {
      // Failed login — increment counter
      const current = loginAttempts.get(rateLimitKey) || {
        count: 0,
        lockedUntil: 0,
      };
      current.count += 1;

      if (current.count >= MAX_ATTEMPTS) {
        current.lockedUntil = Date.now() + LOCK_DURATION_MS;
        current.count = 0;
        loginAttempts.set(rateLimitKey, current);

        return NextResponse.json(
          {
            error:
              "Çok fazla başarısız deneme. Hesabınız 15 dakika boyunca kilitlenmiştir.",
            locked: true,
            remainingMinutes: 15,
          },
          { status: 429 }
        );
      }

      loginAttempts.set(rateLimitKey, current);

      return NextResponse.json(
        {
          error: authData.error_description || authData.msg || "Giriş başarısız",
          remainingAttempts: MAX_ATTEMPTS - current.count,
        },
        { status: 401 }
      );
    }

    // Successful login — clear attempts
    loginAttempts.delete(rateLimitKey);

    return NextResponse.json({
      access_token: authData.access_token,
      refresh_token: authData.refresh_token,
      user: authData.user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Sunucu hatası. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
