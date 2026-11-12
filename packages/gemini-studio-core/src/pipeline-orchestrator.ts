/**
 * Pure Gemini 3D Studio Autonomous Pipeline Orchestrator
 * Connects all Google Gemini models and ai33.pro voice in a 1-click pipeline.
 */

import { Pure3DStudioProject, VideoFormat, RenderedShot } from '@studio/types';
import { Gemini3DStudioEngine } from './gemini-studio-engine';
import { AI33VoiceEngine } from './ai33-voice-engine';

export interface PipelineGenerateOptions {
  topic: string;
  aspectRatio?: VideoFormat;
  targetDurationSeconds?: number;
  voiceId?: string;
  geminiKey?: string;
  ai33Key?: string;
  onProgress?: (stage: string, percent: number) => void;
}

export class Pure3DStudioPipelineOrchestrator {
  private readonly geminiEngine: Gemini3DStudioEngine;
  private readonly voiceEngine: AI33VoiceEngine;

  constructor() {
    this.geminiEngine = new Gemini3DStudioEngine();
    this.voiceEngine = new AI33VoiceEngine();
  }

  async runPipeline(options: PipelineGenerateOptions): Promise<Pure3DStudioProject> {
    const notify = (stage: string, pct: number) => {
      if (options.onProgress) options.onProgress(stage, pct);
    };

    const aspectRatio = options.aspectRatio || '9:16';
    const projectId = `proj_3d_${Date.now()}`;
    const now = new Date().toISOString();

    // 1. Deep Research (deep-research-max-preview-04-2026)
    notify('researching', 10);
    const research = await this.geminiEngine.researchTopic(options.topic, options.geminiKey);

    // 2. Screenwriting & Locked Visual DNA (gemini-2.5-pro)
    notify('scripting', 25);
    const screenplay = await this.geminiEngine.generateScreenplayAndDNA({
      topic: options.topic,
      research,
      aspectRatio,
      overrideKey: options.geminiKey,
    });

    const character = screenplay.character;
    const beats = screenplay.beats;

    // 3. Canonical 3D Character Anchor Sheet (gemini-3-pro-image)
    notify('generating_anchor_sheet', 40);
    const canonicalSheet = await this.geminiEngine.generateCanonicalCharacterSheet(character, options.geminiKey);
    character.canonicalSheetUrl = canonicalSheet.sheetImageUrl;

    // 4. Spatial Continuity Supervisor (gemini-4-argon)
    notify('auditing_continuity', 50);
    await this.geminiEngine.auditSpatialContinuity(beats, character, options.geminiKey);

    // 5. Voice Acting & Word Alignment (ai33.pro)
    notify('synthesizing_voice', 60);
    const fullScript = beats.map((b) => b.text).join(' ');
    const narration = await this.voiceEngine.synthesizeNarration(fullScript, {
      voiceId: options.voiceId,
      overrideKey: options.ai33Key,
    });

    // 6. Direct & Generate Consistent 3D CGI Scene Shots (gemini-3-pro-image)
    notify('directing_and_rendering_shots', 75);
    const shots: RenderedShot[] = [];
    for (const beat of beats) {
      const shot = await this.geminiEngine.generateConditionedShotKeyframe(
        beat,
        character,
        canonicalSheet,
        aspectRatio,
        options.geminiKey
      );
      shots.push(shot);
    }

    // 7. Cinematic Adaptive Soundtrack (lyria-3.5)
    notify('composing_music', 85);
    const soundtrack = await this.geminiEngine.composeAdaptiveSoundtrack({
      mood: 'Intense cinematic orchestral blizzard score with driving war drums',
      durationSeconds: narration.durationSeconds,
      timestamps: narration.timestamps,
      overrideKey: options.geminiKey,
    });

    // 8. Multimodal Visual QA Audit (gemini-omni-1.2-flash)
    notify('running_visual_qa', 95);
    const qaReport = await this.geminiEngine.auditVisualQA({
      canonicalSheet,
      shots,
      beats,
      overrideKey: options.geminiKey,
    });

    notify('completed', 100);

    return {
      id: projectId,
      title: screenplay.title,
      topic: options.topic,
      aspectRatio,
      targetDurationSeconds: options.targetDurationSeconds || 60,
      researchNotes: research.summary,
      characters: [character],
      canonicalSheets: [canonicalSheet],
      beats,
      narration,
      shots,
      soundtrack,
      qaReport,
      status: 'completed',
      createdAt: now,
      updatedAt: now,
    };
  }
}
