import type { GlossaryTerm } from "@/types";
import { isGlossaryTermArray } from "@/lib/typeGuards";

import coreConceptsArtificialIntelligence from "./core-concepts/artificial-intelligence.json";
import modelsAndTrainingMachineLearning from "./models-and-training/machine-learning.json";
import modelsAndTrainingLargeLanguageModel from "./models-and-training/large-language-model.json";
import promptingPrompt from "./prompting/prompt.json";
import coreConceptsHallucination from "./core-concepts/hallucination.json";
import modelsAndTrainingToken from "./models-and-training/token.json";
import architectureRag from "./architecture/rag.json";
import architectureEmbedding from "./architecture/embedding.json";
import coreConceptsGenerativeAi from "./core-concepts/generative-ai.json";
import modelsAndTrainingContextWindow from "./models-and-training/context-window.json";
import agentsAndAutomationAgent from "./agents-and-automation/agent.json";
import agentsAndAutomationToolCalling from "./agents-and-automation/tool-calling.json";
import architectureMcp from "./architecture/mcp.json";
import promptingSystemPrompt from "./prompting/system-prompt.json";
import modelsAndTrainingFineTuning from "./models-and-training/fine-tuning.json";
import modelsAndTrainingTemperature from "./models-and-training/temperature.json";
import modelsAndTrainingInference from "./models-and-training/inference.json";
import modelsAndTrainingTransformer from "./models-and-training/transformer.json";
import architectureVectorDatabase from "./architecture/vector-database.json";
import architectureGrounding from "./architecture/grounding.json";
import toolsAndApisPlugin from "./tools-and-apis/plugin.json";
import modelsAndTrainingOpenWeights from "./models-and-training/open-weights.json";
import toolsAndApisLocalModel from "./tools-and-apis/local-model.json";
import multimodalMultimodal from "./multimodal/multimodal.json";
import multimodalTextToImage from "./multimodal/text-to-image.json";
import multimodalOcr from "./multimodal/ocr.json";
import agentsAndAutomationOrchestration from "./agents-and-automation/orchestration.json";
import modelsAndTrainingRlhf from "./models-and-training/rlhf.json";
import safetyAndEthicsGuardrails from "./safety-and-ethics/guardrails.json";
import evaluationEvaluation from "./evaluation/evaluation.json";
import evaluationBenchmark from "./evaluation/benchmark.json";
import architectureSemanticSearch from "./architecture/semantic-search.json";
import promptingFewShotPrompting from "./prompting/few-shot-prompting.json";
import promptingChainOfThought from "./prompting/chain-of-thought.json";
import toolsAndApisApi from "./tools-and-apis/api.json";
import modelsAndTrainingLatency from "./models-and-training/latency.json";
import modelsAndTrainingReasoningModel from "./models-and-training/reasoning-model.json";
import safetyAndEthicsPromptInjection from "./safety-and-ethics/prompt-injection.json";
import architectureMemory from "./architecture/memory.json";
import architectureModelRouting from "./architecture/model-routing.json";
import modelsAndTrainingNeuralNetwork from "./models-and-training/neural-network.json";
import agentsAndAutomationAutomation from "./agents-and-automation/automation.json";
import agentsAndAutomationWorkflow from "./agents-and-automation/workflow.json";
import architectureKnowledgeBase from "./architecture/knowledge-base.json";
import toolsAndApisCopilot from "./tools-and-apis/copilot.json";
import toolsAndApisAssistant from "./tools-and-apis/assistant.json";
import promptingStructuredOutput from "./prompting/structured-output.json";
import safetyAndEthicsHumanInTheLoop from "./safety-and-ethics/human-in-the-loop.json";
import modelsAndTrainingSyntheticData from "./models-and-training/synthetic-data.json";
import modelsAndTrainingTrainingData from "./models-and-training/training-data.json";
import modelsAndTrainingDeepLearning from "./models-and-training/deep-learning.json";
import coreConceptsNaturalLanguageProcessing from "./core-concepts/natural-language-processing.json";
import multimodalDiffusionModel from "./multimodal/diffusion-model.json";
import multimodalStt from "./multimodal/stt.json";
import multimodalTts from "./multimodal/tts.json";
import toolsAndApisCopilotStudio from "./tools-and-apis/copilot-studio.json";
import toolsAndApisPerplexity from "./tools-and-apis/perplexity.json";
import modelsAndTrainingGpt from "./models-and-training/gpt.json";
import modelsAndTrainingClaude from "./models-and-training/claude.json";
import modelsAndTrainingGemini from "./models-and-training/gemini.json";
import safetyAndEthicsSafety from "./safety-and-ethics/safety.json";
import safetyAndEthicsBias from "./safety-and-ethics/bias.json";
import safetyAndEthicsCopyright from "./safety-and-ethics/copyright.json";
import safetyAndEthicsOverreliance from "./safety-and-ethics/overreliance.json";
import modelsAndTrainingLlama from "./models-and-training/llama.json";
import modelsAndTrainingMistral from "./models-and-training/mistral.json";
import architectureRetrieval from "./architecture/retrieval.json";
import agentsAndAutomationAgenticWorkflow from "./agents-and-automation/agentic-workflow.json";
import toolsAndApisNoCode from "./tools-and-apis/no-code.json";
import evaluationModelCard from "./evaluation/model-card.json";
import agentsAndAutomationAutonomousAgent from "./agents-and-automation/autonomous-agent.json";
import agentsAndAutomationMultiAgentSystem from "./agents-and-automation/multi-agent-system.json";
import agentsAndAutomationToolUse from "./agents-and-automation/tool-use.json";
import architectureAttentionMechanism from "./architecture/attention-mechanism.json";
import architectureContextWindow from "./architecture/context-window.json";
import architectureTransformerArchitecture from "./architecture/transformer-architecture.json";
import coreConceptsAgi from "./core-concepts/agi.json";
import coreConceptsAiAgent from "./core-concepts/ai-agent.json";
import coreConceptsAiLiteracy from "./core-concepts/ai-literacy.json";
import coreConceptsDigitalTransformation from "./core-concepts/digital-transformation.json";
import evaluationHumanEvaluation from "./evaluation/human-evaluation.json";
import modelsAndTrainingEmbeddings from "./models-and-training/embeddings.json";
import modelsAndTrainingFoundationModel from "./models-and-training/foundation-model.json";
import modelsAndTrainingInstructionTuning from "./models-and-training/instruction-tuning.json";
import modelsAndTrainingTokenization from "./models-and-training/tokenization.json";
import multimodalMultimodalAi from "./multimodal/multimodal-ai.json";
import multimodalSpeechRecognition from "./multimodal/speech-recognition.json";
import multimodalTextToSpeech from "./multimodal/text-to-speech.json";
import promptingPromptInjection from "./prompting/prompt-injection.json";
import promptingTemperature from "./prompting/temperature.json";
import promptingTopP from "./prompting/top-p.json";
import promptingZeroShotPrompting from "./prompting/zero-shot-prompting.json";
import safetyAndEthicsAiBias from "./safety-and-ethics/ai-bias.json";
import safetyAndEthicsAiHallucination from "./safety-and-ethics/ai-hallucination.json";
import safetyAndEthicsDataPrivacy from "./safety-and-ethics/data-privacy.json";
import toolsAndApisMcp from "./tools-and-apis/mcp.json";
import toolsAndApisSdk from "./tools-and-apis/sdk.json";
import toolsAndApisWebhook from "./tools-and-apis/webhook.json";

