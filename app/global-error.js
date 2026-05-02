"use client";
import { useEffect } from "react";
import Link from "next/link";

// Global error boundary — catches unhandled errors in any Server Component.
// Must be a Client Component. Next.js automatically renders this when an
// error bubbles up from a page or layout.
const GlobalError = ({ error, reset }) => {
  useEffect(() => {
    // Log to your monitoring service (Sentry etc.) here
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-gold flex flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="text-red-400/60 font-mono text-sm tracking-widest uppercase">
          Error
        </p>
        <h1 className="text-4xl lg:text-5xl font-bold">Something went wrong</h1>
        <p className="text-cream/60 max-w-md text-sm lg:text-base">
          An unexpected error occurred. We&apos;ve been notified and are looking
          into it.
        </p>
        <div className="flex gap-3 flex-wrap justify-center mt-2">
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
      </body>
    </html>
  );
};

export default GlobalError;
