import Breadcrumb from "@/components/ui/Breadcrumb";
import { getBlogPosts } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import GuidesClient from "./GuidesClient";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default async function GuidesPage() {
  const client = IS_DEMO ? undefined : await createServerSupabaseClient();
  const posts = await getBlogPosts(client);

  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Rehberler" }]} />
      </div>
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-dark-900 dark:text-dark-50">Rehberler</h1>
            <p className="mt-2 text-dark-500 dark:text-dark-400">
              Guvenlik sistemleri hakkinda bilmeniz gereken her sey
            </p>
          </div>
          <GuidesClient posts={posts} />
        </div>
      </div>
    </div>
  );
}
