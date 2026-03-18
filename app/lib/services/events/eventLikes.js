"use server";
import { revalidateTag } from "next/cache";
import {
  ServiceError,
  getAuthenticatedContext,
  getSupabaseServerClient,
} from "@/app/lib/services/submit-data-types/shared";

export async function getEventLikes(cookieStore, eventId) {
  if (!eventId) throw new ServiceError("Event ID is required", 400);
  const supabase = await getSupabaseServerClient(cookieStore);

  const { count: likesCount, error: countError } = await supabase
    .from("event_likes")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (countError) throw new ServiceError("Failed to get likes count", 500);

  // Try to get user like status (optional — no auth required)
  let isLiked = false;
  try {
    const { user } = await getAuthenticatedContext(cookieStore);
    const { data: userLike, error } = await supabase
      .from("event_likes")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (!error || error.code === "PGRST116") isLiked = !!userLike;
  } catch {
    // unauthenticated — isLiked stays false
  }

  return { likesCount: likesCount || 0, isLiked };
}

export async function toggleEventLike(cookieStore, eventId) {
  if (!eventId) throw new ServiceError("Event ID is required", 400);
  const { user, supabase } = await getAuthenticatedContext(cookieStore);

  const { data: existing, error: checkError } = await supabase
    .from("event_likes")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    throw new ServiceError("Failed to check like status", 500);
  }

  const wasLiked = !!existing;

  if (wasLiked) {
    const { error } = await supabase
      .from("event_likes")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id);
    if (error) throw new ServiceError("Failed to remove like", 500);
  } else {
    const { error } = await supabase
      .from("event_likes")
      .insert({ event_id: eventId, user_id: user.id });
    if (error) throw new ServiceError("Failed to add like", 500);
  }

  const { count: likesCount, error: countError } = await supabase
    .from("event_likes")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (countError) throw new ServiceError("Failed to get likes count", 500);

  revalidateTag("events");
  revalidateTag("event-likes");
  revalidateTag(`event-${eventId}`);

  return { likesCount: likesCount || 0, isLiked: !wasLiked };
}
