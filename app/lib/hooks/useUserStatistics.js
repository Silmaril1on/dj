"use client";

import { mutate as globalMutate } from "swr";

export const USER_STATISTICS_KEY = "/api/users/statistics";

export function revalidateUserStatistics() {
  return globalMutate(
    (key) =>
      typeof key === "string" &&
      (key === USER_STATISTICS_KEY || key.startsWith("/api/users/statistics")),
  );
}
