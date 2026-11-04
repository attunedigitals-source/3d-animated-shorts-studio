import {
  StoryPromptOptions,
  StoryDocument,
  ScriptDocument,
  StructuredScene,
  AIGenerationMetadata,
  AISettings,
  TestConnectionResponse,
} from '@studio/types';
import { IAIProviderAdapter } from './types';

export class MockAIAdapter implements IAIProviderAdapter {
  readonly providerName = 'mock';

  async testConnection(_settings?: Partial<AISettings>): Promise<TestConnectionResponse> {
    return {
      connected: true,
      provider: 'mock',
      model: 'deterministic-mock-v1',
      latencyMs: 12,
      message: 'Offline Mock AI Engine is healthy and fully operational.',
    };
  }

  async generateStory(
    options: StoryPromptOptions,
    _settings?: Partial<AISettings>,
  ): Promise<{ story: StoryDocument; metadata: Omit<AIGenerationMetadata, 'id' | 'createdAt'> }> {
    const start = Date.now();
    const topic = options.topic;
    const cleanTitle = options.title || `The Curious Tale of ${topic.slice(0, 24)}`;

    // Create an original, context-driven cartoon story
    const story: StoryDocument = {
      title: cleanTitle,
      logline: `When an eccentric inventor attempts to master "${topic}", an unexpected chain of chaotic events forces them to improvise the ultimate solution.`,
      premise: `In a vibrant ${options.visualStyle.toLowerCase()} world, everyday challenges become epic adventures of slapstick timing and whimsical determination.`,
      beginning: `Our hero discovers an unusual challenge regarding "${topic}" and vows to overcome it with maximum enthusiasm and zero preparation.`,
      mainConflict: `Everything that can go wrong does go wrong: gizmos spark, rules bend, and a tiny oversight cascades into total comedy pandemonium.`,
      turningPoints: [
        `The first attempt at "${topic}" seems like a triumph until a loud squeak signals disaster.`,
        `A desperate improvisational shortcut backfires spectacularly, escalating the stakes.`,
      ],
      climax: `At the absolute peak of the chaos, with time running out, our protagonist executes an audacious, gravity-defying stunt that turns the disaster on its head.`,
      ending: `Order is restored in the most hilarious, unexpected manner possible—leaving our hero proud, slightly singed, and ready for the next adventure.`,
      characterDescriptions: [
        {
          name: 'Barnaby Bix',
          role: 'Protagonist',
          personality: 'Optimistic, clumsy, wildly inventive, never admits defeat',
          appearance: 'Stylized 3D humanoid with oversized goggles, curly auburn hair, and teal dungarees',
          visualDistinctives: 'Brass wrench tucked behind ear and a scarf that defies gravity',
        },
        {
          name: 'Clank',
          role: 'Robotic Companion',
          personality: 'Dry-witted, anxious, cautious, silently judgmental',
          appearance: 'Round brass automaton with luminous expressive blue optical dials',
          visualDistinctives: 'Antenna that curls into a question mark when startled',
        },
      ],
      emotionalProgression: 'Eager Ambition -> Comedic Bewilderment -> Slapstick Panic -> Triumphant Relief',
    };

    const latencyMs = Date.now() - start;

    return {
      story,
      metadata: {
        stage: 'story',
        provider: 'mock',
        model: 'mock-story-generator-v1',
        promptSnippet: options.topic.slice(0, 100),
        tokensUsed: 420,
        latencyMs,
        status: 'success',
      },
    };
  }

