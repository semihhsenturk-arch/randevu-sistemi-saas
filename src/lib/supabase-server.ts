import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ─── Admin (service_role) client ─────────────────────────────────────────────

/**
 * Returns a Supabase client that uses the `service_role` key.
 * This bypasses RLS — only use in trusted server-side code.
 */
export async function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Server Supabase yapılandırması eksik! NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY .env.local dosyasında tanımlanmalıdır."
    );
  }

  // Use the standard createClient for admin operations to truly bypass RLS.
  // We do NOT use createServerClient with cookies here, because doing so
  // attaches the user's JWT, which overrides the service_role and enforces RLS.
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

// ─── Authenticated user extraction ──────────────────────────────────────────

/**
 * Extracts and verifies the JWT from cookies (or headers indirectly).
 * Uses @supabase/ssr to manage the session correctly in App Router.
 *
 * Returns the authenticated Supabase `User` object, or `null` if
 * the token is missing / invalid / expired.
 */
export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) return null;

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored if called from a Server Component
          }
        },
      },
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

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
export async function requireAuth() {
  const user = await getAuthenticatedUser();

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
