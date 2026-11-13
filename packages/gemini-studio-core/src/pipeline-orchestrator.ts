/**
 * Pure Gemini 3D Studio Autonomous Pipeline Orchestrator (Phase 0 Repaired)
 * Orchestrates deep research, screenwriting, turnaround sheets, voice, shots, music, and QA.
 * - Model configuration directly controls execution.
 * - Failed provider stages halt the pipeline honestly with status: 'failed' and detailed error diagnostics.
 * - Zero fabricated fallback assets.
 */

import {
  Pure3DStudioProject,
  VideoFormat,
  RenderedShot,
  GeminiModelSuiteConfig,
  DEFAULT_MODEL_SUITE,
  ProjectErrorDetails,
} from '@studio/types';
import { Gemini3DStudioEngine, GeminiProviderError } from './gemini-studio-engine';
import { AI33VoiceEngine, VoiceProviderError } from './ai33-voice-engine';

export interface PipelineGenerateOptions {
  topic: string;
  aspectRatio?: VideoFormat;
  targetDurationSeconds?: number;
  voiceId?: string;
  geminiKey?: string;
  ai33Key?: string;
  modelSuite?: Partial<GeminiModelSuiteConfig>;
  onProgress?: (stage: string, percent: number) => void;
}

export class Pure3DStudioPipelineOrchestrator {
  private readonly geminiEngine: Gemini3DStudioEngine;
  private readonly voiceEngine: AI33VoiceEngine;

  constructor(geminiKey?: string, voiceKey?: string) {
    this.geminiEngine = new Gemini3DStudioEngine(geminiKey);
    this.voiceEngine = new AI33VoiceEngine(voiceKey);
  }

  async runPipeline(options: PipelineGenerateOptions): Promise<Pure3DStudioProject> {
    const notify = (stage: string, pct: number) => {
      if (options.onProgress) options.onProgress(stage, pct);
    };

    const aspectRatio = options.aspectRatio || '9:16';
    const projectId = `proj_3d_${Date.now()}`;
    const now = new Date().toISOString();
    const suite: GeminiModelSuiteConfig = { ...DEFAULT_MODEL_SUITE, ...options.modelSuite };

    const project: Pure3DStudioProject = {
      id: projectId,
      title: `${options.topic} — 3D Cinematic`,
      topic: options.topic,
      aspectRatio,
      targetDurationSeconds: options.targetDurationSeconds || 60,
      characters: [],
      canonicalSheets: [],
      beats: [],
      status: 'idle',
      createdAt: now,
      updatedAt: now,
    };

    try {
      // 1. Deep Research
      notify('researching', 10);
      project.status = 'researching';
      const research = await this.geminiEngine.researchTopic(
        options.topic,
        options.geminiKey,
        suite.researcherModel
      );
      project.researchNotes = research.summary;

      // 2. Screenwriting & Character DNA
      notify('scripting', 25);
      project.status = 'scripting';
      const screenplay = await this.geminiEngine.generateScreenplayAndDNA({
        topic: options.topic,
        research,
        aspectRatio,
        overrideKey: options.geminiKey,
        modelId: suite.screenwriterModel,
      });

      project.title = screenplay.title;
      project.characters = [screenplay.character];
      project.beats = screenplay.beats;
      const character = screenplay.character;
      const beats = screenplay.beats;

      // 3. Master Character Turnaround Sheet
      notify('generating_anchor_sheet', 40);
      project.status = 'generating_anchor_sheet';
      const canonicalSheet = await this.geminiEngine.generateCanonicalCharacterSheet(
        character,
        options.geminiKey,
        suite.imageModel
      );
      character.canonicalSheetUrl = canonicalSheet.sheetImageUrl;
      project.canonicalSheets = [canonicalSheet];

      // 4. Spatial Continuity Supervision
      notify('auditing_continuity', 50);
      project.status = 'auditing_continuity';
      await this.geminiEngine.auditSpatialContinuity(
        beats,
        character,
        options.geminiKey,
        suite.continuityModel
      );

      // 5. Voice Synthesis with Word Timestamps
      notify('synthesizing_voice', 60);
      project.status = 'synthesizing_voice';
      const fullScript = beats.map((b) => b.text).join(' ');
      const narration = await this.voiceEngine.synthesizeNarration(fullScript, {
        voiceId: options.voiceId,
        overrideKey: options.ai33Key,
      });
      project.narration = narration;

      // 6. Direct & Generate Consistent 3D CGI Scene Keyframes
      notify('directing_and_rendering_shots', 75);
      project.status = 'directing_and_rendering_shots';
      const shots: RenderedShot[] = [];
      for (const beat of beats) {
        const shot = await this.geminiEngine.generateConditionedShotKeyframe(
          beat,
          character,
          canonicalSheet,
          aspectRatio,
          options.geminiKey,
          suite.imageModel
        );
        shots.push(shot);
      }
      project.shots = shots;

      // 7. Adaptive Soundtrack
      notify('composing_music', 85);
      project.status = 'composing_music';
      const soundtrack = await this.geminiEngine.composeAdaptiveSoundtrack({
        mood: 'Intense cinematic orchestral score with driving rhythm',
        durationSeconds: narration.durationSeconds,
        timestamps: narration.timestamps,
        overrideKey: options.geminiKey,
        modelId: suite.musicModel,
      });
      project.soundtrack = soundtrack;

      // 8. Visual QA Inspection
      notify('running_visual_qa', 95);
      project.status = 'running_visual_qa';
      const qaReport = await this.geminiEngine.auditVisualQA({
        canonicalSheet,
        shots,
        beats,
        overrideKey: options.geminiKey,
        modelId: suite.qaModel,
      });
      project.qaReport = qaReport;

      // Pipeline completed honestly
      notify('completed', 100);
      project.status = 'completed';
      project.updatedAt = new Date().toISOString();

      return project;
    } catch (err: any) {
      const isGeminiErr = err instanceof GeminiProviderError;
      const isVoiceErr = err instanceof VoiceProviderError;

      const errorDetails: ProjectErrorDetails = {
        stage: project.status,
        provider: isGeminiErr ? 'gemini' : isVoiceErr ? 'ai33' : 'system',
        errorCode: err.errorCode || 'STAGE_FAILED',
        message: err.message || 'Stage execution failed',
        isRetryable: Boolean(err.isRetryable),
        timestamp: new Date().toISOString(),
        retryAfterSeconds: err.retryAfterSeconds,
      };

      project.status = 'failed';
      project.lastError = errorDetails;
      project.errorMessage = `${errorDetails.stage.toUpperCase()} failed: ${errorDetails.message}`;
      project.updatedAt = new Date().toISOString();

      throw err;
    }
  }
}
