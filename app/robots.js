const BASE_URL = process.env.PROJECT_URL;

export default function robots() {
  return {
    rules: [
      {
        // General crawlers — allow everything except private/functional routes
        userAgent: "*",
        allow: "/",
        disallow: [
          "/administration/",
          "/api/",
          "/my-profile/",
          "/add-product/",
          "/bookings/",
          "/_next/", // Next.js internals — no crawl value
          "/static/",
        ],
      },
      {
        // Prevent GPTBot and other AI scrapers from training on your content.
        // Remove this block if you don't mind AI indexing.
        userAgent: "GPTBot",
        disallow: ["/"],
      },
      {
        userAgent: "CCBot",
        disallow: ["/"],
      },
      {
        userAgent: "anthropic-ai",
        disallow: ["/"],
      },
      {
        userAgent: "Claude-Web",
        disallow: ["/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
