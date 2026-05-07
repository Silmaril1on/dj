import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Paths that require an authenticated session
const PROTECTED_PATHS = [
  "/administration",
  "/my-profile",
  "/bookings",
  "/add-product",
];

// Auth pages — send already-signed-in users away
const AUTH_PATHS = ["/sign-in", "/sign-up", "/reset-password"];

/** CSRF: reject mutating API requests whose Origin header doesn't match the app */
function csrfCheck(request) {
  const { pathname, origin: appOrigin } = request.nextUrl;
  if (!pathname.startsWith("/api/")) return null;

  const method = request.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return null;

  // Allow server-to-server requests that carry no Origin (e.g. from cron jobs)
  const origin = request.headers.get("origin");
  if (!origin) return null;

  const allowedOrigins = [appOrigin, process.env.PROJECT_URL].filter(Boolean);
  const isAllowed = allowedOrigins.some((allowed) =>
    origin.startsWith(allowed),
  );

  if (!isAllowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Force apex domain to avoid cookie domain mismatch
  if (request.nextUrl.hostname === "www.soundfolio.net") {
    const url = new URL(request.url);
    url.hostname = "soundfolio.net";
    return NextResponse.redirect(url, 308);
  }

  // OAuth callback must always pass through so Supabase can finalise the session
  if (pathname.startsWith("/auth/callback")) return NextResponse.next();

  // CSRF check for mutating API calls
  const csrfError = csrfCheck(request);
  if (csrfError) return csrfError;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // Public page — nothing to check
  if (!isProtected && !isAuthPage) return NextResponse.next();

  // supabaseResponse holds any Set-Cookie headers from token refresh
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Rebuild response so refreshed cookies are forwarded to the browser
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() validates the JWT with Supabase (more secure than getSession)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtected && !user) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  // Run on every route except static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
