// middleware.js (root)
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "./lib/config/supabaseServer";

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  try {
    console.log("[MW] host=", request.nextUrl.hostname, "path=", pathname);
  } catch (_) {}

  // Force apex domain to avoid cookie domain mismatch
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

  const protectedRoutes = [
    "/dashboard",
    "/profile",
    "/personal-information",
  ];

  // Do NOT include "/auth" root; enumerate explicit auth pages
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

  // Always allow OAuth callback to finalize session
  if (pathname.startsWith("/auth/callback")) {
    try { console.log("[MW] allowing /auth/callback to pass through"); } catch (_) {}
    return response;
  }

  if (isProtectedRoute && (!session || error)) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    try { console.log("[MW] protected route; redirect → /auth/login", pathname); } catch (_) {}
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && session && !error) {
    try { console.log("[MW] has session; redirecting away from auth route"); } catch (_) {}
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
