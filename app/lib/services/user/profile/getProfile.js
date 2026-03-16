import { cookies } from "next/headers";
import { getServerUser } from "@/app/lib/config/supabaseServer";

export async function getProfile() {
  const cookieStore = await cookies();
  return getServerUser(cookieStore);
}
