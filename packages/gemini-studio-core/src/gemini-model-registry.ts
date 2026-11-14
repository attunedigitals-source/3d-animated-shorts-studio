/**
 * Centralized Google Gemini Model Registry
 * Strictly distinguishes text, research, image, video, music, and multimodal analysis.
 * Records exact model ID, display name, API surface, capabilities, input/output types,
 * stability, availability, and verification timestamp.
 */

import { ModelRegistryEntry, GeminiModelCapability, GeminiApiSurface } from '@studio/types';

/**
 * Priority-ordered pool of models for Deep Research auto-switching.
 * The engine tries the selected/primary model first and smoothly falls back
 * through this list if a model is unavailable (404), rate-limited (429), or down (5xx).
 */
export const DEEP_RESEARCH_MODEL_POOL: readonly string[] = [
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-4-hydrogen',
  'gemini-2.5-flash-lite',
  'gemini-3-flash',
  'gemini-2.5-flash',
];

/**
 * Official Google Gemini Image Generation Models (Nano Banana family).
 * Documented at:
 * - https://ai.google.dev/gemini-api/docs/models
 * - https://ai.google.dev/gemini-api/docs/image-generation
 * - https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite-image
 */
export const OFFICIAL_IMAGE_GENERATION_MODEL_IDS: readonly string[] = [
  'gemini-3.1-flash-image',
  'gemini-3.1-flash-lite-image',
  'gemini-3-pro-image',
  'gemini-2.5-flash-image',
];

