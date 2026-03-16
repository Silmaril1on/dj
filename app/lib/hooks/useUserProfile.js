"use client";
import useSWR, { mutate as globalMutate } from "swr";

export const USER_PROFILE_KEY = "/api/auth/profile";

const fetcher = (url) =>
  fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error("Failed to fetch profile");
      return r.json();
    })
    .then((d) => d.profile);

export function useUserProfile(initialData) {
  const { data, error, mutate, isLoading } = useSWR(USER_PROFILE_KEY, fetcher, {
    fallbackData: initialData,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 15 * 60 * 1000, // 15 minutes
  });

  return {
    profile: data ?? initialData,
    error,
    mutate,
    isLoading,
  };
}

/**
 * Trigger a global SWR revalidation of the profile cache.
 * Call this from any component after a successful profile mutation.
 */
export function revalidateProfile() {
  return globalMutate(USER_PROFILE_KEY);
}
