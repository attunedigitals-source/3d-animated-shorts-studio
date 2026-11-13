/**
 * Centralized Google Gemini Model Registry
 * Strictly distinguishes text, research, image, video, music, and multimodal analysis.
 * Records exact model ID, display name, API surface, capabilities, input/output types,
 * stability, availability, and verification timestamp.
 */

import { ModelRegistryEntry, GeminiModelCapability, GeminiApiSurface } from '@studio/types';

export const GEMINI_MODEL_REGISTRY: Record<string, ModelRegistryEntry> = {
  // 1. DEEP RESEARCH
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
  'gemini-3.8-flash': {
    id: 'gemini-3.8-flash',
    displayName: 'Gemini 3.8 Flash',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['text_generation', 'multimodal_analysis'],
    inputTypes: ['text', 'image'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-12T21:00:00Z',
  },

  // 4. IMAGE GENERATION & CONDITIONING (Nano Banana)
  'gemini-3-pro-image': {
    id: 'gemini-3-pro-image',
    displayName: 'Nano Banana Pro (gemini-3-pro-image)',
    provider: 'Google',
    apiSurface: 'predict',
    capabilities: ['image_generation'],
    inputTypes: ['text', 'image'],
    outputTypes: ['image'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-12T21:00:00Z',
    notes: 'High-end 3D CGI character sheet & reference-conditioned scene keyframe generation.',
  },
  'gemini-3.1-flash-image': {
    id: 'gemini-3.1-flash-image',
    displayName: 'Nano Banana 2 (gemini-3.1-flash-image)',
    provider: 'Google',
    apiSurface: 'predict',
    capabilities: ['image_generation'],
    inputTypes: ['text', 'image'],
    outputTypes: ['image'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-12T21:00:00Z',
    notes: 'Rapid variations and secondary keyframes.',
  },
  'gemini-2.5-flash-image': {
    id: 'gemini-2.5-flash-image',
    displayName: 'Nano Banana (gemini-2.5-flash-image)',
    provider: 'Google',
    apiSurface: 'predict',
    capabilities: ['image_generation'],
    inputTypes: ['text'],
    outputTypes: ['image'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-12T21:00:00Z',
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

  // 6. FAST UI STREAMING & VALIDATION
  'gemini-3.1-flash-lite': {
    id: 'gemini-3.1-flash-lite',
    displayName: 'Gemini 3.1 Flash Lite',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['text_generation'],
    inputTypes: ['text'],
    outputTypes: ['text', 'json'],
    isAvailable: true,
    stability: 'STABLE',
    lastVerified: '2026-11-12T21:00:00Z',
    notes: 'Sub-second validation and fast schema formatting.',
  },
  'gemini-2.5-flash-lite': {
    id: 'gemini-2.5-flash-lite',
    displayName: 'Gemini 2.5 Flash-Lite',
    provider: 'Google',
    apiSurface: 'generateContent',
    capabilities: ['text_generation'],
    inputTypes: ['text'],
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
 * Retrieve a model entry from the registry by its model ID.
 */
export function getModelRegistryEntry(modelId: string): ModelRegistryEntry | undefined {
  const cleanId = modelId.replace(/^models\//, '');
  return GEMINI_MODEL_REGISTRY[cleanId];
}

/**
 * Assert that a model is registered, available, and supports the required capability.
 * Throws a typed descriptive error if incompatible.
 */
export function assertModelCapable(modelId: string, requiredCapability: GeminiModelCapability): ModelRegistryEntry {
  const cleanId = modelId.replace(/^models\//, '');
  const entry = GEMINI_MODEL_REGISTRY[cleanId];

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
