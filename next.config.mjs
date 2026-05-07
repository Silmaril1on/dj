const isDev = process.env.NODE_ENV === "development";
const BASE_URL = process.env.PROJECT_URL;

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  {
    // NOTE: unsafe-inline + unsafe-eval are required by Next.js for now.
    // Long-term goal: migrate to nonce-based CSP once Next.js supports it cleanly.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com",
      "style-src 'self' 'unsafe-inline'",
      [
        "img-src 'self' blob: data:",
        "https://ucyhmkyjbrfbcediafwo.supabase.co",
        "https://lh3.googleusercontent.com",
        "https://flagcdn.com",
        "https://*.flagcdn.com",
        "https://cdn.jsdelivr.net",
        "https://maps.googleapis.com",
        "https://maps.gstatic.com",
        "https://*.ggpht.com",
        "https://streetviewpixels-pa.googleapis.com",
        "https://*.byteplusapi.com",
        "https://*.byteimg.com",
        "https://*.bytedance.com",
        "https://*.bytedance.net",
        "https://*.volccdn.com",
        "https://*.volces.com",
      ].join(" "),
      "font-src 'self'",
      [
        "connect-src 'self'",
        "https://ucyhmkyjbrfbcediafwo.supabase.co",
        "wss://ucyhmkyjbrfbcediafwo.supabase.co",
        "https://maps.googleapis.com",
        "https://ipwho.is",
        "https://api.bigdatacloud.net",
        "https://ark.ap-southeast.bytepluses.com",
        isDev ? "ws://localhost:3000" : "",
      ]
        .filter(Boolean)
        .join(" "),
      [
        "media-src 'self'",
        "https://*.byteplusapi.com",
        "https://*.byteimg.com",
        "https://*.bytedance.com",
        "https://*.bytedance.net",
        "https://*.volccdn.com",
      ].join(" "),
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig = {
  serverExternalPackages: ["sharp"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ucyhmkyjbrfbcediafwo.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // No indexing for admin, auth, and private user routes
        source: "/(administration|my-profile|add-product|bookings)(.*)",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      // Long-lived cache for static Next.js assets — production only.
      // In dev, filenames are NOT content-hashed so the browser would cache
      // stale CSS/JS for a year and only a hard-reload+empty-cache would fix it.
      ...(!isDev
        ? [
            {
              source: "/_next/static/(.*)",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
          ]
        : []),
    ];
  },
};

export default nextConfig;
