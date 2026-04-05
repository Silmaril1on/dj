import {
  ServiceError,
  getAuthenticatedContext,
  getSupabaseServerClient,
} from "../shared";

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const sanitizePriceTiers = (tiers = []) => {
  if (!Array.isArray(tiers)) return [];

  return tiers
    .map((tier) => ({
      label: normalizeText(tier?.label),
      price: toNumber(tier?.price),
      stock: tier?.stock === false ? false : true,
    }))
    .filter((tier) => tier.label && tier.price !== null && tier.price >= 0);
};

const sanitizeExtraInfo = (rows = []) => {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => normalizeText(row)).filter(Boolean);
};

const sanitizeTicket = (ticket = {}) => {
  const title = normalizeText(ticket?.title);
  if (!title) return null;

  return {
    title,
    ticket_info: normalizeText(ticket?.ticket_info),
    priceTiers: sanitizePriceTiers(ticket?.priceTiers),
    extraInfo: sanitizeExtraInfo(ticket?.extraInfo),
  };
};

const sanitizeGroups = (groups = []) => {
  if (!Array.isArray(groups)) return [];

  return groups
    .map((group) => {
      const title = normalizeText(group?.title);
      if (!title) return null;

      const tickets = Array.isArray(group?.tickets)
        ? group.tickets.map((ticket) => sanitizeTicket(ticket)).filter(Boolean)
        : [];

      return {
        title,
        tickets,
      };
    })
    .filter(Boolean);
};

async function assertFestivalOwnerOrAdmin(supabase, user, festivalId) {
  const { data: festival, error } = await supabase
    .from("festivals")
    .select("id, user_id")
    .eq("id", festivalId)
    .single();

  if (error || !festival) {
    throw new ServiceError("Festival not found", 404);
  }

  const canManage = festival.user_id === user.id || user.is_admin;
  if (!canManage) {
    throw new ServiceError("Unauthorized to modify this festival", 403);
  }
}

export async function getFestivalTickets(festivalId, cookieStore) {
  if (!festivalId) {
    throw new ServiceError("Festival ID is required", 400);
  }

  const supabase = await getSupabaseServerClient(cookieStore);

  const { data, error } = await supabase
    .from("festival_tickets")
    .select("festival_id, ticket_link, ticket_groups, updated_at")
    .eq("festival_id", festivalId)
    .maybeSingle();

  if (error) {
    throw new ServiceError("Failed to fetch festival tickets", 500);
  }

  return {
    success: true,
    festival_id: festivalId,
    ticket_link: data?.ticket_link || "",
    ticket_groups: Array.isArray(data?.ticket_groups) ? data.ticket_groups : [],
    updated_at: data?.updated_at || null,
  };
}

export async function upsertFestivalTickets(
  { festival_id, ticket_link, ticket_groups },
  cookieStore,
) {
  if (!festival_id) {
    throw new ServiceError("Festival ID is required", 400);
  }

  const { user, supabase } = await getAuthenticatedContext(cookieStore);
  await assertFestivalOwnerOrAdmin(supabase, user, festival_id);

  const sanitizedGroups = sanitizeGroups(ticket_groups);

  const { data, error } = await supabase
    .from("festival_tickets")
    .upsert(
      {
        festival_id,
        ticket_link: normalizeText(ticket_link),
        ticket_groups: sanitizedGroups,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "festival_id" },
    )
    .select("festival_id, ticket_link, ticket_groups, updated_at")
    .single();

  if (error) {
    throw new ServiceError("Failed to save festival tickets", 500);
  }

  return {
    success: true,
    message: "Festival tickets saved successfully",
    festival_id: data.festival_id,
    ticket_link: data.ticket_link || "",
    ticket_groups: data.ticket_groups || [],
    updated_at: data.updated_at,
  };
}
