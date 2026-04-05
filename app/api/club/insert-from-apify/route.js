import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  supabaseAdmin,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";

const generateSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const buildLocationUrl = (venue) => {
  const lat = venue?.location?.latitude;
  const lon = venue?.location?.longitude;

  if (lat == null || lon == null) return null;
  return `https://www.google.com/maps?q=${lat},${lon}`;
};

const extractSocialLinks = (venue) => {
  if (!Array.isArray(venue?.promotionalLinks)) return [];

  const links = venue.promotionalLinks
    .map((link) => link?.url)
    .filter((link) => typeof link === "string" && link.trim() !== "")
    .map((link) => link.trim());

  return [...new Set(links)];
};

export async function POST(req) {
  try {
    const { events } = await req.json();

    console.log("📥 /api/club/insert-from-apify request", {
      eventsCount: Array.isArray(events) ? events.length : 0,
    });

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: "Events array is required" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("🔒 Auth failed for club insert", {
        hasUser: !!user,
        error: userError?.message,
      });
      return NextResponse.json(
        { error: "You must be logged in to insert clubs" },
        { status: 401 },
      );
    }

    console.log("✅ Auth OK for club insert", { userId: user.id });
    console.log("🔐 Using service-role client for club insert");

    const insertedClubs = [];
    const errors = [];

    for (const [index, event] of events.entries()) {
      try {
        const venue = event?.venue || {};
        const name = venue?.name?.trim() || null;

        console.log("🧭 Processing venue", {
          index,
          eventId: event?.id || null,
          eventTitle: event?.title || null,
          venueName: name,
        });

        if (!name) {
          errors.push({
            event: event?.title || event?.id || "Unknown",
            error: "Missing venue name",
          });
          continue;
        }

        const country = venue?.area?.country?.name || null;
        let city = venue?.area?.name || null;

        if (!city || city.toLowerCase() === "all") {
          city = "Not specified";
        }

        const address = venue?.address || null;
        const locationUrl = buildLocationUrl(venue);
        const socialLinks = extractSocialLinks(venue);

        console.log("🧩 Mapped club fields", {
          name,
          country,
          city,
          address,
          locationUrl,
          socialLinksCount: socialLinks.length,
        });

        let duplicateQuery = supabaseAdmin
          .from("clubs")
          .select("id, name, address, city")
          .eq("name", name);

        const { data: existingClub, error: duplicateError } =
          await duplicateQuery.maybeSingle();

        if (duplicateError) {
          console.error("Error checking club duplicate:", duplicateError);
        } else {
          console.log("🔎 Duplicate check", {
            name,
            address,
            city,
            found: !!existingClub,
          });
        }

        if (existingClub) {
          errors.push({
            event: name,
            error: "Club already exists in database",
          });
          continue;
        }

        const clubData = {
          user_id: null,
          country,
          city,
          capacity: null,
          description: null,
          social_links: null,
          status: "pending",
          club_image: null,
          address,
          residents: null,
          location_url: locationUrl,
          venue_email: null,
          name,
          club_slug: generateSlug(name),
        };

        const { data: insertedData, error: insertError } = await supabaseAdmin
          .from("clubs")
          .insert(clubData)
          .select()
          .single();

        if (insertError) {
          console.error("❌ Club insert failed", {
            name,
            error: insertError.message,
          });
          errors.push({
            event: name,
            error: insertError.message,
          });
        } else {
          console.log("✅ Club inserted", { id: insertedData?.id, name });
          insertedClubs.push(insertedData);
        }
      } catch (eventError) {
        console.error("❌ Club insert processing error", {
          event: event?.title || event?.id || "Unknown",
          error: eventError.message,
        });
        errors.push({
          event: event?.title || event?.id || "Unknown",
          error: eventError.message,
        });
      }
    }

    if (insertedClubs.length > 0) {
      console.log("♻️ Revalidating clubs tag", {
        insertedCount: insertedClubs.length,
      });
      revalidateTag("clubs");
    }

    console.log("📤 Club insert summary", {
      inserted: insertedClubs.length,
      total: events.length,
      errorCount: errors.length,
    });

    return NextResponse.json({
      success: true,
      inserted: insertedClubs.length,
      total: events.length,
      data: insertedClubs,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("❌ Club insert error:", error);
    return NextResponse.json(
      { error: "Failed to insert clubs", details: error.message },
      { status: 500 },
    );
  }
}
