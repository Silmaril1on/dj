import { cookies } from "next/headers";
import { getServerUser } from "@/app/lib/config/supabaseServer";

/**
 * Shared auth guard for all server-side data fetching services.
 * Reads the session cookie, verifies the user, and returns the full user record.
 * Throws if the user is not authenticated so callers only need to handle the happy path.
 *
 * @returns {Promise<object>} Authenticated user record
 * @throws {Error} "User not authenticated" if session is missing or invalid
 */
export async function requireAuth() {
  const cookieStore = await cookies();
  const { user, error } = await getServerUser(cookieStore);

  if (error || !user) {
    throw new Error("User not authenticated");
  }

  return user;
}
