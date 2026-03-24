import Link from "next/link";
import { Calendar, ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogPostBySlug } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { SITE_URL } from "@/lib/constants";
import JsonLd, { buildArticleSchema, buildBreadcrumbSchema } from "@/components/seo/JsonLd";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const revalidate = 3600; // 1 saat

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

async function getPost(slug: string) {
  const client = IS_DEMO ? undefined : await createServerSupabaseClient();
  return getBlogPostBySlug(slug, client);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Yazı Bulunamadı" };
  return {
    title: post.title,
    description: post.excerpt || post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
      type: "article",
      images: [
        {
          url: "/images/og-default.png",
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || post.title,
      images: ["/images/og-default.png"],
    },
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  return (
    <>
      <JsonLd data={buildArticleSchema({ title: post.title, slug: post.slug, excerpt: post.excerpt || "", created_at: post.created_at, category: post.category })} />
      <JsonLd data={buildBreadcrumbSchema([{ name: "Blog", href: "/blog" }, { name: post.title }])} />
      <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Blog", href: "/blog" }, { label: post.title }]} />
      </div>

      <div className="container mx-auto px-4">
        <article className="mx-auto max-w-3xl">
          <Link href="/blog" className="mb-4 inline-flex items-center gap-1 text-sm text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:text-dark-200">
            <ArrowLeft size={14} />
            Blog&apos;a Dön
          </Link>

          <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full bg-primary-50 dark:bg-primary-900/30 px-3 py-1 text-xs font-medium text-primary-700">
                {post.category}
              </span>
              <span className="flex items-center gap-1 text-sm text-dark-500">
                <Calendar size={14} />
                {formatDate(post.created_at)}
              </span>
            </div>

            <h1 className="mb-6 text-2xl font-bold text-dark-900 dark:text-dark-50 md:text-3xl">{post.title}</h1>

            <div className="mb-6 aspect-video rounded-lg bg-dark-100" />

            <div className="prose max-w-none">
              <p className="text-lg leading-relaxed text-dark-700 dark:text-dark-200">{post.excerpt}</p>
              <p className="mt-4 leading-relaxed text-dark-600 dark:text-dark-300">{post.content}</p>
            </div>
          </div>
        </article>
      </div>
    </div>
    </>
  );
}
