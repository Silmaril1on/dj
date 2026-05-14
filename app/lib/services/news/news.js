import { revalidateTag, unstable_cache } from "next/cache";
import {
  ServiceError,
  validateImageFile,
  sanitizeFileExtension,
  sanitizeStorageBaseName,
  extractPublicObjectPath,
  getAuthenticatedContext,
  getSupabaseAdminClient,
} from "../shared";

const NEWS_LIST_SELECT =
  "id, title, news_slug, description, news_image, link, user_id, created_at";

/** Converts a title string into a URL-safe slug. */
const toSlug = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const ensureNewsOwnership = async (supabase, userId, ownerId) => {
  if (ownerId === userId) return;

  const { data: profile, error } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .single();

  if (error || !profile?.is_admin) {
    throw new ServiceError("Unauthorized", 403);
  }
};

export async function getLimitedNews({ limit = 20, offset = 0 } = {}) {
  return unstable_cache(
    async (l, o) => {
      const admin = getSupabaseAdminClient();

      const { data, count, error } = await admin
        .from("news")
        .select(NEWS_LIST_SELECT, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(o, o + l - 1);

      if (error) throw new ServiceError("Failed to fetch news", 500);

      const total = typeof count === "number" ? count : null;
      const items = data || [];

      return {
        data: items,
        total,
        limit: l,
        offset: o,
        hasMore: total !== null ? o + items.length < total : items.length === l,
      };
    },
    [`news-list-${limit}-${offset}`],
    { revalidate: 15 * 60, tags: ["news-list"] },
  )(limit, offset);
}

const NEWS_FULL_SELECT = `
  id,
  title,
  news_slug,
  content,
  description,
  news_image,
  link,
  user_id,
  created_at,
  users:user_id (
    id,
    userName,
    email,
    user_avatar
  )
`;

const shapeNewsRecord = (data) => {
  const submitter = data.users || {
    id: null,
    userName: "Unknown",
    email: "",
    user_avatar: null,
  };
  const { users, ...newsData } = data;
  return { ...newsData, submitter };
};

export async function getNewsById(id) {
  if (!id) throw new ServiceError("News ID is required", 400);

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("news")
    .select(NEWS_FULL_SELECT)
    .eq("id", id)
    .single();

  if (error || !data) throw new ServiceError("News not found", 404);

  return { success: true, news: shapeNewsRecord(data) };
}

export async function getNewsBySlug(slug) {
  if (!slug) throw new ServiceError("News slug is required", 400);

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("news")
    .select(NEWS_FULL_SELECT)
    .eq("news_slug", slug)
    .single();

  if (error || !data) throw new ServiceError("News not found", 404);

  return { success: true, news: shapeNewsRecord(data) };
}

export async function createNews(formData, cookieStore) {
  const { user, supabase } = await getAuthenticatedContext(cookieStore);
  const admin = getSupabaseAdminClient();

  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const link = String(formData.get("link") || "").trim();
  const newsImage = formData.get("news_image");

  if (!title || !content || !description) {
    throw new ServiceError(
      "Missing required fields: title, content, description",
      400,
    );
  }

  validateImageFile({
    file: newsImage,
    maxSize: 1 * 1024 * 1024,
    requiredMessage: "Please upload a valid news image",
  });

  const extension = sanitizeFileExtension(newsImage.name, "jpg");
  const fileBase = sanitizeStorageBaseName(title, "news");
  const imagePath = `news/${fileBase}-${Date.now()}.${extension}`;

  const { error: uploadError } = await admin.storage
    .from("news_images")
    .upload(imagePath, newsImage, {
      contentType: newsImage.type,
      upsert: false,
    });

  if (uploadError) throw new ServiceError("Failed to upload news image", 500);

  const { data: urlData } = admin.storage
    .from("news_images")
    .getPublicUrl(imagePath);

  const baseSlug = toSlug(title);
  // Append a short timestamp suffix to guarantee uniqueness.
  const news_slug = `${baseSlug}-${Date.now().toString(36).slice(-5)}`;

  const { data, error } = await supabase
    .from("news")
    .insert({
      title,
      news_slug,
      content,
      description,
      link: link || null,
      news_image: urlData.publicUrl,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    await admin.storage.from("news_images").remove([imagePath]);
    throw new ServiceError("Failed to create news", 500);
  }

  revalidateTag("news");
  revalidateTag("news-list");

  return {
    success: true,
    message: "News submitted successfully",
    data,
  };
}

export async function updateNews(formData, cookieStore) {
  const { user, supabase } = await getAuthenticatedContext(cookieStore);
  const admin = getSupabaseAdminClient();

  const newsId = formData.get("newsId");
  if (!newsId) throw new ServiceError("News ID is required for updates", 400);

  const { data: existing, error: fetchError } = await supabase
    .from("news")
    .select("id, user_id, title, content, description, link, news_image")
    .eq("id", newsId)
    .single();

  if (fetchError || !existing) throw new ServiceError("News not found", 404);

  await ensureNewsOwnership(supabase, user.id, existing.user_id);

  const newTitle = String(formData.get("title") || "").trim();
  const updateData = {
    title: newTitle || existing.title,
    content: String(formData.get("content") || "").trim() || existing.content,
    description:
      String(formData.get("description") || "").trim() || existing.description,
    link: String(formData.get("link") || "").trim() || existing.link || null,
  };

  // Re-generate slug only when the title actually changes.
  if (newTitle && newTitle !== existing.title) {
    updateData.news_slug = `${toSlug(newTitle)}-${Date.now().toString(36).slice(-5)}`;
  }

  if (!updateData.title || !updateData.content || !updateData.description) {
    throw new ServiceError(
      "Missing required fields: title, content, description",
      400,
    );
  }

  const newsImage = formData.get("news_image");
  let uploadedPath = null;
  if (newsImage instanceof File && newsImage.size > 0) {
    validateImageFile({
      file: newsImage,
      required: false,
      maxSize: 1 * 1024 * 1024,
    });

    const extension = sanitizeFileExtension(newsImage.name, "jpg");
    const fileBase = sanitizeStorageBaseName(updateData.title, "news");
    uploadedPath = `news/${fileBase}-${Date.now()}.${extension}`;

    const { error: uploadError } = await admin.storage
      .from("news_images")
      .upload(uploadedPath, newsImage, {
        contentType: newsImage.type,
        upsert: false,
      });

    if (uploadError) throw new ServiceError("Failed to upload news image", 500);

    const { data: urlData } = admin.storage
      .from("news_images")
      .getPublicUrl(uploadedPath);

    updateData.news_image = urlData.publicUrl;
  }

  const { data, error } = await supabase
    .from("news")
    .update(updateData)
    .eq("id", newsId)
    .select()
    .single();

  if (error) {
    if (uploadedPath) {
      await admin.storage.from("news_images").remove([uploadedPath]);
    }
    throw new ServiceError("Failed to update news", 500);
  }

  if (uploadedPath) {
    const oldPath = extractPublicObjectPath(existing.news_image, "news_images");
    if (oldPath) {
      await admin.storage.from("news_images").remove([oldPath]);
    }
  }

  revalidateTag("news");
  revalidateTag("news-list");

  return {
    success: true,
    message: "News updated successfully",
    data,
  };
}

export async function deleteNews(newsId, cookieStore) {
  if (!newsId) throw new ServiceError("News ID is required", 400);

  const { user, supabase } = await getAuthenticatedContext(cookieStore);
  const admin = getSupabaseAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("news")
    .select("id, user_id, news_image")
    .eq("id", newsId)
    .single();

  if (fetchError || !existing) throw new ServiceError("News not found", 404);

  await ensureNewsOwnership(supabase, user.id, existing.user_id);

  const imagePath = extractPublicObjectPath(existing.news_image, "news_images");
  if (imagePath) {
    await admin.storage.from("news_images").remove([imagePath]);
  }

  const { error: deleteError } = await supabase
    .from("news")
    .delete()
    .eq("id", newsId);

  if (deleteError) throw new ServiceError("Failed to delete news", 500);

  revalidateTag("news");
  revalidateTag("news-list");

  return {
    success: true,
    message: "News deleted successfully",
  };
}
