import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. API Protection
  if (pathname.startsWith("/api/")) {
    const publicApiRoutes = [
      "/api/payment/callback",
      "/api/whatsapp/webhook",
      "/api/demo-report",
    ];

    if (!publicApiRoutes.includes(pathname)) {
      const authHeader = request.headers.get("authorization");
      const hasAuthHeader = authHeader && authHeader.startsWith("Bearer ");
      const hasCookieToken = hasSessionCookie(request);

      if (!hasAuthHeader && !hasCookieToken) {
        return new NextResponse(
          JSON.stringify({ error: "Yetkisiz erişim. Lütfen giriş yapın." }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }
    return NextResponse.next();
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

  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtected) {
    const hasToken = hasSessionCookie(request);

    if (!hasToken) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Ek Kontrol: /admin rotası için kullanıcının rolünü Supabase REST API üzerinden doğrula
    if (pathname.startsWith("/admin")) {
      const token = getAccessToken(request);
      if (token) {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          
          // Önce token'ı kullanarak kullanıcının id'sini al
          const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
              Authorization: `Bearer ${token}`,
              apikey: anonKey || "",
            },
          });
          
          if (userRes.ok) {
            const userData = await userRes.json();
            
            // Kullanıcı id'si ile profiles tablosundan rolü çek
            const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userData.id}&select=role`, {
              headers: {
                Authorization: `Bearer ${token}`,
                apikey: anonKey || "",
              },
            });
            
            if (profileRes.ok) {
              const profiles = await profileRes.json();
              const role = profiles[0]?.role;
              
              // Eğer rol admin değilse dashboard'a yönlendir
              if (role !== "admin") {
                const dashboardUrl = new URL("/takvim", request.url);
                return NextResponse.redirect(dashboardUrl);
              }
            } else {
              // Profil çekilemezse dashboard'a yönlendir
              const dashboardUrl = new URL("/takvim", request.url);
              return NextResponse.redirect(dashboardUrl);
            }
          } else {
            // User doğrulanamazsa login'e at
            const loginUrl = new URL("/login", request.url);
            return NextResponse.redirect(loginUrl);
          }
        } catch (e) {
          console.error("Middleware admin role check failed:", e);
        }
      } else {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return NextResponse.next();
}

function getAccessToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  if (request.cookies.has("sb-access-token")) {
    return request.cookies.get("sb-access-token")?.value || null;
  }

  const allCookies = request.cookies.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookie.value));
        if (parsed?.access_token) return parsed.access_token;
      } catch {
        // Skip
      }
    }
  }

  return null;
}

function hasSessionCookie(request: NextRequest): boolean {
  if (request.cookies.has("sb-access-token")) {
    return true;
  }

  const allCookies = request.cookies.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")) {
      return true;
    }
  }

  return false;
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
