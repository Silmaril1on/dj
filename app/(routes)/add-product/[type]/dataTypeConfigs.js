import { formConfigs } from "@/app/helpers/formData/formConfigs";

/**
 * Extract a usable image string from either a legacy string URL or the new
 * JSONB {sm, md, lg} object. Falls back to lg → md → sm → "".
 */
const resolveImageUrl = (imageUrl, size = "lg") => {
  if (!imageUrl) return "";
  if (typeof imageUrl === "string") {
    if (imageUrl.trimStart().startsWith("{")) {
      try {
        const parsed = JSON.parse(imageUrl);
        return parsed[size] || parsed.lg || parsed.md || parsed.sm || "";
      } catch {
        /* not JSON */
      }
    }
    return imageUrl;
  }
  if (typeof imageUrl === "object") {
    return imageUrl[size] || imageUrl.lg || imageUrl.md || imageUrl.sm || "";
  }
  return "";
};

/**
 * Central configuration for all submittable data types.
 * Adding a new type requires only a new entry here — no new route or component needed.
 */
export const DATA_TYPE_CONFIGS = {
  artist: {
    formConfigKey: "addArtist",
    termsType: "artist",
    title: { add: "Add Artist", edit: "Edit Artist" },
    description: {
      add: "Submit a new artist to our platform",
      edit: "Update your artist information",
    },
    submitText: { add: "Submit Artist", edit: "Update Artist" },
    api: {
      fetch: (id) => `/api/artists/artist-profile?id=${id}`,
      submit: "/api/artists/artist-profile",
      update: "/api/artists/artist-profile",
    },
    idParam: "artistId",
    submissionGuard: {
      field: "submitted_artist_id",
      title: "You have already submitted an artist",
      description:
        "You can only submit one artist profile. To edit your submission, use the edit link or contact support.",
      adminBypass: true,
    },
    mapInitialData: (data, defaults) => ({
      ...defaults,
      name: data.name || "",
      stage_name: data.stage_name || "",
      artist_slug: data.artist_slug || "",
      country: data.country || "",
      city: data.city || "",
      sex: data.sex || "",
      is_band: data.is_band ? "true" : "false",
      birth: data.birth || "",
      desc: data.desc || data.description || "",
      bio: data.bio || "",
      genres: data.genres || [""],
      social_links: data.social_links || [""],
      label: data.label || [""],
      artist_image: resolveImageUrl(data.image_url, "sm"),
    }),
    extractData: (json) => json.artist,
    mapSuccessPayload: (result) => ({
      type: "artist",
      image: resolveImageUrl(result.data?.image_url),
      name: result.data?.name || "",
      stage_name: result.data?.stage_name || "",
      country: result.data?.country || "",
      city: result.data?.city || "",
    }),
    beforeSubmit: (formData) => {
      const isBand = formData.get("is_band");
      if (isBand === "true") formData.set("birth", "");

      const rawSlug = formData.get("artist_slug");
      if (typeof rawSlug === "string") {
        formData.set("artist_slug", rawSlug.trim().toLowerCase());
      }
    },
  },

  club: {
    formConfigKey: "addClub",
    termsType: "club",
    title: { add: "Add Club", edit: "Edit Club" },
    description: {
      add: "Submit a new club to our platform",
      edit: "Update your club information",
    },
    submitText: { add: "Submit Club", edit: "Update Club" },
    api: {
      fetch: (id) => `/api/club/single-club?id=${id}`,
      submit: "/api/club",
      update: "/api/club",
    },
    idParam: "clubId",
    extractData: (json) => json.club,
    submissionGuard: {
      field: "submitted_club_id",
      title: "You have already submitted a club",
      description:
        "You can only submit one club profile. To edit your submission, use the edit link or contact support.",
      adminBypass: true,
    },
    mapInitialData: (data, defaults) => {
      const normalize = (v) => (Array.isArray(v) && v.length > 0 ? v : [""]);
      return {
        ...defaults,
        name: data.name || "",
        club_slug: data.club_slug || "",
        country: data.country || "",
        city: data.city || "",
        address: data.address || "",
        description: data.description || "",
        club_image: resolveImageUrl(data.image_url, "sm"),
        social_links: normalize(data.social_links),
        residents: normalize(data.residents),
        capacity: data.capacity || "",
        location_url: data.location_url || "",
        venue_email: data.venue_email || "",
      };
    },
    mapSuccessPayload: (result) => ({
      type: "club",
      image: resolveImageUrl(result.data?.image_url),
      name: result.data?.name || "",
      country: result.data?.country || "",
      city: result.data?.city || "",
      address: result.data?.address || "",
      description: result.data?.description || "",
    }),
    beforeSubmit: (formData) => {
      const rawSlug = formData.get("club_slug");
      if (typeof rawSlug === "string") {
        formData.set("club_slug", rawSlug.trim().toLowerCase());
      }
    },
  },

  event: {
    formConfigKey: "addEvent",
    termsType: "event",
    title: { add: "Add Event", edit: "Edit Event" },
    description: {
      add: "Create a new event and share it with the community",
      edit: "Update your event information",
    },
    submitText: { add: "Create Event", edit: "Update Event" },
    api: {
      fetch: (id) => `/api/events/single-event?id=${id}`,
      submit: "/api/events",
      update: "/api/events",
    },
    idParam: "eventId",
    extractData: (json) => json,
    prefillParams: ["venue_name", "address", "location_url", "country", "city"],
    mapInitialData: (data, defaults) => {
      const mapped = Object.fromEntries(
        Object.entries(defaults).map(([key, defaultValue]) => [
          key,
          data[key] !== undefined && data[key] !== null
            ? data[key]
            : defaultValue,
        ]),
      );
      // Map image_url JSONB to the event_image field (sm for preview)
      mapped.event_image = resolveImageUrl(data.image_url, "sm");
      // artists come back as objects {name, id, artist_slug} from the API — flatten to strings
      if (Array.isArray(mapped.artists) && mapped.artists.length > 0) {
        mapped.artists = mapped.artists.map((a) =>
          typeof a === "object" && a !== null ? a.name || "" : a,
        );
      }
      return mapped;
    },
    mapSuccessPayload: (result) => ({
      type: "event",
      image: resolveImageUrl(result.data?.image_url),
      name: result.data?.event_name || "",
      country: result.data?.country || "",
      city: result.data?.city || "",
      address: result.data?.address || "",
      description: result.data?.description || "",
      date: result.data?.date || "",
      promoter: result.data?.promoter || "",
    }),
  },

  festival: {
    formConfigKey: "addFestival",
    termsType: "festival",
    title: { add: "Add Festival", edit: "Edit Festival" },
    description: {
      add: "Submit a new festival to our platform",
      edit: "Update your festival information",
    },
    submitText: { add: "Submit Festival", edit: "Update Festival" },
    api: {
      fetch: (id) => `/api/festivals?id=${id}`,
      submit: "/api/festivals",
      update: "/api/festivals",
    },
    idParam: "festivalId",
    extractData: (json) => json.festival,
    submissionGuard: {
      field: "submitted_festival_id",
      title: "You have already submitted a festival",
      description:
        "You can only submit one festival profile. To edit your submission, use the edit link or contact support.",
    },
    mapInitialData: (data, defaults) => ({
      ...defaults,
      name: data.name || "",
      festival_slug: data.festival_slug || "",
      description: data.description || "",
      bio: data.bio || "",
      poster: resolveImageUrl(data.image_url, "sm"),
      map_image_url: resolveImageUrl(data.map_image_url, "md"),
      start_date: data.start_date || "",
      end_date: data.end_date || "",
      location_url: data.location_url || "",
      address: data.address || "",
      capacity_total: data.capacity_total || "",
      country: data.country || "",
      city: data.city || "",
      minimum_age: data.minimum_age != null ? String(data.minimum_age) : "",
      festival_genre: data.festival_genre?.length ? data.festival_genre : [""],
      social_links: data.social_links || [""],
    }),
    mapSuccessPayload: (result) => ({
      type: "festival",
      image: resolveImageUrl(result.data?.image_url),
      name: result.data?.name || "",
      country: result.data?.country || "",
      city: result.data?.city || "",
      location_url: result.data?.location_url || "",
      description: result.data?.description || "",
    }),
    beforeSubmit: (formData) => {
      const rawSlug = formData.get("festival_slug");
      if (typeof rawSlug === "string") {
        formData.set("festival_slug", rawSlug.trim().toLowerCase());
      }
    },
  },

  news: {
    formConfigKey: "addNews",
    termsType: "event",
    title: { add: "Add News", edit: "Edit News" },
    description: {
      add: "Submit a news article to the platform",
      edit: "Update news article",
    },
    submitText: { add: "Submit News", edit: "Update News" },
    api: {
      fetch: (id) => `/api/news/single-news?id=${id}`,
      submit: "/api/news",
      update: "/api/news",
    },
    idParam: "newsId",
    extractData: (json) => json.news,
    mapInitialData: (data, defaults) => ({
      ...defaults,
      title: data.title || "",
      content: data.content || "",
      description: data.description || "",
      news_image: data.news_image || "",
      link: data.link || "",
    }),
    mapSuccessPayload: (result) => ({
      type: "news",
      image:
        resolveImageUrl(result.data?.news_image) ||
        resolveImageUrl(result.data?.image_url),
      title: result.data?.title || "",
      description: result.data?.description || "",
    }),
  },
};

export const VALID_TYPES = Object.keys(DATA_TYPE_CONFIGS);

export const getFormConfig = (type, entityData, prefill = {}) => {
  const config = DATA_TYPE_CONFIGS[type];
  if (!config) return null;

  const baseFormConfig = formConfigs[config.formConfigKey];
  if (!baseFormConfig) return null;

  if (entityData && config.mapInitialData) {
    return {
      ...baseFormConfig,
      initialData: config.mapInitialData(
        entityData,
        baseFormConfig.initialData,
      ),
    };
  }

  // Apply URL prefill params (e.g., event prefill from club page)
  if (Object.keys(prefill).length > 0) {
    return {
      ...baseFormConfig,
      initialData: { ...baseFormConfig.initialData, ...prefill },
    };
  }

  return baseFormConfig;
};
