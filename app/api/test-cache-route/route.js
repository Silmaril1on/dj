import { createClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// PATCH (UPDATE)
export async function PATCH(request) {
  const body = await request.json();
  const { id, name, age } = body;

  const { data, error } = await admin
    .from("cache_table")
    .update({
      name,
      age,
    })
    .eq("id", id)
    .select();
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("cache-table");

  return Response.json(data);
}
