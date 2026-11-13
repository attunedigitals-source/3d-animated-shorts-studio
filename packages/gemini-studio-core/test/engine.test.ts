import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Gemini3DStudioEngine } from '../src/gemini-studio-engine';
import { AI33VoiceEngine } from '../src/ai33-voice-engine';
import { Pure3DStudioPipelineOrchestrator } from '../src/pipeline-orchestrator';

describe('Pure AI 3D Studio Core Engine (Happy Path with Mocked Providers)', () => {
  const originalFetch = global.fetch;
  const mockKey = 'AIzaSy_test_valid_mock_key_12345';
  const mockVoiceKey = 'ai33_test_voice_key_12345';

  const gemini = new Gemini3DStudioEngine(mockKey);
  const voice = new AI33VoiceEngine(mockVoiceKey);
  const orchestrator = new Pure3DStudioPipelineOrchestrator(mockKey, mockVoiceKey);

  beforeEach(() => {
    vi.restoreAllMocks();

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      // 1. Deep Research Mock
      if (url.includes('deep-research') || url.includes('gemini-3.1-flash-lite') || url.includes('gemini-3.6-flash')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        viralHooks: ['The winter of 1812 changed the course of history.'],
                        obscureFacts: ['Tin buttons crumbled to powder in -38C cold.'],
                        retentionAngles: ['Desperate survival against impossible odds.'],
                        pacingNotes: 'High urgency throughout.',
                        summary: 'Napoleon winter retreat dramatization.',
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        };
      }

      // 2. Screenwriting Mock (gemini-2.5-pro)
      if (url.includes('gemini-2.5-pro')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        title: "Napoleon: The Frozen Descent",
                        character: {
                          name: "Napoleon Bonaparte",
                          role: "Supreme Commander",
                          visualIdentityMatrix: {
                            promptTokens: "[CHAR_NAPOLEON_3D_DNA]",
                            facialGeometry: "High cheekbones, severe brow, steely eyes",
                            skinTone: "Alabaster frostbitten skin",
                            hairTexture: "Windblown dark chestnut hair",
                            wardrobe: "Midnight blue imperial greatcoat with gold epaulettes",
                            renderingStyle: "Unreal Engine 5 cinematic 3D CGI render",
                            colorPalette: ["#1A2B4C", "#D4AF37", "#E0F7FA", "#8B0000"],
                          },
                        },
                        beats: [
                          {
                            beatNumber: 1,
                            type: "Hook",
                            text: "The blizzard swallowed the Grand Army whole.",
                            visualSceneDescription: "Endless frozen white expanse under twilight sky.",
                            action: "Commander pulls greatcoat tight against howling wind.",
                            cameraTrajectory: {
                              shotType: "close-up",
                              motion: "push-in",
                              focalLength: "35mm anamorphic",
                              lighting: "Volumetric rim lighting",
                            },
                            targetDurationSeconds: 6,
                          },
                        ],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        };
      }

      // 3. Continuity Mock (gemini-4-argon)
      if (url.includes('gemini-4-argon')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        isContinuous: true,
                        continuityAuditNotes: "All lighting, wardrobe, and spatial vectors continuous.",
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        };
      }

      // 4. Image Generation Mock (predict)
      if (url.includes(':predict')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            predictions: [
              {
                bytesBase64Encoded: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
              },
            ],
          }),
        };
      }

      // 5. ai33.pro Voice Synthesis Mock
      if (url.includes('ai33.pro')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            audio_url: 'https://cdn.ai33.pro/audio/test_narration.mp3',
            alignment: {
              words: [
                { word: 'The', start: 0.0, end: 0.2 },
                { word: 'blizzard', start: 0.2, end: 0.7 },
                { word: 'swallowed', start: 0.7, end: 1.2 },
                { word: 'the', start: 1.2, end: 1.4 },
                { word: 'army', start: 1.4, end: 1.9 },
                { word: 'whole', start: 1.9, end: 2.5 },
              ],
            },
          }),
        };
      }

      // 6. Visual QA Mock (gemini-omni-1.2-flash)
      if (url.includes('gemini-omni-1.2-flash')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        status: "passed",
                        passed: true,
                        characterConsistencyScore: 95,
                        visualFidelityScore: 96,
                        subtitleLegibility: true,
                        categories: {
                          characterIdentity: { score: 96, passed: true, notes: "Facial bone structure matched" },
                          clothingAndAppearance: { score: 94, passed: true, notes: "Wardrobe consistent" },
                          environmentConsistency: { score: 95, passed: true, notes: "Volumetric fog consistent" },
                          composition: { score: 95, passed: true, notes: "Framing matches cameraTrajectory" },
                          lighting: { score: 96, passed: true, notes: "Rim lighting verified" },
                          visualDefects: { score: 98, passed: true, notes: "Zero rendering artifacts" },
                          sceneContinuity: { score: 93, passed: true, notes: "Transitions logically" },
                        },
                        feedback: ["Verified 95% consistency against canonical turnaround sheet."],
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        };
      }

      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({}),
      };
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('Step 1: Deep Research (deep-research-max-preview-04-2026)', async () => {
    const res = await gemini.researchTopic("Napoleon's retreat from Moscow 1812");
    expect(res.viralHooks.length).toBeGreaterThan(0);
    expect(res.obscureFacts.length).toBeGreaterThan(0);
    expect(res.provenance).toBe('ai_generated');
  });

  it('Step 2: Screenwriting & Character DNA (gemini-2.5-pro)', async () => {
    const res = await gemini.generateScreenplayAndDNA({
      topic: "Napoleon's retreat from Moscow 1812",
      aspectRatio: '9:16',
    });
    expect(res.title).toBeTruthy();
    expect(res.character.visualIdentityMatrix.promptTokens).toContain('DNA');
    expect(res.beats.length).toBeGreaterThanOrEqual(1);
    expect(res.provenance).toBe('ai_generated');
  });

  it('Step 3: Canonical 3D Character Sheet (gemini-3-pro-image)', async () => {
    const res = await gemini.generateScreenplayAndDNA({ topic: 'Napoleon' });
    const sheet = await gemini.generateCanonicalCharacterSheet(res.character);
    expect(sheet.sheetImageUrl).toContain('data:image/png;base64,');
    expect(sheet.characterId).toBe(res.character.id);
    expect(sheet.provenance).toBe('ai_generated');
  });

  it('Step 4: Spatial Continuity Supervision (gemini-4-argon)', async () => {
    const res = await gemini.generateScreenplayAndDNA({ topic: 'Napoleon' });
    const audit = await gemini.auditSpatialContinuity(res.beats, res.character);
    expect(audit.isContinuous).toBe(true);
  });

  it('Step 5: Voice Acting with Word Timestamps (ai33.pro)', async () => {
    const narration = await voice.synthesizeNarration('The blizzard swallowed the army whole.');
    expect(narration.audioUrl).toBe('https://cdn.ai33.pro/audio/test_narration.mp3');
    expect(narration.timestamps.length).toBe(6);
    expect(narration.timestamps[0]!.startMs).toBe(0);
    expect(narration.isEstimatedAlignment).toBe(false);
  });

  it('Step 6: Multimodal Conditioned 3D Shots (gemini-3-pro-image)', async () => {
    const res = await gemini.generateScreenplayAndDNA({ topic: 'Napoleon' });
    const sheet = await gemini.generateCanonicalCharacterSheet(res.character);
    const shot = await gemini.generateConditionedShotKeyframe(res.beats[0]!, res.character, sheet, '9:16');
    expect(shot.imageUrl).toContain('data:image/png;base64,');
    expect(shot.cameraTrajectory).toBeDefined();
    expect(shot.provenance).toBe('ai_generated');
  });

  it('Step 7: Adaptive Soundtrack (Lyria 3.5)', async () => {
    const score = await gemini.composeAdaptiveSoundtrack({
      mood: 'Epic blizzard',
      durationSeconds: 60,
      timestamps: [{ word: 'Test', startMs: 0, endMs: 500 }],
    });
    expect(score.duckingMarkers.length).toBe(1);
    expect(score.duckingMarkers[0]!.targetVolume).toBeLessThan(0.3);
  });

  it('Step 8: Multimodal Visual QA (gemini-omni-1.2-flash)', async () => {
    const res = await gemini.generateScreenplayAndDNA({ topic: 'Napoleon' });
    const sheet = await gemini.generateCanonicalCharacterSheet(res.character);
    const shot = await gemini.generateConditionedShotKeyframe(res.beats[0]!, res.character, sheet, '9:16');
    const qa = await gemini.auditVisualQA({
      canonicalSheet: sheet,
      shots: [shot],
      beats: [res.beats[0]!],
    });
    expect(qa.passed).toBe(true);
    expect(qa.status).toBe('passed');
    expect(qa.characterConsistencyScore).toBe(95);
    expect(qa.categories?.characterIdentity?.score).toBe(96);
  });

  it('End-to-End Orchestrator generates full 3D video project', async () => {
    const project = await orchestrator.runPipeline({
      topic: "Napoleon's retreat from Moscow 1812",
      aspectRatio: '9:16',
    });
    expect(project.id).toBeTruthy();
    expect(project.characters.length).toBe(1);
    expect(project.canonicalSheets.length).toBe(1);
    expect(project.shots?.length).toBe(project.beats.length);
    expect(project.qaReport?.passed).toBe(true);
    expect(project.status).toBe('completed');
  });
});
