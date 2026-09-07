/**
 * Server-side Supabase helpers for API Route Handlers.
 *
 * - createServiceClient()     → admin client (bypasses RLS, use with caution)
 * - getAuthenticatedUser(req) → verifies JWT from the request and returns the user, or null
 */

import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

// ─── Admin (service_role) client ─────────────────────────────────────────────
let _serviceClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client that uses the `service_role` key.
 * This bypasses RLS — only use in trusted server-side code.
 */
export function createServiceClient(): SupabaseClient {
  if (_serviceClient) return _serviceClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Server Supabase yapılandırması eksik! NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY .env.local dosyasında tanımlanmalıdır."
    );
  }

  _serviceClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _serviceClient;
}

// ─── Authenticated user extraction ──────────────────────────────────────────

/**
 * Extracts and verifies the JWT from the incoming request.
 *
 * Looks for:
 *   1. `Authorization: Bearer <token>` header
 *   2. `sb-access-token` cookie (Supabase default)
 *
 * Returns the authenticated Supabase `User` object, or `null` if
 * the token is missing / invalid / expired.
 */
export async function getAuthenticatedUser(
  request: Request
): Promise<User | null> {
  const token = extractToken(request);
  if (!token) return null;

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) return null;

    // Create a one-off client with the user's JWT to validate it
    const supabase = createClient(url, anonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) return null;

    return user;
  } catch {
    return null;
  }
}

/**
 * Convenience wrapper: returns { user, response } where response is a 401
 * NextResponse if auth failed, or null if auth succeeded.
 */
export async function requireAuth(request: Request): Promise<{
  user: User | null;
  errorResponse: Response | null;
}> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return {
      user: null,
      errorResponse: new Response(
        JSON.stringify({ error: "Yetkisiz erişim. Lütfen giriş yapın." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  return { user, errorResponse: null };
}

// ─── Internal helpers ───────────────────────────────────────────────────────

function extractToken(request: Request): string | null {
  // 1. Authorization header
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // 2. Cookie fallback (Supabase stores tokens in cookies)
  const cookieHeader = request.headers.get("Cookie");
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);

    // Supabase JS v2 stores the access token inside a JSON cookie
    // named `sb-<project-ref>-auth-token`
    for (const [name, value] of Object.entries(cookies)) {
      if (name.startsWith("sb-") && name.endsWith("-auth-token")) {
        try {
          const parsed = JSON.parse(decodeURIComponent(value));
          if (parsed?.access_token) return parsed.access_token;
        } catch {
          // Not JSON — skip
        }
      }
    }

    // Legacy: plain `sb-access-token` cookie
    if (cookies["sb-access-token"]) {
      return cookies["sb-access-token"];
    }
  }

  return null;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) {
      cookies[name.trim()] = rest.join("=").trim();
    }
  });
  return cookies;
}
