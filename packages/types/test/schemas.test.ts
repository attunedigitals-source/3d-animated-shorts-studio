import { describe, it, expect } from 'vitest';
import {
  StoryPromptOptionsSchema,
  StoryDocumentSchema,
  ScriptDocumentSchema,
  StructuredSceneSchema,
  CreateProjectSchema,
  AI33TTSRequestSchema,
  AI33DialogueRequestSchema,
  AI33PronunciationRuleSchema,
} from '../src';

describe('Domain Schemas & Validation', () => {
  describe('StoryPromptOptionsSchema', () => {
    it('should validate a valid story prompt', () => {
      const valid = {
        topic: 'A robot chef baking a cake',
        category: 'Comedy',
        targetDurationSeconds: 30,
        intendedAudience: 'Kids',
        tone: 'Slapstick',
        visualStyle: 'Stylized 3D Cartoon',
      };
      const result = StoryPromptOptionsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject a topic shorter than 3 characters', () => {
      const invalid = { topic: 'ab' };
      const result = StoryPromptOptionsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('StoryDocumentSchema', () => {
    it('should validate a complete story document', () => {
      const validStory = {
        title: 'The Great Pancake Catastrophe',
        logline: 'A clumsy robot tries to bake pancakes, but chaos ensues.',
        premise: 'In a whimsical kitchen, pancakes defy gravity.',
        beginning: 'Barnaby discovers a dusty pancake recipe.',
        mainConflict: 'The batter starts floating uncontrollably.',
        turningPoints: ['The syrup begins reacting with the antigravity batter.'],
        climax: 'Barnaby leaps into the air with a giant spatula.',
        ending: 'Pancakes land squarely on the breakfast table.',
        characterDescriptions: [
          {
            name: 'Barnaby',
            role: 'Protagonist',
            personality: 'Clumsy but hopeful',
            appearance: 'Teal robot with brass goggles',
          },
        ],
        emotionalProgression: 'Hopeful -> Panicked -> Victorious',
      };
      const result = StoryDocumentSchema.safeParse(validStory);
      expect(result.success).toBe(true);
    });

    it('should reject a story with missing climax or characters', () => {
      const invalidStory = {
        title: 'Incomplete Story',
        logline: 'Short logline.',
        premise: 'Premise here.',
        beginning: 'Beginning here.',
        mainConflict: 'Conflict here.',
        turningPoints: ['Turning point.'],
        ending: 'Ending.',
        characterDescriptions: [],
        emotionalProgression: 'Flat',
      };
      const result = StoryDocumentSchema.safeParse(invalidStory);
      expect(result.success).toBe(false);
    });
  });

  describe('ScriptDocumentSchema', () => {
    it('should validate a valid narration script', () => {
      const validScript = {
        title: 'The Great Pancake Catastrophe',
        scenes: [
          {
            sceneNumber: 1,
            sceneHeading: 'INT. KITCHEN - MORNING',
            narration: 'The morning started peacefully.',
            dialogue: [
              {
                characterName: 'Barnaby',
                line: 'Batter ready!',
                deliveryInstruction: 'cheerful',
              },
            ],
            actionDescriptions: 'Barnaby pours batter onto the glowing griddle.',
            emotionalDirection: 'Carefree morning optimism',
            approximateDurationSeconds: 5,
            estimatedWordCount: 8,
          },
        ],
        totalWordCount: 8,
        totalEstimatedDurationSeconds: 5,
        targetDurationSeconds: 30,
      };
      const result = ScriptDocumentSchema.safeParse(validScript);
      expect(result.success).toBe(true);
    });
  });

  describe('StructuredSceneSchema', () => {
    it('should validate a 3D production scene breakdown', () => {
      const validScene = {
        id: 'scene-01',
        sceneNumber: 1,
        sceneTitle: 'Kitchen Setup',
        sceneDescription: 'Wide shot of the stylized kitchen as morning light streams through the window.',
        charactersInvolved: ['Barnaby'],
        characterActions: 'Barnaby ties his apron and polishes his spatula.',
        dialogue: [],
        narration: 'Every great breakfast begins with ambition.',
        environmentDescription: 'Warm pastel kitchen with copper pans hanging overhead.',
        propsRequired: ['copper spatula', 'whisk'],
        emotionalTone: 'calm before the storm',
        cameraDirectionSuggestions: 'Slow push in on Barnaby beaming with pride',
        approximateDurationSeconds: 5,
        continuityNotes: 'Clean kitchen counter before any batter is spilled.',
      };
      const result = StructuredSceneSchema.safeParse(validScene);
      expect(result.success).toBe(true);
    });
  });

  describe('CreateProjectSchema', () => {
    it('should validate project creation input and apply defaults', () => {
      const valid = { title: 'My New Short' };
      const parsed = CreateProjectSchema.parse(valid);
      expect(parsed.title).toBe('My New Short');
    });

    it('should reject empty title', () => {
      const invalid = { title: '' };
      const result = CreateProjectSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('ai33.pro Voice Schemas', () => {
    it('should validate single TTS request with provider prefix', () => {
      const valid = {
        voice_id: 'minimax_male-qn-qingse',
        text: 'Hello, this is a test from 3D Animated Shorts Studio.',
        speed: 1.1,
      };
      const parsed = AI33TTSRequestSchema.parse(valid);
      expect(parsed.voice_id).toBe('minimax_male-qn-qingse');
      expect(parsed.speed).toBe(1.1);
      expect(parsed.with_transcript).toBe(false);
    });

    it('should validate multi-speaker dialogue request with labels and speaker array', () => {
      const validDialogue = {
        text: 'A> Hello Barnaby!\nB> Greetings Chef Bot!\nC> Dinner is ready.',
        speakers: [
          { voice_id: 'elevenlabs_hpp4J3VqNfWAUOO0d1Us', speed: 1.0 },
          { voice_id: 'minimax_male-qn-qingse', speed: 1.0 },
          { voice_id: 'edge_en-US-GuyNeural', speed: 1.0 },
        ],
        delay: 0.4,
        with_transcript: true,
      };
      const result = AI33DialogueRequestSchema.safeParse(validDialogue);
      expect(result.success).toBe(true);
    });

    it('should reject dialogue request with fewer than 2 speakers', () => {
      const invalid = {
        text: 'A> Solo monologue.',
        speakers: [{ voice_id: 'edge_en-US-GuyNeural' }],
      };
      const result = AI33DialogueRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should validate pronunciation dictionary rule', () => {
      const rule = {
        from: '3D Studio',
        to: 'Three Dee Studio',
        matchType: 'contains',
      };
      const parsed = AI33PronunciationRuleSchema.parse(rule);
      expect(parsed.from).toBe('3D Studio');
      expect(parsed.caseSensitive).toBe(false);
    });
  });
});