const rawGlossaryTerms = [
  coreConceptsArtificialIntelligence,
  modelsAndTrainingMachineLearning,
  modelsAndTrainingLargeLanguageModel,
  promptingPrompt,
  coreConceptsHallucination,
  modelsAndTrainingToken,
  architectureRag,
  architectureEmbedding,
  coreConceptsGenerativeAi,
  modelsAndTrainingContextWindow,
  agentsAndAutomationAgent,
  agentsAndAutomationToolCalling,
  architectureMcp,
  promptingSystemPrompt,
  modelsAndTrainingFineTuning,
  modelsAndTrainingTemperature,
  modelsAndTrainingInference,
  modelsAndTrainingTransformer,
  architectureVectorDatabase,
  architectureGrounding,
  toolsAndApisPlugin,
  modelsAndTrainingOpenWeights,
  toolsAndApisLocalModel,
  multimodalMultimodal,
  multimodalTextToImage,
  multimodalOcr,
  agentsAndAutomationOrchestration,
  modelsAndTrainingRlhf,
  safetyAndEthicsGuardrails,
  evaluationEvaluation,
  evaluationBenchmark,
  architectureSemanticSearch,
  promptingFewShotPrompting,
  promptingChainOfThought,
  toolsAndApisApi,
  modelsAndTrainingLatency,
  modelsAndTrainingReasoningModel,
  safetyAndEthicsPromptInjection,
  architectureMemory,
  architectureModelRouting,
  modelsAndTrainingNeuralNetwork,
  agentsAndAutomationAutomation,
  agentsAndAutomationWorkflow,
  architectureKnowledgeBase,
  toolsAndApisCopilot,
  toolsAndApisAssistant,
  promptingStructuredOutput,
  safetyAndEthicsHumanInTheLoop,
  modelsAndTrainingSyntheticData,
  modelsAndTrainingTrainingData,
  modelsAndTrainingDeepLearning,
  coreConceptsNaturalLanguageProcessing,
  multimodalDiffusionModel,
  multimodalStt,
  multimodalTts,
  toolsAndApisCopilotStudio,
  toolsAndApisPerplexity,
  modelsAndTrainingGpt,
  modelsAndTrainingClaude,
  modelsAndTrainingGemini,
  safetyAndEthicsSafety,
  safetyAndEthicsBias,
  safetyAndEthicsCopyright,
  safetyAndEthicsOverreliance,
  modelsAndTrainingLlama,
  modelsAndTrainingMistral,
  architectureRetrieval,
  agentsAndAutomationAgenticWorkflow,
  toolsAndApisNoCode,
  evaluationModelCard,
  toolsAndApisWebhook,
  toolsAndApisSdk,
  toolsAndApisMcp,
  safetyAndEthicsDataPrivacy,
  safetyAndEthicsAiHallucination,
  safetyAndEthicsAiBias,
  promptingZeroShotPrompting,
  promptingTopP,
  promptingTemperature,
  promptingPromptInjection,
  multimodalTextToSpeech,
  multimodalSpeechRecognition,
  multimodalMultimodalAi,
  modelsAndTrainingTokenization,
  modelsAndTrainingInstructionTuning,
  modelsAndTrainingFoundationModel,
  modelsAndTrainingEmbeddings,
  evaluationHumanEvaluation,
  coreConceptsDigitalTransformation,
  coreConceptsAiLiteracy,
  coreConceptsAiAgent,
  coreConceptsAgi,
  architectureTransformerArchitecture,
  architectureContextWindow,
  architectureAttentionMechanism,
  agentsAndAutomationToolUse,
  agentsAndAutomationMultiAgentSystem,
  agentsAndAutomationAutonomousAgent,
];

export const glossaryTerms: GlossaryTerm[] = isGlossaryTermArray(rawGlossaryTerms)
  ? rawGlossaryTerms
  : [];

export function getGlossaryTermBySlug(slug: string): GlossaryTerm | undefined {
  return glossaryTerms.find((t) => t.slug === slug);
}

export function getGlossaryTermsByCategory(category: string): GlossaryTerm[] {
  return glossaryTerms.filter((t) => t.category === category);
}

export function searchGlossary(query: string): GlossaryTerm[] {
  const q = query.toLowerCase();
  return glossaryTerms.filter(
    (t) =>
      t.term.toLowerCase().includes(q) ||
      t.shortDefinition.toLowerCase().includes(q) ||
      t.alsoKnownAs?.some((aka) => aka.toLowerCase().includes(q))
  );
}
