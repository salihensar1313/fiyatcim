import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { getBlogPosts } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default async function BlogPreview() {
  const client = IS_DEMO ? undefined : await createServerSupabaseClient();
  const blogs = await getBlogPosts(client);

  return (
    <section className="py-12 sm:py-16">
      <div className="container-custom">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-title">Blog &amp; Haberler</h2>
            <p className="section-subtitle">Güvenlik dünyasından son gelişmeler</p>
          </div>
          <Link
            href="/blog"
            className="hidden items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 sm:flex"
          >
            Tüm Yazılar
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.slice(0, 3).map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="card group overflow-hidden"
            >
              <div className="relative aspect-video overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-200" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">{post.category}</span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <span className="badge-red">{post.category}</span>
                  <span className="flex items-center gap-1 text-xs text-dark-400">
                    <Calendar size={12} />
                    {formatDate(post.created_at)}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-dark-900 dark:text-dark-50 transition-colors group-hover:text-primary-600">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-dark-500 dark:text-dark-400">{post.excerpt}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-600">
                  Devamını Oku
                  <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
