import { getHeroSlides } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import HeroSliderClient from "./HeroSliderClient";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default async function HeroSlider() {
  const client = IS_DEMO ? undefined : await createServerSupabaseClient();
  const slides = await getHeroSlides(client);

  return <HeroSliderClient slides={slides} />;
}
