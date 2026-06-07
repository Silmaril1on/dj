import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { parseLatLng } from "@/app/helpers/parseLocationUrl";

const FESTIVAL_SELECT = `
  id,
  festival_id,
  start_date,
  end_date,
  status,
  festivals!inner(
    id,
    name,
    country,
    city,
    location_url,
    image_url,
    festival_genre,
    status
  )
`;

const CONFIG_SELECT =
  "id, entity_id, edition_id, lineup, asset_url, custom_text, extra_note, created_at";
const ASSET_BUCKET = "generate_assets";
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const toDateOnly = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    monthLabel: start.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    }),
    startDate: toDateOnly(start),
    endDate: toDateOnly(end),
  };
};

const resolveImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (typeof imageUrl === "string") {
    if (imageUrl.trimStart().startsWith("{")) {
      try {
        const parsed = JSON.parse(imageUrl);
        return parsed.md || parsed.lg || parsed.sm || null;
      } catch {}
    }
    return imageUrl;
  }
  return imageUrl.md || imageUrl.lg || imageUrl.sm || null;
};

const normalizeLineupRows = (rows = []) => {
  const byEdition = {};

  rows.forEach((row) => {
    const key = row.edition_id || row.festival_id;
    if (!key) return;
    if (!byEdition[key]) byEdition[key] = [];
    if (byEdition[key].length < 8 && row.artist_name) {
      byEdition[key].push(row.artist_name);
    }
  });

  return byEdition;
};

const uploadVideoAsset = async (file, entityId) => {
  if (!file || typeof file === "string" || file.size === 0) return null;

  if (!file.type?.startsWith("video/")) {
    return { error: "Please upload a valid video file" };
  }

  if (file.size > MAX_VIDEO_SIZE) {
    return { error: "Video size must be less than 100MB" };
  }

  const extension = (file.name || "mp4").split(".").pop()?.toLowerCase();
  const safeExtension = extension?.replace(/[^a-z0-9]/g, "") || "mp4";
  const fileName = `reel_configs/${entityId}_${Date.now()}.${safeExtension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from(ASSET_BUCKET)
    .upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(ASSET_BUCKET).getPublicUrl(fileName);

  return { url: publicUrl };
};

async function requireAdmin() {
  const cookieStore = await cookies();
  const { user } = await getServerUser(cookieStore);

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!user.is_admin) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user };
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { startDate, endDate, monthLabel } = getMonthRange();

    const { data: editions, error } = await supabaseAdmin
      .from("festival_editions")
      .select(FESTIVAL_SELECT)
      .in("status", ["upcoming", "past"])
      .eq("festivals.status", "approved")
      .gte("start_date", startDate)
      .lte("start_date", endDate)
      .order("start_date", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch this month's festivals" },
        { status: 500 },
      );
    }

    const safeEditions = editions || [];
    const editionIds = safeEditions.map((edition) => edition.id);
    const festivalIds = safeEditions.map((edition) => edition.festival_id);

    const [{ data: lineupRows }, { data: configRows, error: configError }] =
      await Promise.all([
        editionIds.length
          ? supabaseAdmin
              .from("festival_lineup")
              .select("festival_id, edition_id, artist_name, artist_order")
              .in("edition_id", editionIds)
              .order("artist_order", { ascending: true })
          : { data: [] },
        festivalIds.length
          ? supabaseAdmin
              .from("reel_configs")
              .select(CONFIG_SELECT)
              .in("entity_id", festivalIds)
              .order("created_at", { ascending: false })
          : { data: [], error: null },
      ]);

    if (configError) {
      return NextResponse.json(
        { error: "Failed to fetch reel configs" },
        { status: 500 },
      );
    }

    const lineupByEdition = normalizeLineupRows(lineupRows || []);
    const configByFestival = new Map();
    (configRows || []).forEach((config) => {
      const key = `${config.entity_id}:${config.edition_id || "none"}`;
      if (!configByFestival.has(key)) configByFestival.set(key, config);
    });

    const festivals = safeEditions
      .map((edition) => {
        const festival = edition.festivals;
        if (!festival) return null;

        const config =
          configByFestival.get(`${festival.id}:${edition.id}`) ||
          configByFestival.get(`${festival.id}:none`) ||
          null;
        const coords = parseLatLng(festival.location_url);
        const genre = Array.isArray(festival.festival_genre)
          ? festival.festival_genre[0]
          : null;

        return {
          id: festival.id,
          edition_id: edition.id,
          name: festival.name,
          country: festival.country,
          city: festival.city,
          start_date: edition.start_date,
          end_date: edition.end_date,
          status: edition.status,
          location_url: festival.location_url,
          image_url: resolveImageUrl(festival.image_url),
          genre: genre || "Electronic Music",
          artists: lineupByEdition[edition.id] || [],
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          reel_config: config,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ festivals, monthLabel, startDate, endDate });
  } catch (error) {
    console.error("[admin/reel-configs] GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const formData = await request.formData();
    const entityId = formData.get("entity_id");
    const editionId = formData.get("edition_id") || null;

    if (!entityId) {
      return NextResponse.json(
        { error: "entity_id is required" },
        { status: 400 },
      );
    }

    const parseLineup = () => {
      const raw = formData.get("lineup");
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed)
          ? parsed.map((item) => String(item).trim()).filter(Boolean).slice(0, 8)
          : [];
      } catch {
        return String(raw)
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 8);
      }
    };

    const payload = {
      entity_id: entityId,
      edition_id: editionId,
      lineup: parseLineup(),
      asset_url: formData.get("asset_url")?.trim() || null,
      custom_text: formData.get("custom_text")?.trim() || null,
      extra_note: formData.get("extra_note")?.trim() || null,
    };

    const videoUpload = await uploadVideoAsset(formData.get("asset_file"), entityId);
    if (videoUpload?.error) {
      return NextResponse.json({ error: videoUpload.error }, { status: 400 });
    }
    if (videoUpload?.url) {
      payload.asset_url = videoUpload.url;
    }

    let existingQuery = supabaseAdmin
      .from("reel_configs")
      .select("id")
      .eq("entity_id", entityId)
      .limit(1);

    existingQuery = editionId
      ? existingQuery.eq("edition_id", editionId)
      : existingQuery.is("edition_id", null);

    const { data: existingRows, error: findError } = await existingQuery;

    if (findError) {
      return NextResponse.json(
        { error: "Failed to check existing reel config" },
        { status: 500 },
      );
    }

    const existingId = existingRows?.[0]?.id;
    const query = existingId
      ? supabaseAdmin
          .from("reel_configs")
          .update(payload)
          .eq("id", existingId)
          .select(CONFIG_SELECT)
          .single()
      : supabaseAdmin
          .from("reel_configs")
          .insert(payload)
          .select(CONFIG_SELECT)
          .single();

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to save reel config" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, config: data });
  } catch (error) {
    console.error("[admin/reel-configs] POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
