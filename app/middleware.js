// middleware.js
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "./app/lib/config/supabaseServer";

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  try {
    // Basic request diagnostics (visible in Vercel edge logs)
    console.log("[MW] host=", request.nextUrl.hostname, "path=", pathname);
  } catch (_) {}

  // Canonicalize host: force apex domain to avoid cookie mismatch (www vs apex)
  // Supabase auth cookies are scoped to the current host; mixing hosts breaks sessions.
  if (request.nextUrl.hostname === "www.soundfolio.net") {
    const url = new URL(request.url);
    url.hostname = "soundfolio.net";
    try { console.log("[MW] redirecting to apex:", url.toString()); } catch (_) {}
    return NextResponse.redirect(url, 308);
  }

  // Skip middleware for static files and API routes that don't need auth
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/static/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createSupabaseServerClient(request.cookies);

  // Refresh session if expired
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  // Define protected routes
  const protectedRoutes = [
    "/dashboard",
    "/profile",
    "/personal-information",
    // Add other protected routes
  ];

  // Define auth routes (should redirect if already authenticated)
  // Important: do NOT include "/auth" root to avoid catching /auth/callback
  const authRoutes = [
    "/login",
    "/signup",
    "/sign-in",
    "/sign-up",
    "/auth/login",
    "/auth/signup",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Always allow OAuth callback to run to complete profile setup
  if (pathname.startsWith("/auth/callback")) {
    try { console.log("[MW] allowing /auth/callback to pass through"); } catch (_) {}
    return response;
  }

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && (!session || error)) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    try { console.log("[MW] protected route, redirecting to login", pathname); } catch (_) {}
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing auth routes with valid session
  if (isAuthRoute && session && !error) {
    try { console.log("[MW] has session; redirecting away from auth route"); } catch (_) {}
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
