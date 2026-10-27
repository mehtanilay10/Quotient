import type { Metadata } from "next";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { PromptCard } from "@/components/content/PromptCard";
import { CalloutBox } from "@/components/ui/CalloutBox";
import { promptTemplates } from "@/content/ai/prompts";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Prompt Library",
  description:
    "Ready-to-use AI prompt templates for coding, writing, research, learning, analysis, and more. Copy and customize for any AI tool.",
  path: "/ai/prompts",
});

const CATEGORIES = [
  { key: "learning", label: "Learning" },
  { key: "writing", label: "Writing" },
  { key: "thinking", label: "Thinking & Decisions" },
  { key: "summarization", label: "Summarization" },
  { key: "research", label: "Research" },
  { key: "analysis", label: "Analysis" },
  { key: "creativity", label: "Creativity" },
  { key: "productivity", label: "Productivity" },
  { key: "coding", label: "Coding" },
];

export default function PromptsPage() {
  const starters = promptTemplates.filter((p) => p.isStarter);
  const byCat = CATEGORIES.map((cat) => ({
    ...cat,
    prompts: promptTemplates.filter((p) => p.category === cat.key),
  })).filter((c) => c.prompts.length > 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <SectionHeader
        eyebrow="Tools"
        title="Prompt Library"
        description="A growing collection of tested prompt templates. Each template has placeholders in [BRACKETS] — replace them with your specific details."
        titleAs="h1"
      />

      <CalloutBox
        variant="tip"
        title="How to use these prompts"
        text="Copy any template, replace the [BRACKETS] with your specific context, and paste into ChatGPT, Claude, or any AI chatbot. The more specific you are with the brackets, the better the results."
        className="mb-8"
      />

      {/* Starter picks */}
      {starters.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-fg-default">⭐ Great starting prompts</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {starters.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        </section>
      )}

      {/* By category */}
      {byCat.map((cat) => (
        <section key={cat.key} className="mb-10">
          <h2 className="mb-4 text-lg font-bold text-fg-default">{cat.label}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {cat.prompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
