"use server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import {
  ServiceError,
  getAuthenticatedContext,
  getSupabaseServerClient,
} from "@/app/lib/services/shared";

// ─── Contact (type: "contact", no auth required) ──────────────────────────────

export async function submitContact({ full_name, user_email, title, content }) {
  if (!full_name || !user_email || !title || !content)
    throw new ServiceError("Missing required fields", 400);

  const { error } = await supabaseAdmin.from("reports").insert([
    {
      full_name,
      user_email,
      title,
      content,
      type: "contact",
      status: null,
    },
  ]);

  if (error) throw new ServiceError(error.message, 500);
  return { success: true };
}

// ─── Reports (type: "report") ─────────────────────────────────────────────────

export async function getReports() {
  const { data, error } = await supabaseAdmin
    .from("reports")
    .select("*")
    .eq("type", "report")
    .order("created_at", { ascending: false });

  if (error) throw new ServiceError(error.message, 500);
  if (!data?.length) return [];

  const userIds = [...new Set(data.map((r) => r.user_id).filter(Boolean))];
  let usersMap = {};
  if (userIds.length) {
    const { data: users } = await supabaseAdmin
      .from("users")
      .select("id, email, user_avatar, userName")
      .in("id", userIds);
    if (users) usersMap = Object.fromEntries(users.map((u) => [u.id, u]));
  }

  return data.map((report) => ({
    ...report,
    reporter: usersMap[report.user_id] || { email: report.user_email } || null,
  }));
}

export async function submitReport(cookieStore, { title, content }) {
  if (!title || !content)
    throw new ServiceError("Missing required fields", 400);
  const { user, supabase } = await getAuthenticatedContext(cookieStore);

  const { error } = await supabase.from("reports").insert([
    {
      title,
      content,
      type: "report",
      user_id: user.id,
      user_email: user.email,
    },
  ]);

  if (error) throw new ServiceError(error.message, 500);
  return { success: true };
}

export async function deleteReport(id) {
  if (!id) throw new ServiceError("Missing id", 400);
  const { error } = await supabaseAdmin.from("reports").delete().eq("id", id);
  if (error) throw new ServiceError(error.message, 500);
  return { success: true };
}

// ─── Feedbacks (type: "feedback") ────────────────────────────────────────────

export async function getFeedbacks({ status = "pending" } = {}) {
  const { data, error } = await supabaseAdmin
    .from("reports")
    .select("*")
    .eq("type", "feedback")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw new ServiceError(error.message, 500);
  if (!data?.length) return [];

  const userIds = [...new Set(data.map((r) => r.user_id).filter(Boolean))];
  let usersMap = {};
  if (userIds.length) {
    const { data: users } = await supabaseAdmin
      .from("users")
      .select("id, email, user_avatar, userName")
      .in("id", userIds);
    if (users) usersMap = Object.fromEntries(users.map((u) => [u.id, u]));
  }

  return data.map((feedback) => ({
    ...feedback,
    reporter:
      usersMap[feedback.user_id] || { email: feedback.user_email } || null,
  }));
}

export async function getContacts() {
  const { data, error } = await supabaseAdmin
    .from("reports")
    .select("*")
    .eq("type", "contact")
    .order("created_at", { ascending: false });

  if (error) throw new ServiceError(error.message, 500);
  return data || [];
}

export async function submitFeedback(cookieStore, { title, content, rating }) {
  if (!title || !content)
    throw new ServiceError("Missing required fields", 400);
  const { user, supabase } = await getAuthenticatedContext(cookieStore);

  const { error } = await supabase.from("reports").insert([
    {
      title,
      content,
      rating,
      type: "feedback",
      user_id: user.id,
      user_email: user.email,
    },
  ]);

  if (error) throw new ServiceError(error.message, 500);
  return { success: true };
}

export async function approveFeedback(cookieStore, id) {
  if (!id) throw new ServiceError("Missing id", 400);
  const supabase = await getSupabaseServerClient(cookieStore);

  const { error } = await supabase
    .from("reports")
    .update({ status: "approved" })
    .eq("id", id);

  if (error) throw new ServiceError(error.message, 500);
  return { success: true };
}
