"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Search, ArrowRight, Calendar } from "lucide-react";
import type { BlogPost } from "@/types";
import { formatDate } from "@/lib/utils";

interface Props {
  posts: BlogPost[];
}

export default function GuidesClient({ posts }: Props) {
  const [search, setSearch] = useState("");

  const filtered = posts.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.excerpt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rehberlerde ara..."
            className="w-full rounded-xl border border-dark-200 bg-white dark:bg-dark-800 dark:border-dark-600 dark:bg-dark-800 py-3 pl-10 pr-4 text-sm focus:border-primary-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Guides Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 py-20">
          <BookOpen size={48} className="mb-4 text-dark-200" />
          <p className="text-dark-500 dark:text-dark-400">
            {search ? "Aramanizla eslesen rehber bulunamadi." : "Henuz rehber eklenmemis."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {filtered.map((blog) => (
            <Link
              key={blog.id}
              href={`/blog/${blog.slug}`}
              className="group overflow-hidden rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 transition-shadow hover:shadow-md"
            >
              <div className="aspect-video bg-dark-100" />
              <div className="p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-primary-50 dark:bg-primary-900/30 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                    {blog.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-dark-400">
                    <Calendar size={12} />
                    {formatDate(blog.created_at)}
                  </span>
                </div>
                <h2 className="mb-2 text-lg font-bold text-dark-900 dark:text-dark-50 group-hover:text-primary-600">
                  {blog.title}
                </h2>
                <p className="mb-3 line-clamp-2 text-sm text-dark-500 dark:text-dark-400">{blog.excerpt}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-600">
                  Devamini Oku <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
