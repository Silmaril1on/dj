"use server";
import { cookies } from "next/headers";
import {
  supabaseAdmin,
  getServerUser,
  createSupabaseServerClient,
} from "@/app/lib/config/supabaseServer";
import {
  ServiceError,
  getAuthenticatedContext,
  getSupabaseServerClient,
} from "@/app/lib/services/submit-data-types/shared";

// ─── Bug Reports ──────────────────────────────────────────────────────────────

export async function getBugReports() {
  const { data, error } = await supabaseAdmin
    .from("reports")
    .select("*, users:user_id(id, email, user_avatar, userName)")
    .order("created_at", { ascending: false });

  if (error) throw new ServiceError(error.message, 500);

  return (data || []).map(({ users, ...report }) => ({
    ...report,
    reporter: users || null,
  }));
}

export async function submitBugReport(cookieStore, { title, content }) {
  if (!title || !content)
    throw new ServiceError("Missing required fields", 400);
  const { user, supabase } = await getAuthenticatedContext(cookieStore);

  const { error } = await supabase.from("reports").insert([
    {
      title,
      content,
      user_id: user.id,
      user_email: user.email,
    },
  ]);

  if (error) throw new ServiceError(error.message, 500);
  return { success: true };
}

export async function deleteBugReport(id) {
  if (!id) throw new ServiceError("Missing id", 400);
  const { error } = await supabaseAdmin.from("reports").delete().eq("id", id);
  if (error) throw new ServiceError(error.message, 500);
  return { success: true };
}

// ─── Feedbacks ───────────────────────────────────────────────────────────────

export async function getFeedbacks(cookieStore, { status = "pending" } = {}) {
  const supabase = await getSupabaseServerClient(cookieStore);

  const { data, error } = await supabase
    .from("feedbacks")
    .select("*, users:user_id(id, email, user_avatar, userName)")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw new ServiceError(error.message, 500);

  return (data || []).map(({ users, ...feedback }) => ({
    ...feedback,
    reporter: users || null,
  }));
}

export async function submitFeedback(cookieStore, { title, content, rating }) {
  if (!title || !content)
    throw new ServiceError("Missing required fields", 400);
  const { user, supabase } = await getAuthenticatedContext(cookieStore);

  const { error } = await supabase.from("feedbacks").insert([
    {
      title,
      content,
      rating,
      user_id: user.id,
    },
  ]);

  if (error) throw new ServiceError(error.message, 500);
  return { success: true };
}

export async function approveFeedback(cookieStore, id) {
  if (!id) throw new ServiceError("Missing id", 400);
  const supabase = await getSupabaseServerClient(cookieStore);

  const { error } = await supabase
    .from("feedbacks")
    .update({ status: "approved" })
    .eq("id", id);

  if (error) throw new ServiceError(error.message, 500);
  return { success: true };
}
