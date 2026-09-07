import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  // 1. API Protection
  if (pathname.startsWith("/api/")) {
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
    const isDemo = request.cookies.has("demo_mode") && request.cookies.get("demo_mode")?.value === "true";
    
    // Demo hesabı /admin sayfasına kesinlikle giremez
    if (isDemo && pathname.startsWith("/admin")) {
      const dashboardUrl = new URL("/takvim", request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    if (!user && !isDemo) {
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
