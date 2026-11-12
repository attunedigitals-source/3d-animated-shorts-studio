import { describe, it, expect } from 'vitest';
import { Gemini3DStudioEngine } from '../src/gemini-studio-engine';
import { AI33VoiceEngine } from '../src/ai33-voice-engine';
import { Pure3DStudioPipelineOrchestrator } from '../src/pipeline-orchestrator';

describe('Pure AI 3D Studio Core Engine', () => {
  const gemini = new Gemini3DStudioEngine();
  const voice = new AI33VoiceEngine();
  const orchestrator = new Pure3DStudioPipelineOrchestrator();

  it('Step 1: Deep Research (deep-research-max-preview-04-2026)', async () => {
    const res = await gemini.researchTopic("Napoleon's retreat from Moscow 1812");
    expect(res.viralHooks.length).toBeGreaterThan(0);
    expect(res.obscureFacts.length).toBeGreaterThan(0);
    expect(res.retentionAngles.length).toBeGreaterThan(0);
  });

  it('Step 2: Screenwriting & Character DNA (gemini-2.5-pro)', async () => {
    const res = await gemini.generateScreenplayAndDNA({
      topic: "Napoleon's retreat from Moscow 1812",
      aspectRatio: '9:16',
    });
    expect(res.title).toBeTruthy();
    expect(res.character.visualIdentityMatrix.promptTokens).toContain('DNA');
    expect(res.beats.length).toBeGreaterThanOrEqual(6);
  });

  it('Step 3: Canonical 3D Character Sheet (gemini-3-pro-image)', async () => {
    const res = await gemini.generateScreenplayAndDNA({ topic: 'Napoleon' });
    const sheet = await gemini.generateCanonicalCharacterSheet(res.character);
    expect(sheet.sheetImageUrl).toBeTruthy();
    expect(sheet.characterId).toBe(res.character.id);
  });

  it('Step 4: Spatial Continuity Supervision (gemini-4-argon)', async () => {
    const res = await gemini.generateScreenplayAndDNA({ topic: 'Napoleon' });
    const audit = await gemini.auditSpatialContinuity(res.beats, res.character);
    expect(audit.isContinuous).toBe(true);
  });

  it('Step 5: Voice Acting with Word Timestamps (ai33.pro)', async () => {
    const narration = await voice.synthesizeNarration('In October 1812 the army retreated into ice.');
    expect(narration.audioUrl).toBeTruthy();
    expect(narration.timestamps.length).toBeGreaterThan(5);
    expect(narration.timestamps[0]!.startMs).toBe(0);
  });

  it('Step 6: Multimodal Conditioned 3D Shots (gemini-3-pro-image)', async () => {
    const res = await gemini.generateScreenplayAndDNA({ topic: 'Napoleon' });
    const sheet = await gemini.generateCanonicalCharacterSheet(res.character);
    const shot = await gemini.generateConditionedShotKeyframe(res.beats[0]!, res.character, sheet, '9:16');
    expect(shot.imageUrl).toBeTruthy();
    expect(shot.cameraTrajectory).toBeDefined();
  });

  it('Step 7: Adaptive Soundtrack (Lyria 3.5)', async () => {
    const score = await gemini.composeAdaptiveSoundtrack({
      mood: 'Epic blizzard',
      durationSeconds: 60,
      timestamps: [{ word: 'Test', startMs: 0, endMs: 500 }],
    });
    expect(score.audioUrl).toBeTruthy();
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
    expect(qa.characterConsistencyScore).toBeGreaterThanOrEqual(90);
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
