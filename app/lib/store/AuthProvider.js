// components/AuthProvider.js
"use client";
import { useEffect, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import { createBrowserClient } from "@supabase/ssr";
import {
  setUser,
  setLoading,
  updateUserProfile,
} from "@/app/features/userSlice";

const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  // Guard against React 18 Strict Mode double-invocation and state-triggered re-runs
  const hasFetched = useRef(false);
  const profileUserIdRef = useRef(null);
  const profileRequestRef = useRef(null);

  // Supabase browser client created once for the lifetime of the app.
  // Creating it on every render would open a new WebSocket per render.
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
    [],
  );

  useEffect(() => {
    const fetchProfile = async (userId, { force = false } = {}) => {
      if (!userId) return;
      if (!force && profileUserIdRef.current === userId) return;
      if (profileRequestRef.current) return profileRequestRef.current;

      profileRequestRef.current = fetch("/api/auth/profile")
        .then(async (response) => {
          if (!response.ok) {
            if (response.status === 401) {
              profileUserIdRef.current = null;
              dispatch(setUser(null));
            }
            return;
          }

          const data = await response.json();
          profileUserIdRef.current = userId;
          dispatch(setUser(data.profile));
        })
        .finally(() => {
          profileRequestRef.current = null;
        });

      return profileRequestRef.current;
    };

    const getInitialSession = async () => {
      if (hasFetched.current) return;
      hasFetched.current = true;

      dispatch(setLoading(true));
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) await fetchProfile(session.user.id);
      } finally {
        dispatch(setLoading(false));
      }
    };

    getInitialSession();

    // Subscribe to auth state changes (sign-in and sign-out).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        profileUserIdRef.current = null;
        profileRequestRef.current = null;
        dispatch(setUser(null));
        return;
      }

      if (event === "SIGNED_IN" && session?.user) {
        dispatch(setLoading(true));
        try {
          await fetchProfile(session.user.id);
        } finally {
          dispatch(setLoading(false));
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch, supabase]); // supabase is stable (useMemo []), dispatch is stable from Redux

  // Listen for profile updates dispatched by other parts of the app
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      if (event.type === "profile-updated" && event.detail?.profile) {
        profileUserIdRef.current = event.detail.profile.id ?? null;
        dispatch(updateUserProfile(event.detail.profile));
      }
    };

    window.addEventListener("profile-updated", handleProfileUpdate);
    return () =>
      window.removeEventListener("profile-updated", handleProfileUpdate);
  }, [dispatch]);

  return children;
};

export default AuthProvider;
