import { NextResponse } from "next/server";
import { runApifyActor } from "../apifyApi";

export async function POST(req) {
  try {
    const { url, urls, maxItems = 0 } = await req.json();

    // Support both single URL and multiple URLs
    const urlArray = urls || (url ? [url] : []);

    if (!urlArray || urlArray.length === 0) {
      return NextResponse.json({ error: "URL(s) required" }, { status: 400 });
    }

    console.log("🚀 Starting RA Events scrape for URLs:", urlArray);

    // Prepare Actor input for RA Events with multiple URLs
    const input = {
      startUrls: urlArray.map((url) => ({ url })),
      proxyConfiguration: {
        useApifyProxy: false,
      },
      maxItems: maxItems,
      enforceMaxItems: true,
      maxErrors: 0,
      maxDuration: 0,
      downloadDelay: 1500,
    };

    console.log("⏳ Running RA Events Apify actor...");
    const { run, items } = await runApifyActor("YdJ5E7Ofhy8QgcXUs", input);
    console.log("✅ Actor run completed. Run ID:", run.id);

    console.log("📊 Results retrieved:");
    console.log("   - Total items:", items.length);
    console.log("\n📋 Full Results:");
    console.log(JSON.stringify(items, null, 2));
    console.log("\n" + "=".repeat(80) + "\n");

    return NextResponse.json({
      success: true,
      data: items,
      runId: run.id,
    });
  } catch (error) {
    console.error("Apify RA Events error:", error);
    return NextResponse.json(
      { error: "Failed to scrape RA events data", details: error.message },
      { status: 500 },
    );
  }
}
