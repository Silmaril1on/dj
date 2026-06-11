const APIFY_BASE_URL = "https://api.apify.com/v2";

export async function runApifyActor(actorId, input) {
  const token = process.env.APIFY_API_TOKEN;

  if (!token) {
    throw new Error("Apify API token not configured");
  }

  const runResponse = await fetch(
    `${APIFY_BASE_URL}/acts/${actorId}/runs?token=${token}&waitForFinish=300`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );

  if (!runResponse.ok) {
    const errorText = await runResponse.text();
    throw new Error(`Apify run failed: ${runResponse.status} ${errorText}`);
  }

  const runPayload = await runResponse.json();
  const run = runPayload.data ?? runPayload;

  if (!run?.defaultDatasetId) {
    throw new Error("Apify run finished without a dataset");
  }

  const itemsResponse = await fetch(
    `${APIFY_BASE_URL}/datasets/${run.defaultDatasetId}/items?token=${token}&clean=true`,
  );

  if (!itemsResponse.ok) {
    const errorText = await itemsResponse.text();
    throw new Error(
      `Apify dataset fetch failed: ${itemsResponse.status} ${errorText}`,
    );
  }

  const items = await itemsResponse.json();

  return {
    run,
    items: Array.isArray(items) ? items : [],
  };
}
