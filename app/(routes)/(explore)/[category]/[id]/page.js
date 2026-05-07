import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { CATEGORY_CONFIGS, VALID_CATEGORIES } from "../../categoryConfigs";
import SingleDataProfile from "@/app/(routes)/(explore)/[category]/[id]/SingleDataProfile";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import JsonLd from "@/app/components/ui/JsonLd";

export const dynamic = "force-dynamic";

const IS_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveMetaImage(imageUrl) {
  if (!imageUrl) return null;
  if (typeof imageUrl === "object")
    return imageUrl.lg || imageUrl.md || imageUrl.sm || null;
  return imageUrl;
}

export async function generateMetadata({ params }) {
  const { category, id } = await params;
  const PROJECT_URL = process.env.PROJECT_URL;
  const defaultMeta = CATEGORY_CONFIGS[category]?.metadata.profile || {};

  try {
    if (category === "clubs") {
      const isUUID = IS_UUID.test(id);
      const { data } = await supabaseAdmin
        .from("clubs")
        .select("name, description, image_url, club_slug")
        .eq(isUUID ? "id" : "club_slug", id)
        .single();
      if (!data) return defaultMeta;
      const slug = data.club_slug || id;
      const name = data.name || "Club";
      const description =
        data.description?.substring(0, 160) || `Explore ${name} on Soundfolio.`;
      const image =
        resolveMetaImage(data.image_url) ||
        `${PROJECT_URL}/assets/default-club.jpg`;
      return {
        title: `Soundfolio | ${name}`,
        description,
        openGraph: {
          title: `${name} | Soundfolio`,
          description,
          type: "website",
          url: `${PROJECT_URL}/clubs/${slug}`,
          images: [{ url: image, width: 1200, height: 630, alt: name }],
          siteName: "Soundfolio",
        },
        twitter: {
          card: "summary_large_image",
          title: `${name} | Soundfolio`,
          description,
          images: [image],
        },
      };
    }

    if (category === "festivals") {
      const isUUID = IS_UUID.test(id);
      const { data } = await supabaseAdmin
        .from("festivals")
        .select("name, description, image_url, festival_slug")
        .eq(isUUID ? "id" : "festival_slug", id)
        .single();
      if (!data) return defaultMeta;
      const slug = data.festival_slug || id;
      const name = data.name || "Festival";
      const description =
        data.description?.substring(0, 160) ||
        `Discover ${name} on Soundfolio.`;
      const image =
        resolveMetaImage(data.image_url) ||
        `${PROJECT_URL}/assets/default-festival.jpg`;
      return {
        title: `Soundfolio | ${name}`,
        description,
        openGraph: {
          title: `${name} | Soundfolio`,
          description,
          type: "website",
          url: `${PROJECT_URL}/festivals/${slug}`,
          images: [{ url: image, width: 1200, height: 630, alt: name }],
          siteName: "Soundfolio",
        },
        twitter: {
          card: "summary_large_image",
          title: `${name} | Soundfolio`,
          description,
          images: [image],
        },
      };
    }

    if (category === "events") {
      const isUUID = IS_UUID.test(id);
      const { data } = await supabaseAdmin
        .from("events")
        .select(
          "event_name, venue_name, description, image_url, artists, event_slug",
        )
        .eq(isUUID ? "id" : "event_slug", id)
        .single();
      if (!data) return defaultMeta;
      const slug = data.event_slug || id;
      const displayName = data.venue_name || data.event_name || "Event";
      const description =
        data.description?.substring(0, 160) ||
        (Array.isArray(data.artists) && data.artists.length
          ? `Lineup: ${data.artists.slice(0, 3).join(", ")}${data.artists.length > 3 ? " and more" : ""}.`
          : "View event details on Soundfolio.");
      const image =
        resolveMetaImage(data.image_url) ||
        `${PROJECT_URL}/assets/default-event.jpg`;
      return {
        title: `Soundfolio | ${displayName}`,
        description,
        openGraph: {
          title: `${displayName} | Soundfolio`,
          description,
          type: "website",
          url: `${PROJECT_URL}/events/${slug}`,
          images: [{ url: image, width: 1200, height: 630, alt: displayName }],
          siteName: "Soundfolio",
        },
        twitter: {
          card: "summary_large_image",
          title: `${displayName} | Soundfolio`,
          description,
          images: [image],
        },
      };
    }
  } catch {
    // fall back to static metadata
  }

  return defaultMeta;
}

