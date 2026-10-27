import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Flag } from "lucide-react";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import {
  getCategoryMeta,
  getRoadmapByCategory,
  getRoadmaps,
  resolveRoadmapStep,
} from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import type { ResolvedRoadmapStep } from "@/types";

interface Params {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return getRoadmaps().map((roadmap) => ({ category: roadmap.category }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  const roadmap = getRoadmapByCategory(category);
  if (!roadmap) return {};
  return buildMetadata({
    title: roadmap.title,
    description: roadmap.description,
    path: `/${category}/roadmap`,
  });
}

function StepCard({ step, index }: { step: ResolvedRoadmapStep; index: number }) {
  return (
    <Link
      href={step.href}
      className="group flex items-start gap-3 rounded-lg border border-border bg-canvas p-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <span
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-xs font-semibold text-accent-fg"
        aria-hidden="true"
      >
        {index}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span aria-hidden="true">{step.icon}</span>
          <span className="text-sm font-semibold text-fg-default group-hover:text-accent-fg transition-colors">
            {step.title}
          </span>
          {step.meta && <span className="shrink-0 text-xs text-fg-subtle">{step.meta}</span>}
        </span>
        {step.description && (
          <span className="mt-1 block line-clamp-2 text-sm text-fg-muted">{step.description}</span>
        )}
        {step.note && <span className="mt-1 block text-xs text-fg-subtle italic">{step.note}</span>}
      </span>
      <ArrowRight
        className="mt-1 h-3.5 w-3.5 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}

export default async function CategoryRoadmapPage({ params }: Params) {
  const { category } = await params;
  const roadmap = getRoadmapByCategory(category);
  if (!roadmap) notFound();

  const meta = getCategoryMeta(category);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <SectionHeader
        eyebrow={`${roadmap.icon} ${meta.label}`}
        title={roadmap.title}
        description={roadmap.description}
        titleAs="h1"
      />

      <div className="mb-8 flex flex-col gap-2 rounded-xl border border-border bg-canvas-subtle p-4 text-sm text-fg-muted">
        {roadmap.audience && (
          <p>
            <span className="font-semibold text-fg-default">Who it&apos;s for: </span>
            {roadmap.audience}
          </p>
        )}
        {roadmap.estimatedTotal && (
          <p className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-semibold text-fg-default">Estimated total: </span>
              {roadmap.estimatedTotal}
            </span>
          </p>
        )}
        {roadmap.intro && <p className="mt-1">{roadmap.intro}</p>}
      </div>

      <ol className="space-y-10" aria-label={`${roadmap.title} stages`}>
        {roadmap.stages.map((stage, stageIndex) => {
          const steps = stage.steps
            .map(resolveRoadmapStep)
            .filter((step): step is ResolvedRoadmapStep => step !== null);

          return (
            <li key={stage.id} className="relative">
              {stageIndex < roadmap.stages.length - 1 && (
                <span
                  className="absolute left-5 top-12 bottom-[-2.5rem] w-px bg-border sm:left-6"
                  aria-hidden="true"
                />
              )}
              <div className="flex items-start gap-3 sm:gap-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-accent-fg bg-canvas text-sm font-bold text-accent-fg sm:h-12 sm:w-12"
                  aria-hidden="true"
                >
                  {stageIndex + 1}
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-fg-default sm:text-xl">{stage.title}</h2>
                    <DifficultyBadge difficulty={stage.level} />
                    {stage.duration && (
                      <span className="flex items-center gap-1 text-xs text-fg-subtle">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {stage.duration}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-fg-muted">{stage.description}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 pl-[3.25rem] sm:pl-[4.25rem]">
                {steps.map((step, stepIndex) => (
                  <StepCard
                    key={`${step.kind}-${step.href}-${stepIndex}`}
                    step={step}
                    index={stepIndex + 1}
                  />
                ))}
              </div>

              {stage.milestone && (
                <div
                  role="note"
                  className="mt-4 ml-[3.25rem] rounded-lg border border-border bg-accent-subtle/40 p-3 sm:ml-[4.25rem]"
                >
                  <p className="flex items-start gap-2 text-sm text-fg-default">
                    <Flag
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-fg"
                      aria-hidden="true"
                    />
                    <span>
                      <span className="font-semibold">Milestone: </span>
                      {stage.milestone}
                    </span>
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
