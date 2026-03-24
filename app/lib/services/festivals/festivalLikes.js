"use server";
import { revalidateTag } from "next/cache";
import {
  ServiceError,
  getAuthenticatedContext,
  getSupabaseAdminClient,
} from "../shared";

export async function getFestivalLikes(cookieStore, festivalId) {
  if (!festivalId) throw new ServiceError("Festival ID is required", 400);
  const admin = getSupabaseAdminClient();

  const { count: likesCount, error: countError } = await admin
    .from("festival_likes")
    .select("*", { count: "exact", head: true })
    .eq("festival_id", festivalId);

  if (countError) throw new ServiceError("Failed to get likes count", 500);

  let isLiked = false;
  try {
    const { user } = await getAuthenticatedContext(cookieStore);
    const { data: userLike } = await admin
      .from("festival_likes")
      .select("id")
      .eq("festival_id", festivalId)
      .eq("user_id", user.id)
      .single();
    isLiked = !!userLike;
  } catch {
    // unauthenticated — isLiked stays false
  }

  return { likesCount: likesCount || 0, isLiked };
}

export async function toggleFestivalLike(cookieStore, festivalId) {
  if (!festivalId) throw new ServiceError("Festival ID is required", 400);
  const { user } = await getAuthenticatedContext(cookieStore);
  const admin = getSupabaseAdminClient();

  const { data: existing, error: checkError } = await admin
    .from("festival_likes")
    .select("id")
    .eq("festival_id", festivalId)
    .eq("user_id", user.id)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    throw new ServiceError("Failed to check like status", 500);
  }

  const wasLiked = !!existing;

  if (wasLiked) {
    const { error } = await admin
      .from("festival_likes")
      .delete()
      .eq("festival_id", festivalId)
      .eq("user_id", user.id);
    if (error) throw new ServiceError("Failed to remove like", 500);
  } else {
    const { error } = await admin
      .from("festival_likes")
      .insert({ festival_id: festivalId, user_id: user.id });
    if (error) throw new ServiceError("Failed to add like", 500);
  }

  const { count: likesCount, error: countError } = await admin
    .from("festival_likes")
    .select("*", { count: "exact", head: true })
    .eq("festival_id", festivalId);

  if (countError) throw new ServiceError("Failed to get likes count", 500);

  revalidateTag("festivals");
  revalidateTag("festival-likes");
  revalidateTag(`festival-${festivalId}`);

  return { likesCount: likesCount || 0, isLiked: !wasLiked };
}
