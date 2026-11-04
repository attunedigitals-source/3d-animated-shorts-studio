import React from 'react';
import { useStudioStore } from '../../stores/useStudioStore';
import {
  Clapperboard,
  Sparkles,
  Save,
  Clock,
  Camera,
  Box,
  Layers,
  Plus,
  Trash2,
  MapPin,
  Smile,
  ShieldAlert,
} from 'lucide-react';
import { StructuredScene } from '@studio/types';

export const SceneBreakdownView: React.FC = () => {
  const {
    currentProject,
    scriptDraft,
    scenesDraft,
    breakdownScenes,
    isBreakingDownScenes,
    updateScene,
    addScene,
    deleteScene,
    saveScenesDraft,
    isSaving,
  } = useStudioStore();

  if (!currentProject) {
    return <div className="p-12 text-center text-slate-500">Please select a project first.</div>;
  }

  const totalDuration = scenesDraft.reduce((sum, s) => sum + s.approximateDurationSeconds, 0);

  const handleUpdate = (sceneId: string, patch: Partial<StructuredScene>) => {
    updateScene(sceneId, patch);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Clapperboard className="w-6 h-6 text-indigo-400" />
            3D Scene Breakdown & Staging
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Structured scene definitions for 3D environments, camera staging, props, and actor choreography.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={addScene}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Scene
          </button>
          <button
            onClick={saveScenesDraft}
            disabled={isSaving || scenesDraft.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
            {isSaving ? 'Saving...' : 'Save All Scenes'}
          </button>
        </div>
      </div>

      {/* Script Conversion Banner */}
      {scriptDraft && (
        <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              Active Script Source
            </div>
            <div className="text-base font-bold text-white">{scriptDraft.title}</div>
            <div className="text-xs text-slate-400">
              {scriptDraft.scenes.length} Script Scenes • Target: {scriptDraft.targetDurationSeconds}s
            </div>
          </div>

          <button
            onClick={breakdownScenes}
            disabled={isBreakingDownScenes}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isBreakingDownScenes ? 'animate-spin' : ''}`} />
            {isBreakingDownScenes ? 'Structuring 3D Scenes...' : scenesDraft.length > 0 ? 'Regenerate 3D Breakdown' : 'Break Down into 3D Scenes'}
          </button>
        </div>
      )}

      {/* Total Duration Info Bar */}
      {scenesDraft.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-6 text-slate-300">
            <span className="flex items-center gap-1.5 font-semibold">
              <Clock className="w-4 h-4 text-indigo-400" />
              Total 3D Duration: {totalDuration}s
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <Layers className="w-4 h-4 text-emerald-400" />
              Scenes: {scenesDraft.length}
            </span>
          </div>

          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            Production Ready for Phase 2 3D World Studio
          </span>
        </div>
      )}

      {/* Scene Cards */}
      {scenesDraft.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-dashed border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-900 mx-auto flex items-center justify-center text-slate-600">
            <Clapperboard className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-300">No 3D Scenes Broken Down Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Convert your script into structured 3D scenes with environment, camera, and character staging directions.
            </p>
          </div>
          {scriptDraft && (
            <button
              onClick={breakdownScenes}
              disabled={isBreakingDownScenes}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
            >
              Generate 3D Breakdown Now
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {scenesDraft.map((scene) => (
            <div
              key={scene.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5 shadow-sm hover:border-slate-700 transition"
            >
              {/* Scene Number, Title & Actions Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                    {scene.sceneNumber}
                  </span>
                  <input
                    type="text"
                    value={scene.sceneTitle}
                    onChange={(e) => handleUpdate(scene.id, { sceneTitle: e.target.value })}
                    className="bg-transparent text-base font-bold text-white border-b border-transparent hover:border-slate-700 focus:border-indigo-500 outline-none transition py-0.5"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Duration:</span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={scene.approximateDurationSeconds}
                      onChange={(e) =>
                        handleUpdate(scene.id, {
                          approximateDurationSeconds: Number(e.target.value) || 1,
                        })
                      }
                      className="w-14 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-indigo-500"
                    />
                    <span>s</span>
                  </div>

                  <button
                    onClick={() => deleteScene(scene.id)}
                    className="p-1.5 text-slate-600 hover:text-rose-400 rounded-lg transition"
                    title="Delete Scene"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Narrative & Action Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Scene Narrative Description
                  </label>
                  <textarea
                    rows={3}
                    value={scene.sceneDescription}
                    onChange={(e) => handleUpdate(scene.id, { sceneDescription: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Character Physical Choreography
                  </label>
                  <textarea
                    rows={3}
                    value={scene.characterActions}
                    onChange={(e) => handleUpdate(scene.id, { characterActions: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* 3D Staging Parameters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* 3D Environment Setting */}
                <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    3D Environment Spec
                  </label>
                  <textarea
                    rows={2}
                    value={scene.environmentDescription}
                    onChange={(e) => handleUpdate(scene.id, { environmentDescription: e.target.value })}
                    className="w-full bg-transparent border-0 text-xs text-slate-300 focus:outline-none resize-none"
                  />
                </div>

                {/* Camera Direction */}
                <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    Camera Direction & Movement
                  </label>
                  <textarea
                    rows={2}
                    value={scene.cameraDirectionSuggestions}
                    onChange={(e) => handleUpdate(scene.id, { cameraDirectionSuggestions: e.target.value })}
                    className="w-full bg-transparent border-0 text-xs text-slate-300 focus:outline-none resize-none"
                  />
                </div>

                {/* Props & Emotional Tone */}
                <div className="space-y-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5" />
                      Props Required
                    </label>
                    <input
                      type="text"
                      placeholder="comma-separated props..."
                      value={scene.propsRequired.join(', ')}
                      onChange={(e) =>
                        handleUpdate(scene.id, {
                          propsRequired: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      className="w-full bg-transparent text-xs text-slate-300 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 pt-1 border-t border-slate-900">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      <Smile className="w-3.5 h-3.5" />
                      Emotional Tone
                    </label>
                    <input
                      type="text"
                      value={scene.emotionalTone}
                      onChange={(e) => handleUpdate(scene.id, { emotionalTone: e.target.value })}
                      className="w-full bg-transparent text-xs text-slate-300 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Continuity Notes */}
              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  Continuity Notes (3D Props / Actor State)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Actor holding wrench in left hand from previous scene..."
                  value={scene.continuityNotes}
                  onChange={(e) => handleUpdate(scene.id, { continuityNotes: e.target.value })}
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg px-3 py-1.5 text-xs text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          ))}

          {/* Bottom Save */}
          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={addScene}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition"
            >
              <Plus className="w-4 h-4" />
              Add Another Scene
            </button>

            <button
              onClick={saveScenesDraft}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save All Production Scenes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
