import React from 'react';
import { useStudioStore } from '../../stores/useStudioStore';
import {
  FileText,
  Sparkles,
  Save,
  ArrowRight,
  Clock,
  Layers,
  Plus,
  Trash2,
  MessageSquare,
  Activity,
} from 'lucide-react';
import { ScriptScene, ScriptDialogueLine } from '@studio/types';

export const ScriptEditorView: React.FC = () => {
  const {
    currentProject,
    storyDraft,
    scriptDraft,
    generateScript,
    isGeneratingScript,
    updateScriptDraft,
    saveScriptDraft,
    isSaving,
    setActiveView,
  } = useStudioStore();

  if (!currentProject) {
    return (
      <div className="p-12 text-center text-slate-500">
        Please select or create a project first.
      </div>
    );
  }

  const handleAddDialogueLine = (sceneIdx: number) => {
    if (!scriptDraft) return;
    const scenes = [...scriptDraft.scenes];
    const targetScene = scenes[sceneIdx];
    if (!targetScene) return;

    const newLine: ScriptDialogueLine = {
      characterName: 'Character',
      line: 'New dialogue line...',
      deliveryInstruction: 'neutral',
    };

    targetScene.dialogue = [...targetScene.dialogue, newLine];
    updateScriptDraft({ ...scriptDraft, scenes });
  };

  const handleRemoveDialogueLine = (sceneIdx: number, lineIdx: number) => {
    if (!scriptDraft) return;
    const scenes = [...scriptDraft.scenes];
    const targetScene = scenes[sceneIdx];
    if (!targetScene) return;

    targetScene.dialogue = targetScene.dialogue.filter((_, i) => i !== lineIdx);
    updateScriptDraft({ ...scriptDraft, scenes });
  };

  const handleUpdateScene = (sceneIdx: number, patch: Partial<ScriptScene>) => {
    if (!scriptDraft) return;
    const scenes = [...scriptDraft.scenes];
    const current = scenes[sceneIdx];
    if (!current) return;

    scenes[sceneIdx] = { ...current, ...patch };

    // Recalculate word count and duration totals
    const totalWordCount = scenes.reduce(
      (sum, s) =>
        sum +
        (s.narration.split(/\s+/).filter(Boolean).length || 0) +
        s.dialogue.reduce((dSum, d) => dSum + (d.line.split(/\s+/).filter(Boolean).length || 0), 0),
      0,
    );

    const totalDuration = scenes.reduce((sum, s) => sum + s.approximateDurationSeconds, 0);

    updateScriptDraft({
      ...scriptDraft,
      scenes,
      totalWordCount,
      totalEstimatedDurationSeconds: totalDuration,
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-400" />
            Script Editor
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Narration-ready scene scripts with character dialogue, delivery cues, and timing.
          </p>
        </div>

        {scriptDraft && (
          <div className="flex items-center gap-3">
            <button
              onClick={saveScriptDraft}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition disabled:opacity-50"
            >
              <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
              {isSaving ? 'Saving...' : 'Save Script'}
            </button>
            <button
              onClick={() => setActiveView('scenes')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md transition"
            >
              <span>Scene Breakdown</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Story Context Banner */}
      {storyDraft && (
        <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              Source Story
            </div>
            <div className="text-base font-bold text-white">{storyDraft.title}</div>
            <p className="text-xs text-slate-400 max-w-2xl line-clamp-1">{storyDraft.logline}</p>
          </div>

          <button
            onClick={generateScript}
            disabled={isGeneratingScript}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 whitespace-nowrap"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGeneratingScript ? 'animate-spin' : ''}`} />
            {isGeneratingScript ? 'Generating Script...' : scriptDraft ? 'Regenerate Script' : 'Generate Script'}
          </button>
        </div>
      )}

      {/* Script Metrics Bar if draft exists */}
      {scriptDraft && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-6 text-slate-300">
            <span className="flex items-center gap-1.5 font-semibold">
              <Clock className="w-4 h-4 text-indigo-400" />
              Est. Duration: {scriptDraft.totalEstimatedDurationSeconds}s / {scriptDraft.targetDurationSeconds}s target
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <Layers className="w-4 h-4 text-emerald-400" />
              Scenes: {scriptDraft.scenes.length}
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              Total Words: {scriptDraft.totalWordCount} (~150 WPM pacing)
            </span>
          </div>

          <span className="text-[11px] text-slate-500">Auto-calculated word pacing</span>
        </div>
      )}

      {/* Scene Script Cards */}
      {!scriptDraft ? (
        <div className="p-16 text-center rounded-2xl border border-dashed border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-900 mx-auto flex items-center justify-center text-slate-600">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-300">No Script Generated Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click "Generate Script" above to convert your approved story into a narration-ready animated script.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {scriptDraft.scenes.map((scene, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5 shadow-sm hover:border-slate-700 transition"
            >
              {/* Scene Heading & Duration Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                    {scene.sceneNumber}
                  </span>
                  <input
                    type="text"
                    value={scene.sceneHeading}
                    onChange={(e) => handleUpdateScene(idx, { sceneHeading: e.target.value })}
                    className="bg-transparent text-sm font-bold text-white border-b border-transparent hover:border-slate-700 focus:border-indigo-500 outline-none uppercase tracking-wide py-0.5"
                  />
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span>Duration:</span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={scene.approximateDurationSeconds}
                      onChange={(e) =>
                        handleUpdateScene(idx, {
                          approximateDurationSeconds: Number(e.target.value) || 1,
                        })
                      }
                      className="w-14 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-indigo-500"
                    />
                    <span>sec</span>
                  </div>
                </div>
              </div>

              {/* Action Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  3D Animation Action Direction
                </label>
                <textarea
                  rows={2}
                  value={scene.actionDescriptions}
                  onChange={(e) => handleUpdateScene(idx, { actionDescriptions: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              {/* Narration */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Voiceover Narration (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Voiceover narrative text..."
                  value={scene.narration}
                  onChange={(e) => handleUpdateScene(idx, { narration: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Character Dialogue Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    Spoken Dialogue Lines ({scene.dialogue.length})
                  </label>
                  <button
                    onClick={() => handleAddDialogueLine(idx)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    <Plus className="w-3 h-3" />
                    Add Line
                  </button>
                </div>

                {scene.dialogue.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-[11px] text-slate-500 italic">
                    No character dialogue in this scene. Action-only or voiceover.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {scene.dialogue.map((diag, dIdx) => (
                      <div
                        key={dIdx}
                        className="flex items-start gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800/80"
                      >
                        <div className="w-36 shrink-0 space-y-1">
                          <input
                            type="text"
                            placeholder="Character Name"
                            value={diag.characterName}
                            onChange={(e) => {
                              const newDiag = [...scene.dialogue];
                              newDiag[dIdx]!.characterName = e.target.value;
                              handleUpdateScene(idx, { dialogue: newDiag });
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            placeholder="e.g. whispering"
                            value={diag.deliveryInstruction || ''}
                            onChange={(e) => {
                              const newDiag = [...scene.dialogue];
                              newDiag[dIdx]!.deliveryInstruction = e.target.value;
                              handleUpdateScene(idx, { dialogue: newDiag });
                            }}
                            className="w-full bg-transparent text-[10px] text-slate-500 focus:outline-none italic px-1"
                          />
                        </div>

                        <textarea
                          rows={2}
                          value={diag.line}
                          onChange={(e) => {
                            const newDiag = [...scene.dialogue];
                            newDiag[dIdx]!.line = e.target.value;
                            handleUpdateScene(idx, { dialogue: newDiag });
                          }}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                        />

                        <button
                          onClick={() => handleRemoveDialogueLine(idx, dIdx)}
                          className="p-1.5 text-slate-600 hover:text-rose-400 transition"
                          title="Remove Dialogue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Emotional Direction */}
              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-semibold text-slate-500">Emotional Tone Direction</label>
                <input
                  type="text"
                  value={scene.emotionalDirection}
                  onChange={(e) => handleUpdateScene(idx, { emotionalDirection: e.target.value })}
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          ))}

          {/* Bottom Save & Proceed */}
          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={saveScriptDraft}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Script Revision'}
            </button>

            <button
              onClick={() => setActiveView('scenes')}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
            >
              <span>Proceed to Scene Breakdown</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
