import { ApifyClient } from "apify-client";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { url, maxItems = 0 } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    console.log("🚀 Starting RA Events scrape for URL:", url);

    // Initialize the ApifyClient with API token
    const client = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });

    // Prepare Actor input for RA Events
    const input = {
      startUrls: [
        {
          url: url,
        },
      ],
      proxyConfiguration: {
        useApifyProxy: false,
      },
      maxItems: maxItems,
      enforceMaxItems: true,
      maxErrors: 0,
      maxDuration: 0,
      downloadDelay: 1500,
    };

    // Run the Actor and wait for it to finish
    console.log("⏳ Running RA Events Apify actor...");
    const run = await client.actor("YdJ5E7Ofhy8QgcXUs").call(input);
    console.log("✅ Actor run completed. Run ID:", run.id);

    // Fetch and print Actor results from the run's dataset (if any)
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

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
      { status: 500 }
    );
  }
}
