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
      count: toNumber(tier?.count),
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
      return { title, tickets };
    })
    .filter(Boolean);
};

async function assertEventOwnerOrAdmin(supabase, user, eventId) {
  if (user.is_admin) return;

  const { data: event, error } = await supabase
    .from("events")
    .select("id, user_id")
    .eq("id", eventId)
    .single();

  if (error || !event) {
    throw new ServiceError("Event not found", 404);
  }

  if (event.user_id !== user.id) {
    throw new ServiceError("Unauthorized to modify this event's tickets", 403);
  }
}

export async function getEventTickets(eventId, cookieStore) {
  if (!eventId) {
    throw new ServiceError("Event ID is required", 400);
  }

  const supabase = await getSupabaseServerClient(cookieStore);

  const { data, error } = await supabase
    .from("event_tickets")
    .select("event_id, ticket_link, ticket_groups, updated_at")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) {
    throw new ServiceError("Failed to fetch event tickets", 500);
  }

  return {
    success: true,
    event_id: eventId,
    ticket_link: data?.ticket_link || "",
    ticket_groups: Array.isArray(data?.ticket_groups) ? data.ticket_groups : [],
    updated_at: data?.updated_at || null,
  };
}

export async function upsertEventTickets(
  { event_id, ticket_link, ticket_groups },
  cookieStore,
) {
  if (!event_id) {
    throw new ServiceError("Event ID is required", 400);
  }

  const { user, supabase } = await getAuthenticatedContext(cookieStore);
  await assertEventOwnerOrAdmin(supabase, user, event_id);

  const sanitizedGroups = sanitizeGroups(ticket_groups);

  const { data, error } = await supabase
    .from("event_tickets")
    .upsert(
      {
        event_id,
        ticket_link: normalizeText(ticket_link),
        ticket_groups: sanitizedGroups,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id" },
    )
    .select("event_id, ticket_link, ticket_groups, updated_at")
    .single();

  if (error) {
    throw new ServiceError("Failed to save event tickets", 500);
  }

  return {
    success: true,
    message: "Event tickets saved successfully",
    event_id: data.event_id,
    ticket_link: data.ticket_link || "",
    ticket_groups: data.ticket_groups || [],
    updated_at: data.updated_at,
  };
}
