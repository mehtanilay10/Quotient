import type { AdvancedConcept } from "@/types";
import { isAdvancedConceptArray } from "@/lib/typeGuards";

import howTransformersWork from "./how-transformers-work.json";
import embeddingsDeepDive from "./embeddings-deep-dive.json";
import ragArchitecture from "./rag-architecture.json";
import agenticWorkflows from "./agentic-workflows.json";
import mcpExplained from "./mcp-explained.json";
import promptInjection from "./prompt-injection.json";
import evaluatingLlmOutputs from "./evaluating-llm-outputs.json";
import localVsCloudAi from "./local-vs-cloud-ai.json";
import multimodalAi from "./multimodal-ai.json";

const rawConcepts = [
  howTransformersWork,
  embeddingsDeepDive,
  ragArchitecture,
  agenticWorkflows,
  mcpExplained,
  promptInjection,
  evaluatingLlmOutputs,
  localVsCloudAi,
  multimodalAi,
];

export const advancedConcepts: AdvancedConcept[] = isAdvancedConceptArray(rawConcepts)
  ? (rawConcepts as AdvancedConcept[])
  : [];

export function getAdvancedConceptBySlug(slug: string): AdvancedConcept | undefined {
  return advancedConcepts.find((c) => c.slug === slug);
}

export function getConceptsByCategory(category: string): AdvancedConcept[] {
  return advancedConcepts.filter((c) => c.category === category);
}
