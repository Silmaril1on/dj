import {
  ServiceError,
  getAuthenticatedContext,
  getSupabaseAdminClient,
} from "@/app/lib/services/submit-data-types/shared";

export async function fetchNotifications(cookieStore) {
  const { user, supabase } = await getAuthenticatedContext(cookieStore);

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw new ServiceError(error.message, 400);

  return { notifications: data, message: "Notifications fetched successfully" };
}

export async function markAllNotificationsRead(cookieStore) {
  const { user } = await getAuthenticatedContext(cookieStore);
  const admin = getSupabaseAdminClient();

  const { data, error } = await admin
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false)
    .select();

  if (error) throw new ServiceError(error.message, 400);

  return {
    message: "All notifications marked as read successfully",
    updatedCount: data?.length || 0,
  };
}

export async function createNotification(cookieStore, body) {
  // Verify the caller is authenticated and is an admin
  const { user } = await getAuthenticatedContext(cookieStore);
  if (!user.is_admin) throw new ServiceError("Forbidden", 403);

  const { message, user_id, title, type } = body;
  if (!message) throw new ServiceError("message is required", 400);

  const admin = getSupabaseAdminClient();

  const { data, error } = await admin
    .from("notifications")
    .insert({
      user_id,
      title,
      type,
      message,
      read: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new ServiceError(error.message, 400);

  return { notification: data, message: "Notification created" };
}
