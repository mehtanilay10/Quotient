import type { Metadata } from "next";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { GlossarySearch } from "@/components/content/GlossarySearch";
import { getAllGlossaryTerms } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "AI Glossary",
  description:
    "Plain-English definitions for AI, ML, LLMs, prompting, RAG, agents, and more. The complete reference glossary for modern software engineers.",
  path: "/ai/glossary",
});

export default function GlossaryPage() {
  const terms = getAllGlossaryTerms();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <SectionHeader
        eyebrow="Reference"
        title="AI Glossary"
        description="Plain-English definitions for every AI term you'll encounter. No jargon, no fluff — just clear explanations."
        titleAs="h1"
      />
      <GlossarySearch terms={terms} />
    </div>
  );
}