  async generateScript(
    story: StoryDocument,
    targetDurationSeconds: number,
    _settings?: Partial<AISettings>,
  ): Promise<{ script: ScriptDocument; metadata: Omit<AIGenerationMetadata, 'id' | 'createdAt'> }> {
    const start = Date.now();
    const sceneCount = Math.max(3, Math.min(6, Math.round(targetDurationSeconds / 6)));
    const perSceneDuration = Math.round(targetDurationSeconds / sceneCount);

    const scenes = [
      {
        sceneNumber: 1,
        sceneHeading: 'INT. WORKSHOP - DAY',
        narration: `Barnaby had one simple goal today: conquer ${story.title.toLowerCase()}.`,
        dialogue: [
          {
            characterName: 'Barnaby Bix',
            line: "Clank, hold the hydro-wrench! Today we make history!",
            deliveryInstruction: 'wide-eyed and beaming with boundless optimism',
          },
          {
            characterName: 'Clank',
            line: "*Mechanical whir* History or an insurance claim?",
            deliveryInstruction: 'monotone optical flicker',
          },
        ],
        actionDescriptions:
          'Barnaby dramatically pulls a velvet dust cover off a rumbling, vibrating contraption. Steam billows out.',
        emotionalDirection: 'High-energy cartoon anticipation and slapstick readiness.',
        approximateDurationSeconds: perSceneDuration,
        estimatedWordCount: 22,
      },
      {
        sceneNumber: 2,
        sceneHeading: 'INT. WORKSHOP - MOMENTS LATER',
        narration: 'Confidence was high. The structural integrity of the machine, however, was not.',
        dialogue: [
          {
            characterName: 'Barnaby Bix',
            line: "Just a gentle nudge on the primary valve...",
            deliveryInstruction: 'straining while pushing a giant brass lever',
          },
          {
            characterName: 'Clank',
            line: "Warning: Thermal threshold exceeded by three hundred percent.",
            deliveryInstruction: 'spinning eyes frantic',
          },
        ],
        actionDescriptions:
          'The lever snaps off cleanly in Barnaby\'s hand. The machine rattles violently, ejecting springs and rainbow-colored sparks into the air.',
        emotionalDirection: 'Mounting panic and escalating physical comedy.',
        approximateDurationSeconds: perSceneDuration,
        estimatedWordCount: 26,
      },
      {
        sceneNumber: 3,
        sceneHeading: 'INT. WORKSHOP - CLIMAX',
        narration: 'Desperate times call for ridiculous cartoon physics.',
        dialogue: [
          {
            characterName: 'Barnaby Bix',
            line: "Hang on to your gears, Clank! We are improvising!",
            deliveryInstruction: 'shouting over roaring comedic steam engines',
          },
        ],
        actionDescriptions:
          'Barnaby catapults across the room using a stretched rubber conveyor belt, corking the runaway boiler with an oversized teapot mid-air.',
        emotionalDirection: 'Peak slapstick frenzy culminating in breathtaking athletic triumph.',
        approximateDurationSeconds: perSceneDuration,
        estimatedWordCount: 18,
      },
      {
        sceneNumber: 4,
        sceneHeading: 'INT. WORKSHOP - AFTERMATH',
        narration: 'And just like that, against all laws of engineering, it actually worked.',
        dialogue: [
          {
            characterName: 'Barnaby Bix',
            line: "Flawless execution! Wouldn't you agree?",
            deliveryInstruction: 'smiling with soot-covered cheeks',
          },
          {
            characterName: 'Clank',
            line: "I am recalculating my life choices.",
            deliveryInstruction: 'tiny polite beep',
          },
        ],
        actionDescriptions:
          'The machine pops out a tiny, perfectly polished golden trophy. Barnaby winks at the camera as the scene buttons.',
        emotionalDirection: 'Warm cartoon comedy resolution with a punchy button.',
        approximateDurationSeconds: targetDurationSeconds - perSceneDuration * 3,
        estimatedWordCount: 20,
      },
    ].slice(0, sceneCount);

    const totalWords = scenes.reduce((sum, s) => sum + s.estimatedWordCount, 0);

    const script: ScriptDocument = {
      title: story.title,
      scenes,
      totalWordCount: totalWords,
      totalEstimatedDurationSeconds: targetDurationSeconds,
      targetDurationSeconds,
    };

    const latencyMs = Date.now() - start;

    return {
      script,
      metadata: {
        stage: 'script',
        provider: 'mock',
        model: 'mock-script-generator-v1',
        promptSnippet: story.title,
        tokensUsed: 650,
        latencyMs,
        status: 'success',
      },
    };
  }

  async breakdownScenes(
    script: ScriptDocument,
    _story?: StoryDocument,
    _settings?: Partial<AISettings>,
  ): Promise<{ scenes: StructuredScene[]; metadata: Omit<AIGenerationMetadata, 'id' | 'createdAt'> }> {
    const start = Date.now();

    const structuredScenes: StructuredScene[] = script.scenes.map((s, idx) => ({
      id: `scene-${idx + 1}-${Date.now().toString(36).slice(-4)}`,
      sceneNumber: s.sceneNumber,
      sceneTitle: s.sceneHeading.replace(/^(INT\.|EXT\.)\s*/, ''),
      sceneDescription: s.actionDescriptions,
      charactersInvolved: ['Barnaby Bix', 'Clank'],
      characterActions: s.actionDescriptions,
      dialogue: s.dialogue.map((d) => ({
        characterName: d.characterName,
        line: d.line,
        emotion: d.deliveryInstruction,
      })),
      narration: s.narration,
      environmentDescription:
        'Stylized Victorian-steampunk inventor workshop with pastel brass pipes, cobblestone floor textures, sunbeams through a round window, and cozy ambient lighting.',
      propsRequired: ['brass hydro-wrench', 'steaming boiler machine', 'oversized teapot', 'golden trophy'],
      emotionalTone: s.emotionalDirection,
      cameraDirectionSuggestions:
        idx === 0
          ? 'Medium establishing shot panning slowly left to right'
          : idx === 1
          ? 'Close-up on trembling hands, snappy Dutch tilt as machine vibrates'
          : idx === 2
          ? 'Dynamic wide-angle tracking camera following airborne leap'
          : 'Low-angle medium close-up focused on soot-faced triumph',
      approximateDurationSeconds: s.approximateDurationSeconds,
      continuityNotes:
        idx > 1
          ? 'Soot marks on Barnaby face and slight dent in Clank head casing carry forward.'
          : 'Clean pristine starting state.',
    }));

    const latencyMs = Date.now() - start;

    return {
      scenes: structuredScenes,
      metadata: {
        stage: 'scene_breakdown',
        provider: 'mock',
        model: 'mock-scene-breakdown-v1',
        promptSnippet: script.title,
        tokensUsed: 890,
        latencyMs,
        status: 'success',
      },
    };
  }
}