const ProfileNotFound = ({ label }) => (
  <div className="w-full flex justify-center items-center h-96">
    <div className="bg-stone-900 border border-red-400/30 rounded-lg p-8 text-center">
      <h2 className="text-red-400 text-2xl mb-2">{label} Not Found</h2>
      <p className="text-stone-300">
        This {label.toLowerCase()} does not exist.
      </p>
    </div>
  </div>
);

const ProfileError = ({ label }) => (
  <div className="w-full flex justify-center items-center h-96">
    <div className="bg-stone-900 border border-red-400/30 rounded-lg p-8 text-center">
      <h2 className="text-red-400 text-2xl mb-2">Error Loading {label}</h2>
      <p className="text-stone-300">Please try again later.</p>
    </div>
  </div>
);

const CategoryProfilePage = async ({ params }) => {
  const { category, id } = await params;

  if (!VALID_CATEGORIES.includes(category)) {
    notFound();
  }

  const config = CATEGORY_CONFIGS[category].profile;
  const label = category.charAt(0).toUpperCase() + category.slice(1, -1); // "clubs" → "Club"

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  try {
    const fetchOptions =
      typeof config.fetchOptions === "function"
        ? config.fetchOptions(id)
        : { ...config.fetchOptions };

    fetchOptions.headers = {
      ...fetchOptions.headers,
      Cookie: cookieHeader,
    };

    const response = await fetch(
      config.apiEndpoint(process.env.PROJECT_URL, id),
      fetchOptions,
    );

    const json = await response.json();
    const { data, currentUserId } = config.extractData(json);

    if (!data) {
      return <ProfileNotFound label={label} />;
    }

    const PROJECT_URL = process.env.PROJECT_URL;
    let jsonLdData = null;

    if (category === "clubs") {
      jsonLdData = {
        "@context": "https://schema.org",
        "@type": "NightClub",
        name: data.name,
        url: `${PROJECT_URL}/clubs/${data.club_slug || data.id}`,
        image: resolveMetaImage(data.image_url) || undefined,
        description: data.description?.substring(0, 200) || undefined,
        address: data.address
          ? {
              "@type": "PostalAddress",
              streetAddress: data.address,
              addressCountry: data.country,
            }
          : undefined,
      };
    } else if (category === "festivals") {
      jsonLdData = {
        "@context": "https://schema.org",
        "@type": "MusicEvent",
        name: data.name,
        url: `${PROJECT_URL}/festivals/${data.festival_slug || data.id}`,
        image: resolveMetaImage(data.image_url) || undefined,
        description: data.description?.substring(0, 200) || undefined,
        startDate: data.start_date || undefined,
        endDate: data.end_date || undefined,
        location:
          data.address || data.city
            ? {
                "@type": "Place",
                name: data.address || data.city,
                address: {
                  "@type": "PostalAddress",
                  addressLocality: data.city,
                  addressCountry: data.country,
                },
              }
            : undefined,
      };
    } else if (category === "events") {
      jsonLdData = {
        "@context": "https://schema.org",
        "@type": "Event",
        name: data.venue_name || data.event_name,
        url: `${PROJECT_URL}/events/${data.event_slug || data.id}`,
        image: resolveMetaImage(data.image_url) || undefined,
        startDate: data.date || undefined,
        location: data.venue_name
          ? {
              "@type": "Place",
              name: data.venue_name,
              address: {
                "@type": "PostalAddress",
                streetAddress: data.address,
                addressLocality: data.city,
                addressCountry: data.country,
              },
            }
          : undefined,
        performer:
          Array.isArray(data.artists) && data.artists.length
            ? data.artists.map((a) => ({
                "@type": "MusicGroup",
                name: typeof a === "string" ? a : a.name,
              }))
            : undefined,
      };
    }

    return (
      <>
        {jsonLdData && <JsonLd data={jsonLdData} />}
        <SingleDataProfile
          data={data}
          type={config.type}
          currentUserId={currentUserId}
        />
      </>
    );
  } catch {
    return <ProfileError label={label} />;
  }
};

export default CategoryProfilePage;
