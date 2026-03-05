import Breadcrumb from "@/components/ui/Breadcrumb";
import Accordion from "@/components/ui/Accordion";
import JsonLd, { buildFAQSchema } from "@/components/seo/JsonLd";
import { getFaqs } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default async function FAQPage() {
  const client = IS_DEMO ? undefined : await createServerSupabaseClient();
  const faqs = await getFaqs(client);

  const items = faqs.map((faq) => ({
    title: faq.question,
    content: faq.answer,
  }));

  return (
    <div className="bg-dark-50 pb-16">
      {faqs.length > 0 && (
        <JsonLd data={buildFAQSchema(faqs.map((f) => ({ question: f.question, answer: f.answer })))} />
      )}
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Sıkça Sorulan Sorular" }]} />
      </div>

      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-dark-900 md:text-3xl">Sıkça Sorulan Sorular</h1>
          <p className="mx-auto mt-2 max-w-xl text-dark-500">
            Merak ettiğiniz soruların yanıtlarını burada bulabilirsiniz.
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <Accordion items={items} />
        </div>
      </div>
    </div>
  );
}
