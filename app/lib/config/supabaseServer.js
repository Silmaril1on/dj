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
        schema: 'public', // Explicitly set schema to reduce introspection queries
      },
      global: {
        headers: {
          'x-client-info': 'dj-app', // Add client identifier
        },
      },
    }
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
      schema: 'public', // Explicitly set schema
    },
    auth: {
      autoRefreshToken: false, // Disable for admin client
      persistSession: false, // Don't persist admin sessions
    },
    global: {
      headers: {
        'x-client-info': 'dj-app-admin',
      },
    },
  }
);
