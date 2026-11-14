import React, { useEffect } from 'react';
import {
  Sparkles,
  Clapperboard,
  Film,
  Mic,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Settings,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { usePureStudioStore, GENERATION_STAGES } from '../../stores/usePureStudioStore';
import { Pure3DTheater } from './Pure3DTheater';
import { CanonicalSheetModal } from './CanonicalSheetModal';
import { SettingsDialog } from './SettingsDialog';
import { StepByStepPipelineSection } from './StepByStepPipelineSection';

const VIRAL_PRESETS = [
  "Napoleon's disastrous winter retreat from Moscow 1812",
  "Voyager 1 crossing the boundary into Interstellar Space",
  "The Mariana Trench: discovery of the 800-meter Leviathan",
  "Cyberpunk Neo-Kyoto: The Last Cyber-Samurai of 2099",
];

export const Pure3DStudioView: React.FC = () => {
  const {
    topic,
    aspectRatio,
    targetDurationSeconds,
    selectedVoice,
    modelSuite,
    isGenerating,
    currentStage,
    progressPercent,
    errorMessage,
    isRetryableError,
    project,
    isSettingsOpen,
    isSheetModalOpen,
    setTopic,
    setAspectRatio,
    setSelectedVoice,
    setIsSettingsOpen,
    setIsSheetModalOpen,
    generateProject,
    retryGeneration,
    loadSavedPreferences,
  } = usePureStudioStore();

  useEffect(() => {
    loadSavedPreferences();
  }, [loadSavedPreferences]);

  const activeStageIndex = GENERATION_STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
            <Clapperboard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                Pure AI 3D Studio
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/10 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                Gemini Plus & ai33.pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Autonomous 3D CGI Animation • 100% Character Consistency
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-amber-400/50 transition cursor-pointer"
            title="Configure Gemini Models"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Suite:</span>
            <span className="font-mono text-slate-200">
              {modelSuite.imageModel} • {modelSuite.screenwriterModel} • {modelSuite.musicModel}
            </span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">API Keys</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Creation Console Card */}
        <section className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-6 relative z-10">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <Sparkles className="w-7 h-7 text-amber-400" />
                Create High-End 3D Animated Video
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Enter any historical, sci-fi, or dramatic topic. Gemini orchestrates research, screenwriting, consistent 3D character turnaround sheets, neural voice, and 3D CGI keyframe rendering.
              </p>
            </div>

            {/* Prompt Input Field */}
            <div className="relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Describe your story topic (e.g. Napoleon's retreat from Moscow 1812)..."
                disabled={isGenerating}
                className="w-full px-5 py-4 bg-slate-950 border border-slate-700/80 rounded-2xl text-base text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition shadow-inner font-medium disabled:opacity-50"
              />
            </div>

            {/* Viral Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Viral Presets:
              </span>
              {VIRAL_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => setTopic(preset)}
                  disabled={isGenerating}
                  className="text-xs bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 px-3 py-1.5 rounded-full text-slate-300 hover:text-white transition"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Controls Bar: Format, Voice, Duration, CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-amber-400" /> Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('9:16')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      aspectRatio === '9:16'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    9:16 Shorts
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      aspectRatio === '16:9'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    16:9 Cinema
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-amber-400" /> ai33.pro Voice
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="narrator-cinematic-deep-01">Deep Epic Cinematic (David)</option>
                  <option value="narrator-storyteller-marcus">High-Energy Viral (Marcus)</option>
                  <option value="narrator-whisper-eleanor">Dark Mystery Whisper (Eleanor)</option>
                </select>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Target Duration
                </label>
                <div className="text-sm font-bold text-white px-3 py-1.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span>~{targetDurationSeconds}s</span>
                  <span className="text-[11px] text-amber-400 font-mono">8 Beats</span>
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={generateProject}
                  disabled={isGenerating || !topic.trim()}
                  className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Studio Orchestrating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 fill-current" />
                      <span>Generate 3D Video</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-rose-300">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
                {isRetryableError && (
                  <button
                    type="button"
                    onClick={retryGeneration}
                    className="self-start sm:self-auto px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-xl text-xs font-bold text-rose-200 transition flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Pipeline</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Live Autonomous Pipeline Progress Visualizer */}
        {isGenerating && (
          <section className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                  Autonomous Studio Pipeline In Progress
                </h3>
                <p className="text-xs text-slate-400">
                  Google Gemini models communicating sequentially to build your 3D CGI animation
                </p>
              </div>
              <div className="text-xl font-black text-amber-400 font-mono">
                {progressPercent}%
              </div>
            </div>

            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {GENERATION_STAGES.map((st, idx) => {
                const isCurrent = st.id === currentStage;
                const isPassed = activeStageIndex > idx || currentStage === 'completed';

                return (
                  <div
                    key={st.id}
                    className={`p-3.5 rounded-2xl border transition ${
                      isCurrent
                        ? 'bg-amber-500/15 border-amber-500/60 shadow-lg'
                        : isPassed
                        ? 'bg-slate-950/60 border-emerald-500/30'
                        : 'bg-slate-950/30 border-slate-800/60 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-slate-400">Step {idx + 1}</span>
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isCurrent ? (
                        <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-white">{st.name}</div>
                    <div className="text-[10px] text-amber-400/90 font-mono mt-0.5 truncate">
                      {st.model}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Step-by-Step Generate & Result Pipeline Cards */}
        <StepByStepPipelineSection
          onOpenSheetModal={() => setIsSheetModalOpen(true)}
        />

        {/* Studio Theater Screen */}
        {project && project.shots && project.shots.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-amber-400" />
                  {project.title}
                </h2>
                <p className="text-xs text-slate-400">
                  {project.aspectRatio === '9:16' ? '9:16 YouTube Shorts (1080x1920)' : '16:9 Cinema Landscape (1920x1080)'} • 100% Character Consistency Locked
                </p>
              </div>

              {project.qaReport && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>QA Consistency: {project.qaReport.characterConsistencyScore}%</span>
                </div>
              )}
            </div>

            <Pure3DTheater
              project={project}
              onOpenSheetModal={() => setIsSheetModalOpen(true)}
            />

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Screenplay & Multimodal 3D CGI Scene Breakdown ({project.beats.length} Beats)
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Directed by gemini-3.7-flash • Rendered by gemini-3-pro-image
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {project.beats.map((beat) => {
                  const shot = project.shots?.find((s) => s.beatNumber === beat.beatNumber);

                  return (
                    <div
                      key={beat.beatNumber}
                      className="bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden flex flex-col group hover:border-amber-400/50 transition"
                    >
                      <div className="relative aspect-video bg-black overflow-hidden">
                        {shot?.imageUrl ? (
                          <img
                            src={shot.imageUrl}
                            alt={`Shot ${beat.beatNumber}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">
                            Rendering...
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          <span className="bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-amber-400">
                            Beat {beat.beatNumber} • {beat.type}
                          </span>
                          {shot?.provenance === 'ai_generated' ? (
                            <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                              AI 3D
                            </span>
                          ) : shot?.provenance === 'preview_placeholder' ? (
                            <span className="bg-amber-950/80 border border-amber-500/40 text-amber-300 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                              Preview
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                        <p className="text-xs text-slate-200 font-medium line-clamp-3">
                          "{beat.text}"
                        </p>
                        <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                          <span>{beat.cameraTrajectory.shotType}</span>
                          <span className="text-amber-400">{beat.cameraTrajectory.motion}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <CanonicalSheetModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        sheet={project?.canonicalSheets[0] || null}
        character={project?.characters[0] || null}
      />

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

