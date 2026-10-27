import type { PromptTemplate } from "@/types";
import { isPromptTemplateArray } from "@/lib/typeGuards";

import learningExplainLikeExpert from "./learning/explain-like-expert.json";
import writingEditMyWriting from "./writing/edit-my-writing.json";
import thinkingDecisionFramework from "./thinking/decision-framework.json";
import summarizationSummarizeDocument from "./summarization/summarize-document.json";
import creativityBrainstormIdeas from "./creativity/brainstorm-ideas.json";
import writingRewriteEmail from "./writing/rewrite-email.json";
import productivityNoteCleanup from "./productivity/note-cleanup.json";
import writingFeedbackRequest from "./writing/feedback-request.json";
import researchResearchAssistant from "./research/research-assistant.json";
import productivityPlanProject from "./productivity/plan-project.json";
import learningStudyNotes from "./learning/study-notes.json";
import thinkingToolSelectionGuide from "./thinking/tool-selection-guide.json";
import analysisAnalyzeOptions from "./analysis/analyze-options.json";
import productivityWorkflowDesign from "./productivity/workflow-design.json";
import analysisSafeVerify from "./analysis/safe-verify.json";
import creativityImageGeneration from "./creativity/image-generation.json";
import analysisDataAnalysis from "./analysis/data-analysis.json";
import summarizationMeetingSummary from "./summarization/meeting-summary.json";
import writingSocialMediaPost from "./writing/social-media-post.json";
import writingEmailDraft from "./writing/email-draft.json";
import productivityPresentationOutline from "./productivity/presentation-outline.json";
import codingCodeReview from "./coding/code-review.json";
import codingDebugError from "./coding/debug-error.json";
import codingWriteUnitTests from "./coding/write-unit-tests.json";
import codingExplainCode from "./coding/explain-code.json";
import codingRefactorCode from "./coding/refactor-code.json";
import codingApiDesignReview from "./coding/api-design-review.json";
import codingSqlOptimizeQuery from "./coding/sql-optimize-query.json";
import researchResearchSynthesis from "./research/research-synthesis.json";
import learningLearningRoadmap from "./learning/learning-roadmap.json";
import thinkingDecisionMatrix from "./thinking/decision-matrix.json";
import productivityWeeklyReview from "./productivity/weekly-review.json";
import writingCustomerSupportResponse from "./writing/customer-support-response.json";

const rawPromptTemplates = [
  learningExplainLikeExpert,
  writingEditMyWriting,
  thinkingDecisionFramework,
  summarizationSummarizeDocument,
  creativityBrainstormIdeas,
  writingRewriteEmail,
  productivityNoteCleanup,
  writingFeedbackRequest,
  researchResearchAssistant,
  productivityPlanProject,
  learningStudyNotes,
  thinkingToolSelectionGuide,
  analysisAnalyzeOptions,
  productivityWorkflowDesign,
  analysisSafeVerify,
  creativityImageGeneration,
  analysisDataAnalysis,
  summarizationMeetingSummary,
  writingSocialMediaPost,
  writingEmailDraft,
  productivityPresentationOutline,
  codingCodeReview,
  codingDebugError,
  codingWriteUnitTests,
  codingExplainCode,
  codingRefactorCode,
  codingApiDesignReview,
  codingSqlOptimizeQuery,
  researchResearchSynthesis,
  learningLearningRoadmap,
  thinkingDecisionMatrix,
  productivityWeeklyReview,
  writingCustomerSupportResponse,
];

export const promptTemplates: PromptTemplate[] = isPromptTemplateArray(rawPromptTemplates)
  ? rawPromptTemplates
  : [];

export function getPromptBySlug(slug: string): PromptTemplate | undefined {
  return promptTemplates.find((p) => p.slug === slug);
}

export function getStarterPrompts(): PromptTemplate[] {
  return promptTemplates.filter((p) => p.isStarter);
}

export function getPromptsByCategory(category: string): PromptTemplate[] {
  return promptTemplates.filter((p) => p.category === category);
}
