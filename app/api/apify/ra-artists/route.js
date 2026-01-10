import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    // Extract artist slug from URL
    // Example: https://ra.co/dj/formatb -> formatb
    const urlParts = url.split("/");
    const artistSlug =
      urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];

    if (!artistSlug) {
      return NextResponse.json(
        { success: false, error: "Invalid RA artist URL" },
        { status: 400 }
      );
    }

    console.log("🎵 Fetching RA Artist:", url);

    // Call Apify actor for RA Artist scraping
    const apifyToken = process.env.APIFY_API_TOKEN;

    if (!apifyToken) {
      return NextResponse.json(
        { success: false, error: "Apify API token not configured" },
        { status: 500 }
      );
    }

    // Use the correct actor ID and input format
    const input = {
      startUrls: [{ url }],
      artistDepth: 1,
      maxArtists: 1000,
    };

    console.log("📤 Sending to Apify:", input);

    const apifyResponse = await fetch(
      `https://api.apify.com/v2/acts/kiwXzTmsIFqUplqGm/run-sync-get-dataset-items?token=${apifyToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
        // 5 minute timeout
        signal: AbortSignal.timeout(300000),
      }
    );

    if (!apifyResponse.ok) {
      const errorText = await apifyResponse.text();
      console.error("❌ Apify API error:", errorText);
      return NextResponse.json(
        { success: false, error: `Apify API error: ${apifyResponse.status}` },
        { status: apifyResponse.status }
      );
    }

    const data = await apifyResponse.json();
    console.log("📦 Raw Apify response:", JSON.stringify(data, null, 2));

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "No artist data found" },
        { status: 404 }
      );
    }

    // Get the first artist data
    const artistData = data[0];

    // Remove specified fields
    const { artistVenues, artistAreas, events, ...cleanedData } = artistData;

    console.log("✅ Artist data fetched successfully:", cleanedData.name);

    return NextResponse.json({
      success: true,
      data: cleanedData,
      rawData: artistData, // Include raw data for debugging
    });
  } catch (error) {
    console.error("❌ Error fetching RA artist:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
