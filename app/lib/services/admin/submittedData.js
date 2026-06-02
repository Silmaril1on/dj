import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

/** Resolve JSONB {sm,md,lg} or legacy string URL → single string for display */
function _resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (typeof imageUrl === "string") return imageUrl;
  if (typeof imageUrl === "object") {
    return imageUrl.lg || imageUrl.md || imageUrl.sm || null;
  }
  return null;
}

// Central config for each submittable data type.
// Adding a new type only requires a new entry here.
const TYPE_CONFIGS = {
  artist: {
    table: "artists",
    select: `
      id, name, stage_name, status, created_at, image_url,
      country, city, user_id,
      users:user_id(id, userName, email, user_avatar)
    `,
    mapItem: (item) => ({
      id: item.id,
      name: item.name,
      stage_name: item.stage_name,
      artist_image: _resolveImageUrl(item.image_url),
      country: item.country,
      city: item.city,
      created_at: item.created_at,
      submitter: item.users
        ? {
            id: item.users.id,
            userName: item.users.userName,
            email: item.users.email,
            user_avatar: item.users.user_avatar,
          }
        : null,
    }),
  },

  club: {
    table: "clubs",
    select: `
      id, name, country, city, capacity, status, created_at, image_url,
      description, address, location_url, social_links, user_id,
      users:user_id(id, userName, email, user_avatar)
    `,
    mapItem: (item) => ({
      id: item.id,
      name: item.name,
      artist_image: _resolveImageUrl(item.image_url),
      country: item.country,
      city: item.city,
      capacity: item.capacity,
      address: item.address,
      location_url: item.location_url,
      social_links: item.social_links,
      description: item.description,
      created_at: item.created_at,
      submitter: item.users
        ? {
            id: item.users.id,
            userName: item.users.userName,
            email: item.users.email,
            user_avatar: item.users.user_avatar,
          }
        : null,
    }),
  },

  event: {
    table: "events",
    select: `
      id, event_name, promoter, image_url, country, city, status,
      created_at, description, user_id,
      users:user_id(id, userName, email, user_avatar)
    `,
    mapItem: (item) => ({
      id: item.id,
      name: item.event_name,
      stage_name: item.promoter,
      artist_image: _resolveImageUrl(item.image_url),
      country: item.country,
      city: item.city,
      description: item.description,
      created_at: item.created_at,
      submitter: item.users
        ? {
            id: item.users.id,
            userName: item.users.userName,
            email: item.users.email,
            user_avatar: item.users.user_avatar,
          }
        : null,
    }),
  },

  festival: {
    table: "festivals",
    select: `
      id, name, country, city, location_url, address,
      capacity_total, status, created_at, image_url, description, social_links, user_id,
      users:user_id(id, userName, email, user_avatar)
    `,
    mapItem: (item) => ({
      id: item.id,
      name: item.name,
      address: item.address,
      location_url: item.location_url,
      capacity_total: item.capacity_total,
      artist_image: _resolveImageUrl(item.image_url),
      country: item.country,
      city: item.city,
      social_links: item.social_links,
      description: item.description,
      created_at: item.created_at,
      submitter: item.users
        ? {
            id: item.users.id,
            userName: item.users.userName,
            email: item.users.email,
            user_avatar: item.users.user_avatar,
          }
        : null,
    }),
  },
};

const parseDateValue = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getEditionSortValue = (edition) => {
  const parsed =
    parseDateValue(edition?.start_date) ||
    parseDateValue(edition?.end_date) ||
    (edition?.edition_year ? new Date(`${edition.edition_year}-12-31`) : null);
  return parsed ? parsed.getTime() : null;
};

