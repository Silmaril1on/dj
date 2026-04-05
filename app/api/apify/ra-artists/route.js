import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    // Support both single url and multiple urls
    let urls = [];
    if (body.urls && Array.isArray(body.urls)) {
      urls = body.urls;
    } else if (body.url) {
      urls = [body.url];
    }

    urls = urls.map((u) => u.trim()).filter(Boolean);

    if (urls.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one URL is required" },
        { status: 400 },
      );
    }

    console.log("🎵 Fetching RA Artists:", urls);

    const apifyToken = process.env.APIFY_API_TOKEN;

    if (!apifyToken) {
      return NextResponse.json(
        { success: false, error: "Apify API token not configured" },
        { status: 500 },
      );
    }

    const input = {
      startUrls: urls.map((url) => ({ url })),
      artistDepth: 0,
      maxArtists: Math.max(40, urls.length + 40),
    };

    console.log("📤 Sending to Apify:", input);

    const apifyResponse = await fetch(
      `https://api.apify.com/v2/acts/kiwXzTmsIFqUplqGm/run-sync-get-dataset-items?token=${apifyToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(300000),
      },
    );

    if (!apifyResponse.ok) {
      const errorText = await apifyResponse.text();
      console.error("❌ Apify API error:", errorText);
      return NextResponse.json(
        { success: false, error: `Apify API error: ${apifyResponse.status}` },
        { status: apifyResponse.status },
      );
    }

    const data = await apifyResponse.json();
    console.log(`📦 Apify returned ${data?.length ?? 0} artists`);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "No artist data found" },
        { status: 404 },
      );
    }

    // Strip fields we don't need (keep relatedArtists for the related-artists feature)
    const cleanedArtists = data.map(
      ({ artistVenues, artistAreas, events, ...rest }) => rest,
    );

    console.log(
      "✅ Artists fetched:",
      cleanedArtists.map((a) => a.artistName).join(", "),
    );

    // ── Fetched Artists Data log ───────────────────────────────────────────
    const SOCIAL_KEYS = [
      "facebook",
      "soundcloud",
      "instagram",
      "twitter",
      "website",
    ];
    const truncate = (str, len = 300) =>
      str && str.length > len ? str.substring(0, len) + "..." : str || null;

    console.log("\n========== Fetched Artists Data ==========");
    cleanedArtists.forEach((ra, idx) => {
      const firstName = (ra.firstName || "").trim();
      const lastName = (ra.lastName || "").trim();
      const fullName =
        firstName && lastName
          ? `${firstName} ${lastName}`
          : firstName || lastName || ra.artistName || null;

      const socialLinks = SOCIAL_KEYS.map((k) => ra[k]).filter(Boolean);

      const labels = ra.artistLabels
        ? ra.artistLabels.map((l) => l.labelName).filter(Boolean)
        : [];

      console.log(`\n[${idx + 1}] ${ra.artistName}`);
      console.log("  stage_name  :", ra.artistName || null);
      console.log("  name        :", fullName);
      console.log("  artist_slug :", ra.urlSafeName || null);
      console.log("  status      : pending");
      console.log("  desc        :", truncate(ra.blurb));
      console.log("  bio         :", truncate(ra.bio));
      console.log("  social_links:", socialLinks);
      console.log("  label       :", labels);
      console.log("  country     :", ra.artistAreas?.[0]?.countryUrl || null);
      console.log("  city        :", ra.artistAreas?.[0]?.areaName || null);
      console.log("  artist_image:", ra.image || null);
      console.log(
        "  related     :",
        (ra.relatedArtists || []).map(
          (r) => `${r.artistName} (${r.followerCount ?? 0} followers)`,
        ),
      );
    });
    console.log("==========================================\n");
    // ─────────────────────────────────────────────────────────────────────

    return NextResponse.json({
      success: true,
      data: cleanedArtists,
    });
  } catch (error) {
    console.error("❌ Error fetching RA artists:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
