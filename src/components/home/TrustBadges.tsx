import { Truck, ShieldCheck, Headphones, Award, Star, Heart, Zap, Clock } from "lucide-react";
import { getTrustBadges } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const ICON_MAP: Record<string, React.ElementType> = {
  Truck, ShieldCheck, Headphones, Award, Star, Heart, Zap, Clock,
};

export default async function TrustBadges() {
  const client = IS_DEMO ? undefined : await createServerSupabaseClient();
  const badges = await getTrustBadges(client);

  return (
    <section className="border-y border-dark-100 bg-white dark:bg-dark-800 py-6 sm:py-8 dark:border-dark-700">
      <div className="container-custom">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-8">
          {badges.map((badge) => {
            const IconComp = ICON_MAP[badge.icon] || Award;
            return (
              <div key={badge.id} className="flex items-center gap-3">
                <div className="flex-shrink-0 text-primary-600">
                  <IconComp size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-dark-900 dark:text-dark-50">{badge.title}</h3>
                  <p className="text-xs text-dark-500 dark:text-dark-400">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
