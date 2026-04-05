"use server";
import { revalidateTag } from "next/cache";
import {
  ServiceError,
  getAuthenticatedContext,
  getSupabaseAdminClient,
} from "../shared";

export async function getClubLikes(cookieStore, clubId) {
  if (!clubId) throw new ServiceError("Club ID is required", 400);
  const admin = getSupabaseAdminClient();

  const { count: likesCount, error: countError } = await admin
    .from("club_likes")
    .select("*", { count: "exact", head: true })
    .eq("club_id", clubId);

  if (countError) throw new ServiceError("Failed to get likes count", 500);

  let isLiked = false;
  try {
    const { user } = await getAuthenticatedContext(cookieStore);
    const { data: userLike, error } = await admin
      .from("club_likes")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .single();

    if (!error || error.code === "PGRST116") isLiked = !!userLike;
  } catch {
    // unauthenticated — isLiked stays false
  }

  return { likesCount: likesCount || 0, isLiked };
}

export async function toggleClubLike(cookieStore, clubId) {
  if (!clubId) throw new ServiceError("Club ID is required", 400);
  const { user } = await getAuthenticatedContext(cookieStore);
  const admin = getSupabaseAdminClient();

  const { data: existing, error: checkError } = await admin
    .from("club_likes")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    throw new ServiceError("Failed to check like status", 500);
  }

  const wasLiked = !!existing;

  if (wasLiked) {
    const { error } = await admin
      .from("club_likes")
      .delete()
      .eq("club_id", clubId)
      .eq("user_id", user.id);
    if (error) throw new ServiceError("Failed to remove like", 500);
  } else {
    const { error } = await admin
      .from("club_likes")
      .insert({ club_id: clubId, user_id: user.id });
    if (error) throw new ServiceError("Failed to add like", 500);
  }

  const { count: likesCount, error: countError } = await admin
    .from("club_likes")
    .select("*", { count: "exact", head: true })
    .eq("club_id", clubId);

  if (countError) throw new ServiceError("Failed to get likes count", 500);

  revalidateTag("clubs");
  revalidateTag("club-likes");
  revalidateTag(`club-${clubId}`);

  return { likesCount: likesCount || 0, isLiked: !wasLiked };
}
