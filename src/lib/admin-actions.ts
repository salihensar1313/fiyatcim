"use server";

// ==========================================
// admin-actions.ts — Server Actions for Admin CRUD
// All DB writes go through here (altın kural: client'ta DB yok)
// ==========================================

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";

// ==========================================
// TYPES
// ==========================================

interface ActionResult<T = null> {
  data: T;
  error: string | null;
}

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const DEMO_ERROR = "Demo modda DB yazma devre dışı";

// ==========================================
// HELPERS
// ==========================================

async function getAuthenticatedClient() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// ==========================================
// BLOG POST ACTIONS
// ==========================================

export async function createBlogPostAction(input: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
}): Promise<ActionResult<Record<string, unknown> | null>> {
  if (IS_DEMO) return { data: null, error: DEMO_ERROR };

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return { data: null, error: "Yetkiniz yok" };

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({ ...input, is_published: true })
    .select("*")
    .single();

  if (error) {
    logger.error("mutation_failed", { fn: "createBlogPost", error: error.message });
    return { data: null, error: error.message };
  }

  logger.info("admin_write", { fn: "createBlogPost", entity: "blog_post", id: data.id, action: "create", user_id: user.id });
  revalidatePath("/blog");
  revalidatePath("/rehber");
  revalidatePath("/");
  return { data, error: null };
}

export async function updateBlogPostAction(
  id: string,
  updates: Partial<{
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    image: string;
    category: string;
  }>
): Promise<ActionResult> {
  if (IS_DEMO) return { data: null, error: DEMO_ERROR };

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return { data: null, error: "Yetkiniz yok" };

  const { error } = await supabase
    .from("blog_posts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    logger.error("mutation_failed", { fn: "updateBlogPost", error: error.message });
    return { data: null, error: error.message };
  }

  logger.info("admin_write", { fn: "updateBlogPost", entity: "blog_post", id, action: "update", user_id: user.id });
  revalidatePath("/blog");
  revalidatePath("/rehber");
  revalidatePath("/");
  return { data: null, error: null };
}

export async function deleteBlogPostAction(id: string): Promise<ActionResult> {
  if (IS_DEMO) return { data: null, error: DEMO_ERROR };

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return { data: null, error: "Yetkiniz yok" };

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) {
    logger.error("mutation_failed", { fn: "deleteBlogPost", error: error.message });
    return { data: null, error: error.message };
  }

  logger.info("admin_write", { fn: "deleteBlogPost", entity: "blog_post", id, action: "delete", user_id: user.id });
  revalidatePath("/blog");
  revalidatePath("/rehber");
  revalidatePath("/");
  return { data: null, error: null };
}

// ==========================================
// TESTIMONIAL ACTIONS
// ==========================================

export async function createTestimonialAction(input: {
  name: string;
  company: string;
  comment: string;
  rating: number;
}): Promise<ActionResult<Record<string, unknown> | null>> {
  if (IS_DEMO) return { data: null, error: DEMO_ERROR };

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return { data: null, error: "Yetkiniz yok" };

  const { data, error } = await supabase
    .from("testimonials")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    logger.error("mutation_failed", { fn: "createTestimonial", error: error.message });
    return { data: null, error: error.message };
  }

  logger.info("admin_write", { fn: "createTestimonial", entity: "testimonial", id: data.id, action: "create", user_id: user.id });
  revalidatePath("/");
  return { data, error: null };
}

export async function updateTestimonialAction(
  id: string,
  updates: Partial<{
    name: string;
    company: string;
    comment: string;
    rating: number;
  }>
): Promise<ActionResult> {
  if (IS_DEMO) return { data: null, error: DEMO_ERROR };

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return { data: null, error: "Yetkiniz yok" };

  const { error } = await supabase.from("testimonials").update(updates).eq("id", id);

  if (error) {
    logger.error("mutation_failed", { fn: "updateTestimonial", error: error.message });
    return { data: null, error: error.message };
  }

  logger.info("admin_write", { fn: "updateTestimonial", entity: "testimonial", id, action: "update", user_id: user.id });
  revalidatePath("/");
  return { data: null, error: null };
}

export async function deleteTestimonialAction(id: string): Promise<ActionResult> {
  if (IS_DEMO) return { data: null, error: DEMO_ERROR };

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return { data: null, error: "Yetkiniz yok" };

  const { error } = await supabase.from("testimonials").delete().eq("id", id);

  if (error) {
    logger.error("mutation_failed", { fn: "deleteTestimonial", error: error.message });
    return { data: null, error: error.message };
  }

  logger.info("admin_write", { fn: "deleteTestimonial", entity: "testimonial", id, action: "delete", user_id: user.id });
  revalidatePath("/");
  return { data: null, error: null };
}

// ==========================================
// CATEGORY ACTIONS
// ==========================================

export async function createCategoryAction(input: {
  name: string;
  slug: string;
  image_url: string;
  sort_order: number;
}): Promise<ActionResult<Record<string, unknown> | null>> {
  if (IS_DEMO) return { data: null, error: DEMO_ERROR };

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return { data: null, error: "Yetkiniz yok" };

  const { data, error } = await supabase
    .from("categories")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    logger.error("mutation_failed", { fn: "createCategory", error: error.message });
    return { data: null, error: error.message };
  }

  logger.info("admin_write", { fn: "createCategory", entity: "category", id: data.id, action: "create", user_id: user.id });
  revalidatePath("/");
  revalidatePath("/kategori/[slug]", "page");
  revalidatePath("/urunler");
  return { data, error: null };
}

