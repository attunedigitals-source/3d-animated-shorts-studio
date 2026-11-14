import React from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Eye,
  Volume2,
  Music,
  ShieldCheck,
  Layers,
  UserCheck,
  Compass,
  FileText,
} from 'lucide-react';
import { usePureStudioStore, GENERATION_STAGES } from '../../stores/usePureStudioStore';

interface StepByStepPipelineSectionProps {
  onOpenSheetModal: () => void;
}

export const StepByStepPipelineSection: React.FC<StepByStepPipelineSectionProps> = ({
  onOpenSheetModal,
}) => {
  const {
    project,
    modelSuite,
    stepStatuses,
    stepErrors,
    isGenerating,
    currentStage,
    generateStep,
  } = usePureStudioStore();

  const getActiveModelForStep = (stepId: string): string => {
    switch (stepId) {
      case 'researching':
        return `${modelSuite.researcherModel} (8-Model Auto-Switch Pool)`;
      case 'scripting':
        return modelSuite.screenwriterModel;
      case 'generating_anchor_sheet':
        return modelSuite.imageModel;
      case 'auditing_continuity':
        return modelSuite.continuityModel;
      case 'synthesizing_voice':
        return 'ai33.pro Neural TTS';
      case 'directing_and_rendering_shots':
        return `${modelSuite.directorModel} + ${modelSuite.imageModel}`;
      case 'composing_music':
        return modelSuite.musicModel;
      case 'running_visual_qa':
        return modelSuite.qaModel;
      default:
        return '';
    }
  };

  const hasResultForStep = (stepId: string): boolean => {
    if (!project) return false;
    switch (stepId) {
      case 'researching':
        return Boolean(project.research || project.researchNotes);
      case 'scripting':
        return Boolean(project.characters?.length && project.beats?.length);
      case 'generating_anchor_sheet':
        return Boolean(project.canonicalSheets?.length);
      case 'auditing_continuity':
        return Boolean(project.continuityAudit);
      case 'synthesizing_voice':
        return Boolean(project.narration);
      case 'directing_and_rendering_shots':
        return Boolean(project.shots?.length);
      case 'composing_music':
        return Boolean(project.soundtrack);
      case 'running_visual_qa':
        return Boolean(project.qaReport);
      default:
        return false;
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-amber-400" />
            Step-by-Step Production Pipeline (Generate & Result)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Each production stage features its own dedicated Generate control and live Result inspection panel.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {GENERATION_STAGES.map((stage, idx) => {
          const status =
            stepStatuses[stage.id] ||
            (isGenerating && currentStage === stage.id
              ? 'generating'
              : hasResultForStep(stage.id)
              ? 'completed'
              : 'idle');
          const stepError = stepErrors[stage.id];
          const isStepRunning = status === 'generating';
          const stepDone = status === 'completed' || hasResultForStep(stage.id);
          const activeModelLabel = getActiveModelForStep(stage.id);

          return (
            <div
              key={stage.id}
              className={`rounded-3xl border transition-all overflow-hidden bg-slate-900/90 shadow-xl ${
                isStepRunning
                  ? 'border-amber-400/70 shadow-amber-500/10'
                  : status === 'failed'
                  ? 'border-rose-500/50'
                  : stepDone
                  ? 'border-emerald-500/40'
                  : 'border-slate-800'
              }`}
            >
              {/* ============================================================ */}
              {/* 1. GENERATE SECTION                                          */}
              {/* ============================================================ */}
              <div className="p-5 sm:p-6 bg-slate-950/70 border-b border-slate-800/80 flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Step {idx + 1} • Generate Section
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-900 text-slate-300 border border-slate-700">
                        <Cpu className="w-3 h-3 text-amber-400" />
                        {activeModelLabel}
                      </span>
                      {stepDone && !isStepRunning && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Completed
                        </span>
                      )}
                      {isStepRunning && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <span className="w-2.5 h-2.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                          Generating...
                        </span>
                      )}
                      {status === 'failed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Failed
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-white">
                      {stage.name}
                    </h3>
                    <p className="text-xs text-slate-400">{stage.description}</p>
                  </div>

                  {/* Step Action Button */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => generateStep(stage.id)}
                      disabled={isStepRunning || isGenerating}
                      className={`px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                        stepDone
                          ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30'
                          : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/20'
                      }`}
                    >
                      {isStepRunning ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>Generating Step {idx + 1}...</span>
                        </>
                      ) : stepDone ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Regenerate Step {idx + 1}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Generate Step {idx + 1}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {stepError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-rose-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{stepError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => generateStep(stage.id)}
                      className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg font-bold text-rose-100 shrink-0"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>

              {/* ============================================================ */}
              {/* 2. RESULT SECTION                                            */}
              {/* ============================================================ */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Step {idx + 1} • Result Section
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {hasResultForStep(stage.id) ? 'Output Ready' : 'Awaiting Generation'}
                  </span>
                </div>

                {!hasResultForStep(stage.id) ? (
                  <div className="py-8 px-4 text-center rounded-2xl bg-slate-950/50 border border-dashed border-slate-800 text-xs text-slate-400">
                    {isStepRunning ? (
                      <div className="flex flex-col items-center gap-2 text-amber-300">
                        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        <span>Executing {stage.name} via {activeModelLabel}...</span>
                      </div>
                    ) : (
                      <span>
                        No result generated yet for <strong>{stage.name}</strong>. Click{' '}
                        <strong className="text-amber-400">Generate Step {idx + 1}</strong> above or run the full pipeline.
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* STEP 1 RESULT: DEEP RESEARCH */}
                    {stage.id === 'researching' && (project?.research || project?.researchNotes) && (
                      <div className="space-y-4">
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" /> Executive Dramatic Synopsis
                            </span>
                            {project?.research?.modelUsed && (
                              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                                Fulfilled by: {project.research.modelUsed}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed">
                            {project?.research?.summary || project?.researchNotes}
                          </p>
                          {project?.research?.pacingNotes && (
                            <p className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-900">
                              Pacing Directive: {project.research.pacingNotes}
                            </p>
                          )}
                        </div>

                        {project?.research && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                              <div className="text-xs font-bold text-amber-400">
                                Viral Opening Hooks ({project.research.viralHooks.length})
                              </div>
                              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                                {project.research.viralHooks.map((hook, i) => (
                                  <li key={i} className="leading-snug">{hook}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                              <div className="text-xs font-bold text-sky-400">
                                Obscure Visual Facts ({project.research.obscureFacts.length})
                              </div>
                              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                                {project.research.obscureFacts.map((fact, i) => (
                                  <li key={i} className="leading-snug">{fact}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                              <div className="text-xs font-bold text-emerald-400">
                                Retention Triggers ({project.research.retentionAngles.length})
                              </div>
                              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                                {project.research.retentionAngles.map((angle, i) => (
                                  <li key={i} className="leading-snug">{angle}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* STEP 2 RESULT: SCREENPLAY & VISUAL DNA */}
                    {stage.id === 'scripting' && project?.characters?.[0] && (
                      <div className="space-y-4">
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-mono uppercase text-amber-400 block">
                                Locked Character Visual Identity Matrix
                              </span>
                              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-emerald-400" />
                                {project.characters[0].name} — {project.characters[0].role}
                              </h4>
                            </div>
                            <span className="text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                              {project.characters[0].visualIdentityMatrix.promptTokens}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                              <span className="text-[10px] text-slate-400 block">Facial Geometry</span>
                              <span className="text-slate-200 font-medium">
                                {project.characters[0].visualIdentityMatrix.facialGeometry}
                              </span>
                            </div>
                            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                              <span className="text-[10px] text-slate-400 block">Skin & Subsurface</span>
                              <span className="text-slate-200 font-medium">
                                {project.characters[0].visualIdentityMatrix.skinTone}
                              </span>
                            </div>
                            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                              <span className="text-[10px] text-slate-400 block">Hair Groom</span>
                              <span className="text-slate-200 font-medium">
                                {project.characters[0].visualIdentityMatrix.hairTexture}
                              </span>
                            </div>
                            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                              <span className="text-[10px] text-slate-400 block">Wardrobe</span>
                              <span className="text-slate-200 font-medium">
                                {project.characters[0].visualIdentityMatrix.wardrobe}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {project.beats.map((b) => (
                            <div
                              key={b.beatNumber}
                              className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-2"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                  <span className="text-amber-400">
                                    Beat {b.beatNumber} • {b.type}
                                  </span>
                                  <span className="text-slate-400 font-mono">{b.targetDurationSeconds}s</span>
                                </div>
                                <p className="text-xs font-semibold text-white">"{b.text}"</p>
                                <p className="text-[11px] text-slate-400 line-clamp-2">
                                  {b.visualSceneDescription}
                                </p>
                              </div>
                              <div className="pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                                <span>{b.cameraTrajectory.shotType}</span>
                                <span className="text-amber-300">{b.cameraTrajectory.motion}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STEP 3 RESULT: MASTER CHARACTER ANCHOR SHEET */}
                    {stage.id === 'generating_anchor_sheet' && project?.canonicalSheets?.[0] && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs text-slate-300">
                            Character Sheet for <strong>{project.canonicalSheets[0].characterName}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={onOpenSheetModal}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect Full Turnaround Modal</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { label: 'Front Orthogonal', url: project.canonicalSheets[0].frontPoseUrl || project.canonicalSheets[0].sheetImageUrl },
                            { label: '3/4 Perspective', url: project.canonicalSheets[0].threeQuarterPoseUrl || project.canonicalSheets[0].sheetImageUrl },
                            { label: 'Side Profile', url: project.canonicalSheets[0].profilePoseUrl || project.canonicalSheets[0].sheetImageUrl },
                            { label: 'Dynamic Action Pose', url: project.canonicalSheets[0].actionPoseUrl || project.canonicalSheets[0].sheetImageUrl },
                          ].map((view, i) => (
                            <div
                              key={i}
                              className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden"
                            >
                              <div className="aspect-square bg-black relative">
                                <img
                                  src={view.url}
                                  alt={view.label}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="p-2 text-center text-[11px] font-bold text-slate-300">
                                {view.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STEP 4 RESULT: SPATIAL & CONTINUITY SUPERVISION */}
                    {stage.id === 'auditing_continuity' && project?.continuityAudit && (
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-2">
                            <Compass className="w-4 h-4 text-amber-400" />
                            Spatial & Lighting Continuity Report
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              project.continuityAudit.isContinuous
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {project.continuityAudit.isContinuous ? '100% Continuous' : 'Adjusted'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {project.continuityAudit.continuityAuditNotes}
                        </p>
                      </div>
                    )}

                    {/* STEP 5 RESULT: NEURAL VOICE & WORD TIMESTAMPS */}
                    {stage.id === 'synthesizing_voice' && project?.narration && (
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-white">
                            <Volume2 className="w-4 h-4 text-amber-400" />
                            <span>Voice Model: {project.narration.voiceModel}</span>
                            <span className="text-slate-400 font-mono">
                              ({project.narration.durationSeconds.toFixed(1)}s)
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                            {project.narration.isEstimatedAlignment
                              ? 'Estimated Word Alignment'
                              : 'Provider Millisecond Alignment'}
                          </span>
                        </div>

                        {project.narration.audioUrl && (
                          <audio
                            controls
                            src={project.narration.audioUrl}
                            className="w-full h-10 rounded-lg"
                          />
                        )}

                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">
                            Word Timestamps ({project.narration.timestamps.length} words)
                          </span>
                          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-900/70 rounded-xl border border-slate-800">
                            {project.narration.timestamps.map((ts, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-200 font-mono"
                              >
                                {ts.word}{' '}
                                <span className="text-amber-400/80 text-[9px]">
                                  {ts.startMs}ms
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 6 RESULT: MULTIMODAL 3D CGI SCENE KEYFRAMES */}
                    {stage.id === 'directing_and_rendering_shots' && project?.shots && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {project.shots.map((shot) => {
                          const beat = project.beats.find((b) => b.beatNumber === shot.beatNumber);
                          return (
                            <div
                              key={shot.shotId}
                              className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col"
                            >
                              <div className="relative aspect-video bg-black">
                                <img
                                  src={shot.imageUrl}
                                  alt={`Shot ${shot.beatNumber}`}
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-amber-400">
                                  Beat {shot.beatNumber}
                                </span>
                              </div>
                              <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                                <p className="text-xs text-slate-200 font-medium line-clamp-2">
                                  "{beat?.text || shot.promptUsed}"
                                </p>
                                <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-900">
                                  <span>{shot.cameraTrajectory.shotType}</span>
                                  <span className="text-amber-400">{shot.cameraTrajectory.motion}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* STEP 7 RESULT: ADAPTIVE CINEMATIC SCORE */}
                    {stage.id === 'composing_music' && project?.soundtrack && (
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-white">
                            <Music className="w-4 h-4 text-amber-400" />
                            <span>{project.soundtrack.genre}</span>
                            <span className="text-slate-400 font-mono">
                              • {project.soundtrack.tempo} BPM
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            Provenance: {project.soundtrack.provenance}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          Mood Profile: <strong>{project.soundtrack.mood}</strong> • Speech Ducking Markers:{' '}
                          <strong>{project.soundtrack.duckingMarkers.length} segments (-8dB)</strong>
                        </p>
                        {project.soundtrack.audioUrl && (
                          <audio
                            controls
                            src={project.soundtrack.audioUrl}
                            className="w-full h-10 rounded-lg"
                          />
                        )}
                      </div>
                    )}

                    {/* STEP 8 RESULT: MULTIMODAL VISUAL QA INSPECTOR */}
                    {stage.id === 'running_visual_qa' && project?.qaReport && (
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm font-extrabold text-white">
                              QA Status: {project.qaReport.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-bold">
                            <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              Character Consistency: {project.qaReport.characterConsistencyScore}%
                            </span>
                            <span className="px-3 py-1 rounded-xl bg-sky-500/15 text-sky-300 border border-sky-500/30">
                              Visual Fidelity: {project.qaReport.visualFidelityScore}%
                            </span>
                          </div>
                        </div>

                        {project.qaReport.categories && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                            {Object.entries(project.qaReport.categories).map(([key, cat]) =>
                              cat ? (
                                <div
                                  key={key}
                                  className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1"
                                >
                                  <div className="flex items-center justify-between font-bold text-slate-200 capitalize">
                                    <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                                    <span className="text-emerald-400 font-mono">{cat.score}%</span>
                                  </div>
                                  <p className="text-[11px] text-slate-400">{cat.notes}</p>
                                </div>
                              ) : null
                            )}
                          </div>
                        )}

                        <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                          {project.qaReport.feedback.map((fb, i) => (
                            <li key={i}>{fb}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
