"use client";
import { useEffect } from "react";
import Link from "next/link";

// Route-level error boundary — catches errors thrown inside any page or
// nested layout within app/(routes)/. Renders INSIDE your RootLayout
// so navigation, header, and footer remain visible.
const RouteError = ({ error, reset }) => {
  useEffect(() => {
    console.error("[RouteError]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-red-400/60 font-mono text-sm tracking-widest uppercase">
        Error
      </p>
      <h2 className="text-3xl lg:text-4xl font-bold text-gold">
        Something went wrong
      </h2>
      <p className="text-cream/60 max-w-md text-sm">
        {error?.message || "An unexpected error occurred on this page."}
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={reset}
          className="px-6 py-2 bg-gold text-stone-900 font-bold rounded hover:bg-gold/90 transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-6 py-2 border border-gold/30 text-gold font-bold rounded hover:border-gold transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default RouteError;
