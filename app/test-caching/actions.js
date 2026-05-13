"use server";
import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function fetchRowsFromDB() {
  console.log("🔥 DB HIT (real query)");

  const { data, error } = await admin
    .from("cache_table")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export const getCacheRows = unstable_cache(
  async () => {
    console.log("⚡ CACHE MISS");

    return await fetchRowsFromDB();
  },
  ["cache-table"],
  {
    revalidate: 60,
    tags: ["cache-table"],
  },
);

export async function updateCacheRow(id) {
  const { data, error } = await admin
    .from("cache_table")
    .update({
      name: data.name,
      age: data.age,
    })
    .eq("id", id)
    .select();

  if (error) {
    console.error(error);
    return null;
  }

  revalidateTag("cache-table");

  return data;
}

// POST
export async function createCacheRow() {
  const { data, error } = await admin
    .from("cache_table")
    .insert({
      name: "Marcus",
      age: Math.floor(Math.random() * 100),
    })
    .select();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

// DELETE
export async function deleteCacheRow(id) {
  const { data, error } = await admin
    .from("cache_table")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}
