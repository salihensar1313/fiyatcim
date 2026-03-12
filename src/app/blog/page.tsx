import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { getBlogPosts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Blog — Güvenlik Sistemleri Rehberi",
  description: "Alarm sistemleri, güvenlik kameraları ve akıllı ev teknolojileri hakkında uzman rehberler, ipuçları ve güncel haberler.",
  alternates: { canonical: "/blog" },
};
import { formatDate } from "@/lib/utils";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default async function BlogPage() {
  const client = IS_DEMO ? undefined : await createServerSupabaseClient();
  const posts = await getBlogPosts(client);

  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Blog" }]} />
      </div>

      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50 md:text-3xl">Blog</h1>
          <p className="mx-auto mt-2 max-w-xl text-dark-500 dark:text-dark-400">
            Elektronik dünyasından güncel bilgiler, rehberler ve karşılaştırmalar.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 transition-shadow hover:shadow-md">
              <div className="aspect-video bg-dark-100" />
              <div className="p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-primary-50 dark:bg-primary-900/30 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-dark-500">
                    <Calendar size={12} />
                    {formatDate(post.created_at)}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">{post.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-dark-600 dark:text-dark-300">{post.excerpt}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                  Devamını Oku
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
