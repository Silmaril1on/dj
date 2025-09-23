// middleware.js
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "./app/lib/config/supabaseServer";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

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
  const authRoutes = ["/login", "/signup", "/auth"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && (!session || error)) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing auth routes with valid session
  if (isAuthRoute && session && !error) {
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
