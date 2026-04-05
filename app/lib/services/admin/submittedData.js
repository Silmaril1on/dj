import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

// Central config for each submittable data type.
// Adding a new type only requires a new entry here.
const TYPE_CONFIGS = {
  artist: {
    table: "artists",
    select: `
      id, name, stage_name, status, created_at, artist_image,
      country, city, user_id,
      users:user_id(id, userName, email, user_avatar)
    `,
    mapItem: (item) => ({
      id: item.id,
      name: item.name,
      stage_name: item.stage_name,
      artist_image: item.artist_image,
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
      id, name, country, city, capacity, status, created_at, club_image,
      description, address, location_url, social_links, user_id,
      users:user_id(id, userName, email, user_avatar)
    `,
    mapItem: (item) => ({
      id: item.id,
      name: item.name,
      artist_image: item.club_image,
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
      id, event_name, promoter, event_image, country, city, status,
      created_at, description, user_id,
      users:user_id(id, userName, email, user_avatar)
    `,
    mapItem: (item) => ({
      id: item.id,
      name: item.event_name,
      stage_name: item.promoter,
      artist_image: item.event_image,
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
      id, name, country, city, location, address, start_date, end_date,
      capacity_total, status, created_at, poster, description, social_links, user_id,
      users:user_id(id, userName, email, user_avatar)
    `,
    mapItem: (item) => ({
      id: item.id,
      name: item.name,
      address: item.address,
      location_url: item.location,
      start_date: item.start_date,
      end_date: item.end_date,
      capacity_total: item.capacity_total,
      artist_image: item.poster,
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

  return { submissions: (data || []).map(config.mapItem) };
}

export async function updateSubmission(type, id, action) {
  const config = TYPE_CONFIGS[type];
  if (!config) throw new Error(`Unknown submission type: ${type}`);
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
