import {
  createSupabaseServerClient,
  getServerUser,
  supabaseAdmin,
} from "@/app/lib/config/supabaseServer";

export class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export const parseArrayField = (formData, field) => {
  const entries = formData
    .getAll(field)
    .filter((entry) => typeof entry === "string");

  if (!entries.length) return [];

  const jsonEntry = entries.find((entry) => {
    try {
      return Array.isArray(JSON.parse(entry));
    } catch {
      return false;
    }
  });

  const rawValues = jsonEntry
    ? JSON.parse(jsonEntry)
    : entries.flatMap((entry) =>
        entry.includes(",") ? entry.split(",") : [entry],
      );

  return Array.isArray(rawValues)
    ? rawValues
        .filter((value) => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
};

export const sanitizeStorageBaseName = (value, fallback = "upload") => {
  const normalized = (value || fallback)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || fallback;
};

export const sanitizeFileExtension = (fileName, fallback = "jpg") => {
  const ext = (fileName || "").split(".").pop()?.toLowerCase() || fallback;
  const safeExt = ext.replace(/[^a-z0-9]/g, "");
  return safeExt || fallback;
};

export const extractPublicObjectPath = (url, bucket) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    return parsed.pathname.slice(idx + marker.length);
  } catch {
    return null;
  }
};

export const validateImageFile = ({
  file,
  required = true,
  maxSize = 1 * 1024 * 1024,
  requiredMessage = "Image is required",
}) => {
  if (!file || !(file instanceof File) || file.size === 0) {
    if (required) throw new ServiceError(requiredMessage, 400);
    return false;
  }

  if (!file.type?.startsWith("image/")) {
    throw new ServiceError("Please upload a valid image file", 400);
  }

  if (file.size > maxSize) {
    throw new ServiceError(
      `Image size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`,
      400,
    );
  }

  return true;
};

export const getAuthenticatedContext = async (cookieStore) => {
  const { user, error } = await getServerUser(cookieStore);
  if (error || !user) throw new ServiceError("Authentication required", 401);
  const supabase = await createSupabaseServerClient(cookieStore);
  return { user, supabase };
};

export const getSupabaseServerClient = async (cookieStore) =>
  cookieStore ? createSupabaseServerClient(cookieStore) : supabaseAdmin; // fallback for ISR / non-auth contexts

export const getSupabaseAdminClient = () => supabaseAdmin;
