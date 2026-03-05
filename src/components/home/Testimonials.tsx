import { getTestimonials } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import TestimonialsClient from "./TestimonialsClient";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default async function Testimonials() {
  const client = IS_DEMO ? undefined : await createServerSupabaseClient();
  const items = await getTestimonials(client);

  return <TestimonialsClient items={items} />;
}
