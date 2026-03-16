import { cookies } from "next/headers";
import { getServerUser } from "@/app/lib/config/supabaseServer";

export async function requireAuth() {
  const cookieStore = await cookies();
  const { user, error } = await getServerUser(cookieStore);

  if (error || !user) {
    throw new Error("User not authenticated");
  }

  return user;
}