export const GEMINI_MODEL_REGISTRY: Record<string, ModelRegistryEntry> = {
  // 1. DEEP RESEARCH PRIORITY POOL & SPECIALIZED RESEARCH MODELS
  'gemini-3.1-flash-lite': {
    id: 'gemini-3.1-flash-lite',
    displayName: 'Gemini 3.1 Flash Lite',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['deep_research', 'text_generation'],
    inputTypes: ['text'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-13T14:00:00Z',
    notes: 'Priority #1 Deep Research & fast UI validation engine.',
  },
  'gemini-3.6-flash': {
    id: 'gemini-3.6-flash',
    displayName: 'Gemini 3.6 Flash',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['deep_research', 'text_generation', 'multimodal_analysis'],
    inputTypes: ['text', 'image'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-13T14:00:00Z',
    notes: 'Priority #2 Deep Research & high-speed analytical reasoning.',
  },
  'gemini-3.5-flash-lite': {
    id: 'gemini-3.5-flash-lite',
    displayName: 'Gemini 3.5 Flash Lite',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['deep_research', 'text_generation'],
    inputTypes: ['text'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-13T14:00:00Z',
    notes: 'Priority #3 Deep Research & low-latency reasoning.',
  },
  'gemini-3.8-flash': {
    id: 'gemini-3.8-flash',
    displayName: 'Gemini 3.8 Flash',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['deep_research', 'text_generation', 'multimodal_analysis'],
    inputTypes: ['text', 'image'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-13T14:00:00Z',
    notes: 'Priority #4 Deep Research & director reasoning.',
  },
  'gemini-4-hydrogen': {
    id: 'gemini-4-hydrogen',
    displayName: 'Gemini 4 Hydrogen',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['deep_research', 'text_generation', 'multimodal_analysis'],
    inputTypes: ['text', 'image'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-13T14:00:00Z',
    notes: 'Priority #5 Deep Research next-gen ultra-fast synthesis.',
  },
  'gemini-2.5-flash-lite': {
    id: 'gemini-2.5-flash-lite',
    displayName: 'Gemini 2.5 Flash Lite',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['deep_research', 'text_generation'],
    inputTypes: ['text'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-13T14:00:00Z',
    notes: 'Priority #6 Deep Research high-availability fallback.',
  },
  'gemini-3-flash': {
    id: 'gemini-3-flash',
    displayName: 'Gemini 3 Flash',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['deep_research', 'text_generation', 'multimodal_analysis'],
    inputTypes: ['text', 'image'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-13T14:00:00Z',
    notes: 'Priority #7 Deep Research balanced flash model.',
  },
  'gemini-3-flash-preview': {
    id: 'gemini-3-flash-preview',
    displayName: 'Gemini 3 Flash Preview',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['deep_research', 'text_generation', 'multimodal_analysis'],
    inputTypes: ['text', 'image'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'PREVIEW',
    lastVerified: '2026-11-13T14:00:00Z',
  },
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['deep_research', 'text_generation', 'multimodal_analysis'],
    inputTypes: ['text', 'image'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-13T14:00:00Z',
    notes: 'Priority #8 Deep Research rock-solid baseline model.',
  },
  'gemini-3.5-flash': {
    id: 'gemini-3.5-flash',
    displayName: 'Gemini 3.5 Flash',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['deep_research', 'text_generation', 'multimodal_analysis'],
    inputTypes: ['text', 'image'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-13T14:00:00Z',
  },
  'deep-research-max-preview-04-2026': {
    id: 'deep-research-max-preview-04-2026',
    displayName: 'Deep Research Max Preview (Apr-21-2026)',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['deep_research', 'text_generation'],
    inputTypes: ['text'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'PREVIEW',
    lastVerified: '2026-11-12T21:00:00Z',
    notes: 'Long-context investigative reasoning for viral hooks, retention triggers, and historical deep dives.',
  },
  'deep-research-preview-04-2026': {
    id: 'deep-research-preview-04-2026',
    displayName: 'Deep Research Preview (Apr-21-2026)',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['deep_research', 'text_generation'],
    inputTypes: ['text'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'PREVIEW',
    lastVerified: '2026-11-12T21:00:00Z',
  },
  'deep-research-pro-preview-12-2025': {
    id: 'deep-research-pro-preview-12-2025',
    displayName: 'Deep Research Pro Preview (Dec-12-2025)',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['deep_research', 'text_generation'],
    inputTypes: ['text'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'PREVIEW',
    lastVerified: '2026-11-12T21:00:00Z',
  },

  // 2. LEAD SCREENWRITING & REASONING
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['text_generation', 'multimodal_analysis'],
    inputTypes: ['text', 'image'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-12T21:00:00Z',
    notes: 'Primary screenwriting and Visual Identity Matrix (Character DNA) reasoning engine.',
  },
  'gemini-3.1-pro-preview': {
    id: 'gemini-3.1-pro-preview',
    displayName: 'Gemini 3.1 Pro Preview',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['text_generation', 'multimodal_analysis'],
    inputTypes: ['text', 'image'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'PREVIEW',
    lastVerified: '2026-11-12T21:00:00Z',
    notes: 'Advanced frontier reasoning candidate.',
  },
  'gemini-pro-latest': {
    id: 'gemini-pro-latest',
    displayName: 'Gemini Pro Latest',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['text_generation'],
    inputTypes: ['text'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-12T21:00:00Z',
  },

  // 3. SPATIAL CONTINUITY & DIRECTING
  'gemini-4-argon': {
    id: 'gemini-4-argon',
    displayName: 'Gemini 4 Argon',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['text_generation', 'multimodal_analysis'],
    inputTypes: ['text', 'image'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-12T21:00:00Z',
    notes: 'Frontier spatial reasoning: object permanence, lighting color temperatures, camera axis rules.',
  },
  'gemini-4-carbon': {
    id: 'gemini-4-carbon',
    displayName: 'Gemini 4 Carbon',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['text_generation', 'multimodal_analysis'],
    inputTypes: ['text', 'image'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-12T21:00:00Z',
  },
  'gemini-3.7-flash': {
    id: 'gemini-3.7-flash',
    displayName: 'Gemini 3.7 Flash',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['text_generation', 'multimodal_analysis'],
    inputTypes: ['text', 'image'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-12T21:00:00Z',
    notes: 'Cinematographer & scene director: camera trajectories, focal lengths, and lighting cues.',
  },

  // 4. IMAGE GENERATION & CONDITIONING (Nano Banana Official Catalogue)
  'gemini-3.1-flash-image': {
    id: 'gemini-3.1-flash-image',
    displayName: 'Nano Banana 2',
    provider: 'Google',
    apiSurface: 'predict',
    capabilities: ['image_generation'],
    inputTypes: ['text', 'image'],
    outputTypes: ['image'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-14T10:00:00Z',
    notes: 'Nano Banana 2: High-speed native Gemini 3.1 Flash image generation and reference conditioning.',
  },
  'gemini-3.1-flash-lite-image': {
    id: 'gemini-3.1-flash-lite-image',
    displayName: 'Nano Banana 2 Lite',
    provider: 'Google',
    apiSurface: 'predict',
    capabilities: ['image_generation'],
    inputTypes: ['text', 'image'],
    outputTypes: ['image'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-14T10:00:00Z',
    notes: 'Nano Banana 2 Lite: Low-latency, cost-efficient native Gemini 3.1 Flash Lite image generation and conditioning.',
  },
  'gemini-3-pro-image': {
    id: 'gemini-3-pro-image',
    displayName: 'Nano Banana Pro',
    provider: 'Google',
    apiSurface: 'predict',
    capabilities: ['image_generation'],
    inputTypes: ['text', 'image'],
    outputTypes: ['image'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-14T10:00:00Z',
    notes: 'Nano Banana Pro: High-end 3D CGI character sheet & reference-conditioned scene keyframe generation.',
  },
  'gemini-2.5-flash-image': {
    id: 'gemini-2.5-flash-image',
    displayName: 'Nano Banana',
    provider: 'Google',
    apiSurface: 'predict',
    capabilities: ['image_generation'],
    inputTypes: ['text', 'image'],
    outputTypes: ['image'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-14T10:00:00Z',
    notes: 'Nano Banana: Foundational Gemini 2.5 Flash native image generation and editing.',
  },
  // Documented preview aliases for Gemini image models
  'gemini-3.1-flash-image-preview': {
    id: 'gemini-3.1-flash-image-preview',
    displayName: 'Nano Banana 2 Preview',
    provider: 'Google',
    apiSurface: 'predict',
    capabilities: ['image_generation'],
    inputTypes: ['text', 'image'],
    outputTypes: ['image'],
    isAvailable: true,
    stability: 'PREVIEW',
    lastVerified: '2026-11-14T10:00:00Z',
  },
  'gemini-3.1-flash-lite-image-preview': {
    id: 'gemini-3.1-flash-lite-image-preview',
    displayName: 'Nano Banana 2 Lite Preview',
    provider: 'Google',
    apiSurface: 'predict',
    capabilities: ['image_generation'],
    inputTypes: ['text', 'image'],
    outputTypes: ['image'],
    isAvailable: true,
    stability: 'PREVIEW',
    lastVerified: '2026-11-14T10:00:00Z',
  },
  'gemini-3-pro-image-preview': {
    id: 'gemini-3-pro-image-preview',
    displayName: 'Nano Banana Pro Preview',
    provider: 'Google',
    apiSurface: 'predict',
    capabilities: ['image_generation'],
    inputTypes: ['text', 'image'],
    outputTypes: ['image'],
    isAvailable: true,
    stability: 'PREVIEW',
    lastVerified: '2026-11-14T10:00:00Z',
  },
  'gemini-2.5-flash-image-preview': {
    id: 'gemini-2.5-flash-image-preview',
    displayName: 'Nano Banana Preview',
    provider: 'Google',
    apiSurface: 'predict',
    capabilities: ['image_generation'],
    inputTypes: ['text', 'image'],
    outputTypes: ['image'],
    isAvailable: true,
    stability: 'PREVIEW',
    lastVerified: '2026-11-14T10:00:00Z',
  },

  // 5. MULTIMODAL VISUAL QA INSPECTION
  'gemini-omni-1.2-flash': {
    id: 'gemini-omni-1.2-flash',
    displayName: 'Gemini Omni 1.2 Flash',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['multimodal_analysis', 'text_generation'],
    inputTypes: ['text', 'image', 'audio', 'video'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-12T21:00:00Z',
    notes: 'Multimodal visual QA inspector auditing facial consistency, clothing, and composition against reference sheet.',
  },
  'gemini-omni-1.1-flash': {
    id: 'gemini-omni-1.1-flash',
    displayName: 'Gemini Omni 1.1 Flash',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['multimodal_analysis', 'text_generation'],
    inputTypes: ['text', 'image', 'audio', 'video'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-12T21:00:00Z',
  },

  // 7. VIDEO & MUSIC GENERATION (Explicit Availability & API Surface Mapping)
  'veo-3.1-generate-preview': {
    id: 'veo-3.1-generate-preview',
    displayName: 'Veo 3.1 Video Preview (veo-3.1-generate-preview)',
    provider: 'Google',
    apiSurface: 'unavailable',
    capabilities: ['video_generation'],
    inputTypes: ['text', 'image'],
    outputTypes: ['video'],
    isAvailable: false,
    stability: 'PREVIEW',
    lastVerified: '2026-11-12T21:00:00Z',
    notes: 'Google Veo video generation is restricted to private preview on Vertex AI and is not exposed on public generativelanguage.googleapis.com Developer API endpoints.',
  },
  'lyria-3.5': {
    id: 'lyria-3.5',
    displayName: 'Lyria 3.5 Music (lyria-3.5)',
    provider: 'Google',
    apiSurface: 'predictAudio',
    capabilities: ['music_generation'],
    inputTypes: ['text'],
    outputTypes: ['audio'],
    isAvailable: false,
    stability: 'STABLE',
    lastVerified: '2026-11-12T21:00:00Z',
    notes: 'Lyria audio generation requires specialized enterprise Google DeepMind audio credentials; marked unavailable on standard API keys.',
  },
  'lyria-3-pro-preview': {
    id: 'lyria-3-pro-preview',
    displayName: 'Lyria 3 Pro Preview (lyria-3-pro-preview)',
    provider: 'Google',
    apiSurface: 'predictAudio',
    capabilities: ['music_generation'],
    inputTypes: ['text'],
    outputTypes: ['audio'],
    isAvailable: false,
    stability: 'PREVIEW',
    lastVerified: '2026-11-12T21:00:00Z',
    notes: 'Lyria audio generation is gated by Google DeepMind private preview.',
  },
};

/**
 * Strict check for whether a model supports image generation OUTPUT (not merely multimodal image INPUT).
 * Do NOT automatically classify every model supporting image input as supporting image output.
 */
export function isImageOutputCapableModel(
  modelId: string,
  apiMetadata?: { supportedGenerationMethods?: string[]; description?: string; displayName?: string }
): boolean {
  const cleanId = modelId.replace(/^models\//, '');
  const staticEntry = GEMINI_MODEL_REGISTRY[cleanId];
  if (staticEntry) {
    return staticEntry.capabilities.includes('image_generation') && staticEntry.outputTypes.includes('image');
  }

  // Official Google Gemini image-output model naming patterns (e.g. gemini-3.1-flash-lite-image, imagen-3.0-generate-002)
  const isOfficialImageModelId =
    /^gemini-[0-9]+(?:\.[0-9]+)?-(?:pro|flash(?:-lite)?)-image(?:-preview(?:-[0-9-]+)?)?$/i.test(cleanId) ||
    /^imagen-[0-9]+(?:\.[0-9]+)?-(?:fast-)?generate-[0-9a-z-]+$/i.test(cleanId) ||
    /^nano-banana-[0-9a-z.-]+$/i.test(cleanId);

  if (isOfficialImageModelId) {
    return true;
  }

  // If Google Models API metadata is provided, check whether it explicitly exposes `:predict` image generation
  // or explicitly describes native image generation output (Nano Banana / image output).
  // Note: `generateContent` alone does NOT imply image output because text models also use `generateContent` with image input.
  if (apiMetadata?.supportedGenerationMethods?.includes('predict') && /image|imagen|banana/i.test(cleanId)) {
    return true;
  }

  return false;
}

/**
 * Retrieve a model entry from the registry by its model ID.
 * Does not reject officially documented Google Gemini models merely because they were added after
 * the static catalogue snapshot, while strictly distinguishing image-output models from text/image-input models.
 */
export function getModelRegistryEntry(modelId: string): ModelRegistryEntry | undefined {
  const cleanId = modelId.replace(/^models\//, '');
  const existing = GEMINI_MODEL_REGISTRY[cleanId];
  if (existing) {
    return existing;
  }

  // Dynamically recognize officially documented Gemini image-generation model variants
  if (isImageOutputCapableModel(cleanId)) {
    return {
      id: cleanId,
      displayName: cleanId,
      provider: 'Google',
      apiSurface: 'predict',
      capabilities: ['image_generation'],
      inputTypes: ['text', 'image'],
      outputTypes: ['image'],
      isAvailable: true,
      stability: cleanId.includes('preview') ? 'PREVIEW' : 'STABLE',
      lastVerified: new Date().toISOString(),
      notes: 'Dynamically recognized official Google Gemini image-generation model.',
    };
  }

  // Dynamically recognize officially documented Gemini text/multimodal-input model variants (NOT image output)
  if (/^gemini-[0-9]+(?:\.[0-9]+)?-(?:pro|flash(?:-lite)?|ultra)(?:-(?:preview|exp|latest|[0-9]{2}-[0-9]{2}))?$/i.test(cleanId)) {
    return {
      id: cleanId,
      displayName: cleanId,
      provider: 'Google',
      apiSurface: 'generateContent',
      capabilities: ['text_generation', 'multimodal_analysis'],
      inputTypes: ['text', 'image'],
      outputTypes: ['text', 'json'],
      isAvailable: true,
      stability: cleanId.includes('preview') || cleanId.includes('exp') ? 'PREVIEW' : 'STABLE',
      lastVerified: new Date().toISOString(),
      notes: 'Dynamically recognized official Google Gemini text/multimodal model (image input only, not image output).',
    };
  }

  return undefined;
}

/**
 * Assert that a model is registered, available, and supports the required capability.
 * Throws a typed descriptive error if incompatible.
 */
export function assertModelCapable(modelId: string, requiredCapability: GeminiModelCapability): ModelRegistryEntry {
  const entry = getModelRegistryEntry(modelId);

  if (!entry) {
    throw new Error(`[Model Registry Error]: Model "${modelId}" is not recognized in the verified Google Gemini catalogue.`);
  }

  if (!entry.isAvailable) {
    throw new Error(
      `[Model Registry Error]: Model "${entry.displayName}" (${entry.id}) is currently unavailable through the standard Gemini API surface. Reason: ${entry.notes || 'API surface unavailable'}.`
    );
  }

  if (!entry.capabilities.includes(requiredCapability)) {
    throw new Error(
      `[Model Registry Error]: Model "${entry.displayName}" does not support required capability "${requiredCapability}". Supported capabilities: ${entry.capabilities.join(', ')}.`
    );
  }

  return entry;
}

/**
 * Returns all active models supporting a given capability.
 */
export function getAvailableModelsForCapability(capability: GeminiModelCapability): ModelRegistryEntry[] {
  return Object.values(GEMINI_MODEL_REGISTRY).filter(
    (m) => m.isAvailable && m.capabilities.includes(capability)
  );
}