export async function updateCategoryAction(
  id: string,
  updates: Partial<{
    name: string;
    slug: string;
    image_url: string;
    sort_order: number;
  }>
): Promise<ActionResult> {
  if (IS_DEMO) return { data: null, error: DEMO_ERROR };

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return { data: null, error: "Yetkiniz yok" };

  const { error } = await supabase
    .from("categories")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    logger.error("mutation_failed", { fn: "updateCategory", error: error.message });
    return { data: null, error: error.message };
  }

  logger.info("admin_write", { fn: "updateCategory", entity: "category", id, action: "update", user_id: user.id });
  revalidatePath("/");
  revalidatePath("/kategori/[slug]", "page");
  revalidatePath("/urunler");
  return { data: null, error: null };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  if (IS_DEMO) return { data: null, error: DEMO_ERROR };

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return { data: null, error: "Yetkiniz yok" };

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    logger.error("mutation_failed", { fn: "deleteCategory", error: error.message });
    return { data: null, error: error.message };
  }

  logger.info("admin_write", { fn: "deleteCategory", entity: "category", id, action: "delete", user_id: user.id });
  revalidatePath("/");
  revalidatePath("/kategori/[slug]", "page");
  revalidatePath("/urunler");
  return { data: null, error: null };
}

// ==========================================
// FAQ ACTIONS
// ==========================================

export async function createFaqAction(input: {
  question: string;
  answer: string;
  category: string;
}): Promise<ActionResult<Record<string, unknown> | null>> {
  if (IS_DEMO) return { data: null, error: DEMO_ERROR };

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return { data: null, error: "Yetkiniz yok" };

  const { data, error } = await supabase
    .from("faqs")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    logger.error("mutation_failed", { fn: "createFaq", error: error.message });
    return { data: null, error: error.message };
  }

  logger.info("admin_write", { fn: "createFaq", entity: "faq", id: data.id, action: "create", user_id: user.id });
  revalidatePath("/sss");
  return { data, error: null };
}

export async function updateFaqAction(
  id: string,
  updates: Partial<{
    question: string;
    answer: string;
    category: string;
  }>
): Promise<ActionResult> {
  if (IS_DEMO) return { data: null, error: DEMO_ERROR };

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return { data: null, error: "Yetkiniz yok" };

  const { error } = await supabase.from("faqs").update(updates).eq("id", id);

  if (error) {
    logger.error("mutation_failed", { fn: "updateFaq", error: error.message });
    return { data: null, error: error.message };
  }

  logger.info("admin_write", { fn: "updateFaq", entity: "faq", id, action: "update", user_id: user.id });
  revalidatePath("/sss");
  return { data: null, error: null };
}

export async function deleteFaqAction(id: string): Promise<ActionResult> {
  if (IS_DEMO) return { data: null, error: DEMO_ERROR };

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return { data: null, error: "Yetkiniz yok" };

  const { error } = await supabase.from("faqs").delete().eq("id", id);

  if (error) {
    logger.error("mutation_failed", { fn: "deleteFaq", error: error.message });
    return { data: null, error: error.message };
  }

  logger.info("admin_write", { fn: "deleteFaq", entity: "faq", id, action: "delete", user_id: user.id });
  revalidatePath("/sss");
  return { data: null, error: null };
}

// ==========================================
// HERO SLIDE ACTIONS
// ==========================================

export async function createHeroSlideAction(input: {
  title: string;
  subtitle: string;
  image: string;
  cta_text: string;
  cta_link: string;
}): Promise<ActionResult<Record<string, unknown> | null>> {
  if (IS_DEMO) return { data: null, error: DEMO_ERROR };

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return { data: null, error: "Yetkiniz yok" };

  const { data, error } = await supabase
    .from("hero_slides")
    .insert({ ...input, is_active: true })
    .select("*")
    .single();

  if (error) {
    logger.error("mutation_failed", { fn: "createHeroSlide", error: error.message });
    return { data: null, error: error.message };
  }

  logger.info("admin_write", { fn: "createHeroSlide", entity: "hero_slide", id: data.id, action: "create", user_id: user.id });
  revalidatePath("/");
  return { data, error: null };
}

export async function updateHeroSlideAction(
  id: string,
  updates: Partial<{
    title: string;
    subtitle: string;
    image: string;
    cta_text: string;
    cta_link: string;
  }>
): Promise<ActionResult> {
  if (IS_DEMO) return { data: null, error: DEMO_ERROR };

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return { data: null, error: "Yetkiniz yok" };

  const { error } = await supabase.from("hero_slides").update(updates).eq("id", id);

  if (error) {
    logger.error("mutation_failed", { fn: "updateHeroSlide", error: error.message });
    return { data: null, error: error.message };
  }

  logger.info("admin_write", { fn: "updateHeroSlide", entity: "hero_slide", id, action: "update", user_id: user.id });
  revalidatePath("/");
  return { data: null, error: null };
}

export async function deleteHeroSlideAction(id: string): Promise<ActionResult> {
  if (IS_DEMO) return { data: null, error: DEMO_ERROR };

  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return { data: null, error: "Yetkiniz yok" };

  const { error } = await supabase.from("hero_slides").delete().eq("id", id);

  if (error) {
    logger.error("mutation_failed", { fn: "deleteHeroSlide", error: error.message });
    return { data: null, error: error.message };
  }

  logger.info("admin_write", { fn: "deleteHeroSlide", entity: "hero_slide", id, action: "delete", user_id: user.id });
  revalidatePath("/");
  return { data: null, error: null };
}
