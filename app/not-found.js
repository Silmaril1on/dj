import Link from "next/link";

export const metadata = {
  title: "Soundfolio | Page Not Found",
  description: "The page you are looking for does not exist.",
};

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-gold/50 font-mono text-sm tracking-widest uppercase">
        404
      </p>
      <h1 className="text-4xl lg:text-6xl font-bold text-gold">
        Page Not Found
      </h1>
      <p className="text-cream/60 max-w-md text-sm lg:text-base">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3 flex-wrap justify-center mt-2">
        <Link
          href="/"
          className="px-6 py-2 bg-gold text-stone-900 font-bold rounded hover:bg-gold/90 transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/artists"
          className="px-6 py-2 border border-gold/30 text-gold font-bold rounded hover:border-gold transition-colors"
        >
          Browse Artists
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
