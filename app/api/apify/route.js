import { ApifyClient } from "apify-client";
import { NextResponse } from "next/server";

export async function POST(req) {
  const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
  });

  try {
    const { url, urls, maxItems = 50 } = await req.json();

    const urlList = Array.isArray(urls)
      ? urls.filter(Boolean)
      : url
        ? [url]
        : [];

    if (urlList.length === 0) {
      return NextResponse.json(
        { error: "At least one URL is required" },
        { status: 400 },
      );
    }

    const collected = [];
    const runIds = [];
    const runs = [];
    const seen = new Set();

    for (const currentUrl of urlList) {
      console.log("🚀 Starting Apify actor:", currentUrl);

      const input = {
        startUrls: [{ url: currentUrl }],
        maxItems,
        maxConcurrency: 1,
        maxRequestsPerCrawl: 15,
        proxyConfiguration: {
          useApifyProxy: true,
          apifyProxyGroups: ["RESIDENTIAL"],
        },
        debugMode: false,
        typeQuery: "artist",
        typeEvents: "upcoming",
      };

      // Run Actor and wait for completion
      const run = await client.actor("Ai7Xm7cH2PZHcaU7p").call(input);
      runIds.push(run.id);

      console.log("✅ Actor finished:", run.id);

      const { items } = await client.dataset(run.defaultDatasetId).listItems();

      console.log("📦 Dataset items:", items.length);
      if (items.length > 0) {
        console.log("🧾 First item:", JSON.stringify(items[0], null, 2));
      }

      let collectedForUrl = 0;
      for (const event of items) {
        const key = `${event.eventId ?? "no-id"}-${event.url ?? "no-url"}`;
        if (seen.has(key)) continue;
        seen.add(key);
        collected.push(event);
        collectedForUrl += 1;
      }

      runs.push({
        url: currentUrl,
        runId: run.id,
        totalItems: items.length,
        collected: collectedForUrl,
      });
    }

    const minimalEvents = collected.map((event) => ({
      title: event.title ?? null,
      url: event.url ?? null,
      eventId: event.eventId ?? null,
      artistId: event.artistId ?? null,
      artistName: event.artistName ?? null,
      artistImage: event.artistImage ?? null,
      venueName: event.venueName ?? null,
      venueCity: event.venueCity ?? null,
      venueAddress: event.venueAddress ?? null,
      timezone: event.timezone ?? null,
      startTime: event.startTime ?? null,
      startsAt: event.startsAt || event.starts_at || null,
      endsAt: event.endsAt || event.ends_at || null,
      ticketUrl: event.ticketUrl ?? null,
      ticketText: event.ticketText ?? null,
      lat: event.lat ?? null,
      lon: event.lon ?? null,
    }));

    console.log("✅ Filtered events:", minimalEvents.length);
    console.log("🧾 Filtered data:", JSON.stringify(minimalEvents, null, 2));
    console.log("🧾 Runs:", JSON.stringify(runs, null, 2));

    return NextResponse.json({
      success: true,
      runIds,
      runs,
      filtered: minimalEvents.length,
      data: minimalEvents,
    });
  } catch (error) {
    console.error("❌ Apify error:", error);

    return NextResponse.json(
      {
        error: "Failed to scrape data",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
