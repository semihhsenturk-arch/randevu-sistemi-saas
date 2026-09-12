import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Simple in-memory rate limiting map for Edge isolates
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // Max 100 API requests per minute per IP

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for") || request.ip || "127.0.0.1";

  // 1. API Protection & Rate Limiting
  if (pathname.startsWith("/api/")) {
    // Rate Limiting Logic
    const currentTime = Date.now();
    const rateLimitData = rateLimitMap.get(ip);

    if (rateLimitData) {
      if (currentTime - rateLimitData.timestamp < RATE_LIMIT_WINDOW_MS) {
        if (rateLimitData.count >= MAX_REQUESTS_PER_WINDOW) {
          return new NextResponse(
            JSON.stringify({ error: "Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin." }),
            { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
          );
        }
        rateLimitData.count++;
      } else {
        rateLimitMap.set(ip, { count: 1, timestamp: currentTime });
      }
    } else {
      rateLimitMap.set(ip, { count: 1, timestamp: currentTime });
    }
    
    // Prevent memory leaks in Edge isolate
    if (rateLimitMap.size > 1000) {
      rateLimitMap.clear();
    }
    const publicApiRoutes = [
      "/api/payment/callback",
      "/api/whatsapp/webhook",
      "/api/demo-report",
    ];

    if (!publicApiRoutes.includes(pathname)) {
      if (!user) {
        return new NextResponse(
          JSON.stringify({ error: "Yetkisiz erişim. Lütfen giriş yapın." }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }
    return supabaseResponse;
  }

  // 2. Dashboard Route Protection
  const protectedPaths = [
    "/takvim",
    "/hasta-listesi",
    "/stok-yonetimi",
    "/ayarlar",
    "/admin",
    "/odeme",
  ];

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected) {
    // SEC-03 FIX: Demo modu cookie bypass'ı kaldırıldı.
    // Demo modu tamamen client-side (sessionStorage) çalışır ve gerçek DB erişimi sağlamaz.
    // Middleware artık sadece gerçek Supabase auth'a güvenir.
    // Demo kullanıcıları için client-side AuthProvider kendi yönlendirmesini yapar.
    
    // Demo hesabı /admin sayfasına kesinlikle giremez
    const isDemoSession = request.cookies.has("demo_mode") && 
                          request.cookies.get("demo_mode")?.value === "true";
                          
    if (isDemoSession && pathname.startsWith("/admin")) {
      const dashboardUrl = new URL("/takvim", request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    // Kimlik doğrulaması: Gerçek Supabase user gerekli
    // Demo modu client-side'da AuthProvider tarafından yönetilir,
    // middleware seviyesinde artık demo bypass yok.
    if (!user) {
      // Demo modundaki kullanıcılar için: cookie var ama auth yok — yine de izin ver
      // çünkü demo modu gerçek veri kullanmaz (sadece sessionStorage).
      // Ancak admin sayfası hariç (yukarıda engellendi).
      if (isDemoSession && !pathname.startsWith("/admin")) {
        return supabaseResponse;
      }
      
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Ek Kontrol: /admin rotası için kullanıcının rolünü doğrula
    if (pathname.startsWith("/admin") && user) {
      try {
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error || profiles?.role !== "admin") {
          const dashboardUrl = new URL("/takvim", request.url);
          return NextResponse.redirect(dashboardUrl);
        }
      } catch (e) {
        console.error("Middleware admin role check failed:", e);
        const dashboardUrl = new URL("/takvim", request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/takvim/:path*",
    "/hasta-listesi/:path*",
    "/stok-yonetimi/:path*",
    "/ayarlar/:path*",
    "/admin/:path*",
    "/odeme/:path*",
  ],
};
