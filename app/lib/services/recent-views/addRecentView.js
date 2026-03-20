"use server";
import { getAuthenticatedContext } from "@/app/lib/services/shared";

const VALID_TYPES = ["artist", "club", "event", "festival"];
const MAX_PER_TYPE = 5;

export async function addRecentView(cookieStore, { type, item_id }) {
  if (!type || !item_id) throw new Error("Missing required fields");
  if (!VALID_TYPES.includes(type)) throw new Error("Invalid type");

  const { user, supabase } = await getAuthenticatedContext(cookieStore);

  const { data: existing } = await supabase
    .from("recently_viewed")
    .select("id")
    .eq("user_id", user.id)
    .eq("type", type)
    .eq("item_id", item_id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("recently_viewed")
      .update({ viewed_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (error) throw new Error("Failed to update view");
    return { action: "updated" };
  }

  const { count } = await supabase
    .from("recently_viewed")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("type", type);

  if (count >= MAX_PER_TYPE) {
    const { data: oldest } = await supabase
      .from("recently_viewed")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", type)
      .order("viewed_at", { ascending: true })
      .limit(1)
      .single();

    if (oldest) {
      await supabase.from("recently_viewed").delete().eq("id", oldest.id);
    }
  }

  const { error } = await supabase.from("recently_viewed").insert({
    user_id: user.id,
    type,
    item_id,
    viewed_at: new Date().toISOString(),
  });

  if (error) throw new Error("Failed to insert view");
  return { action: "inserted" };
}
