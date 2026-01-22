import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export const createSupabaseServerClient = async (cookieStore) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: async (name) => {
          const cookie = await cookieStore.get(name);
          return cookie?.value;
        },
        set: async (name, value, options) => {
          try {
            await cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookie setting errors gracefully
          }
        },
        remove: async (name, options) => {
          try {
            await cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Handle cookie removal errors gracefully
          }
        },
      },
      db: {
        schema: "public", // Explicitly set schema to reduce introspection queries
      },
      global: {
        headers: {
          "x-client-info": "dj-app", // Add client identifier
        },
      },
    },
  );
};

// Server-side user fetching utility
export const getServerUser = async (cookieStore) => {
  const supabase = await createSupabaseServerClient(cookieStore);
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return { user: null, error };
    }
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    if (userError) {
      return { user: null, error: userError };
    }

    // If user has submitted_artist_id, fetch the artist_slug
    if (userData?.submitted_artist_id) {
      const { data: artistData } = await supabase
        .from("artists")
        .select("artist_slug")
        .eq("id", userData.submitted_artist_id)
        .single();

      if (artistData?.artist_slug) {
        userData.submitted_artist_slug = artistData.artist_slug;
      }
    }

    // If user has submitted_club_id, fetch the club_slug
    if (userData?.submitted_club_id) {
      const { data: clubData } = await supabase
        .from("clubs")
        .select("club_slug")
        .eq("id", userData.submitted_club_id)
        .single();

      if (clubData?.club_slug) {
        userData.submitted_club_slug = clubData.club_slug;
      }
    }

    return { user: userData, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

// Admin client with optimized settings
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: "public", // Explicitly set schema
    },
    auth: {
      autoRefreshToken: false, // Disable for admin client
      persistSession: false, // Don't persist admin sessions
    },
    global: {
      headers: {
        "x-client-info": "dj-app-admin",
      },
    },
  },
);