const pickCurrentEdition = (editions) => {
  if (!Array.isArray(editions) || editions.length === 0) return null;

  const upcoming = editions.filter((e) => e.status === "upcoming");
  if (upcoming.length > 0) {
    return upcoming.slice().sort((a, b) => {
      const aValue = getEditionSortValue(a);
      const bValue = getEditionSortValue(b);
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      return aValue - bValue;
    })[0];
  }

  return editions.slice().sort((a, b) => {
    const aValue = getEditionSortValue(a);
    const bValue = getEditionSortValue(b);
    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return 1;
    if (bValue === null) return -1;
    return bValue - aValue;
  })[0];
};

export const VALID_SUBMISSION_TYPES = Object.keys(TYPE_CONFIGS);

const ACTION_STATUS_MAP = {
  approve: "approved",
  decline: "declined",
};

const getStatusFromAction = (action) => {
  const status = ACTION_STATUS_MAP[action];
  if (!status) {
    throw new Error("Action must be 'approve' or 'decline'");
  }
  return status;
};

export async function getSubmissions(type) {
  const config = TYPE_CONFIGS[type];
  if (!config) throw new Error(`Unknown submission type: ${type}`);

  const { data, error } = await supabaseAdmin
    .from(config.table)
    .select(config.select)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const mapped = (data || []).map(config.mapItem);

  if (type !== "festival" || mapped.length === 0) {
    return { submissions: mapped };
  }

  const festivalIds = mapped.map((item) => item.id);
  const { data: editionsData, error: editionsError } = await supabaseAdmin
    .from("festival_editions")
    .select("id, festival_id, edition_year, start_date, end_date, status")
    .in("festival_id", festivalIds);

  if (editionsError) throw new Error(editionsError.message);

  const editionsMap = new Map();
  (editionsData || []).forEach((edition) => {
    const list = editionsMap.get(edition.festival_id) || [];
    list.push(edition);
    editionsMap.set(edition.festival_id, list);
  });

  const submissions = mapped.map((item) => {
    const editions = editionsMap.get(item.id) || [];
    const currentEdition = pickCurrentEdition(editions);
    return {
      ...item,
      start_date: currentEdition?.start_date || null,
      end_date: currentEdition?.end_date || null,
      edition_id: currentEdition?.id || null,
      edition_status: currentEdition?.status || null,
      edition_year: currentEdition?.edition_year || null,
    };
  });

  return { submissions };
}

export async function updateSubmission(type, id, action) {
  const config = TYPE_CONFIGS[type];
  if (!config) throw new Error(`Unknown submission type: ${type}`);

  if (action === "decline") {
    const { error } = await supabaseAdmin
      .from(config.table)
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true, message: `${type} declined and removed` };
  }

  const newStatus = getStatusFromAction(action);
  const { error } = await supabaseAdmin
    .from(config.table)
    .update({ status: newStatus })
    .eq("id", id);

  if (error) throw new Error(error.message);

  return { success: true, message: `${type} ${action}d successfully` };
}

export async function updateAllSubmissions(type, action = "approve") {
  const config = TYPE_CONFIGS[type];
  if (!config) throw new Error(`Unknown submission type: ${type}`);

  if (action === "decline") {
    // Delete all pending submissions instead of just changing their status
    const { data, error } = await supabaseAdmin
      .from(config.table)
      .delete()
      .eq("status", "pending")
      .select("id");

    if (error) throw new Error(error.message);

    const deletedCount = data?.length || 0;
    return {
      success: true,
      updatedCount: deletedCount,
      message: `${deletedCount} ${type} submission${deletedCount !== 1 ? "s" : ""} deleted successfully`,
    };
  }

  const newStatus = getStatusFromAction(action);
  const { data, error } = await supabaseAdmin
    .from(config.table)
    .update({ status: newStatus })
    .eq("status", "pending")
    .select("id");

  if (error) throw new Error(error.message);

  const updatedCount = data?.length || 0;
  return {
    success: true,
    updatedCount,
    message: `${updatedCount} ${type} submission${updatedCount !== 1 ? "s" : ""} ${action}d successfully`,
  };
}
