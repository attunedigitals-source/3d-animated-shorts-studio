import React, { useRef } from 'react';
import { useStudioStore } from '../../stores/useStudioStore';
import {
  Sparkles,
  Save,
  ArrowRight,
  BookOpen,
  User,
  Sliders,
  Clock,
  Layers,
  Heart,
  Cpu,
} from 'lucide-react';

export const StoryStudioView: React.FC = () => {
  const {
    currentProject,
    storyDraft,
    storyPromptOptions,
    setStoryPromptOptions,
    generateStory,
    isGeneratingStory,
    updateStoryDraft,
    saveStoryDraft,
    isSaving,
    setActiveView,
    aiSettings,
    setAiSettings,
    availableModels,
    setNotification,
  } = useStudioStore();

  const topicInputRef = useRef<HTMLTextAreaElement>(null);

  const samplePrompts = [
    { title: 'Dragon Sneeze', topic: 'A tiny dragon who can only sneeze glitter discovers his spark saves the kingdom.' },
    { title: 'Robot Chef', topic: 'A clumsy robot chef tries to bake the fluffiest pancake with chaotic results.' },
    { title: 'Neon Squirrel', topic: 'A cyberpunk squirrel hacks into an automated acorn vault in Neo-Tokyo.' },
  ];

  const categories = ['Comedy', 'Adventure', 'Whimsical', 'Sci-Fi', 'Action', 'Slice of Life', 'Mystery'];
  const tones = ['Humorous and Whimsical', 'High Energy Slapstick', 'Heartwarming and Cute', 'Epic & Adventurous', 'Quirky & Absurd'];
  const visualStyles = ['Stylized 3D Cartoon', 'Low-Poly Colorful', 'Claymation Style', 'Retro 90s CGI', 'Chibi Miniature'];
  const durations = [15, 30, 45, 60, 90];

  const handleGenerate = async () => {
    let rawTopic = storyPromptOptions.topic?.trim() || '';
    const fallbackTitle = storyPromptOptions.title?.trim() || currentProject?.title?.trim() || currentProject?.description?.trim() || '';

    // If topic is empty, try using title or fallback to a creative default prompt
    if (!rawTopic) {
      if (fallbackTitle && fallbackTitle.length >= 3) {
        rawTopic = fallbackTitle;
        setStoryPromptOptions({ topic: fallbackTitle });
      } else {
        rawTopic = 'A tiny dragon who can only sneeze glitter discovers his spark saves the kingdom.';
        setStoryPromptOptions({ topic: rawTopic, title: 'The Glitter Dragon' });
      }
    } else if (rawTopic.length < 3) {
      setNotification({
        type: 'error',
        message: 'Story concept must be at least 3 characters long.',
      });
      topicInputRef.current?.focus();
      return;
    }

    try {
      await generateStory();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Story generation failed. Please check your AI API key in Settings.',
      });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Bar with Workflow Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            AI Story Studio
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Craft the original narrative foundation, protagonist profiles, and dramatic conflict.
          </p>
        </div>

        {storyDraft && (
          <div className="flex items-center gap-3">
            <button
              onClick={saveStoryDraft}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition disabled:opacity-50"
            >
              <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
              {isSaving ? 'Saving...' : 'Save Story'}
            </button>
            <button
              onClick={() => setActiveView('script')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md transition"
            >
              <span>Proceed to Script</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Form Left, Output Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Story Concept & Generation Controls */}
        <div className="lg:col-span-5 space-y-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Story Prompt & Directing Controls
            </h2>
            <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              Creative Brief
            </span>
          </div>

          <div className="space-y-4">
            {/* Story Topic / Idea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Story Concept / Core Idea *
                </label>
                <span className="text-[10px] text-slate-500">Min 3 characters</span>
              </div>

              {/* Quick Idea Starters */}
              <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                <span className="text-[10px] text-slate-500">Quick ideas:</span>
                {samplePrompts.map((p) => (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => setStoryPromptOptions({ topic: p.topic, title: p.title })}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white transition"
                  >
                    + {p.title}
                  </button>
                ))}
              </div>

              <textarea
                ref={topicInputRef}
                rows={3}
                required
                placeholder="e.g. A clumsy robot chef tries to bake the world's fluffiest pancake with chaotic results..."
                value={storyPromptOptions.topic}
                onChange={(e) => setStoryPromptOptions({ topic: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none resize-none leading-relaxed transition"
              />
            </div>

            {/* Video Title (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Project / Short Title</label>
              <input
                type="text"
                placeholder="Leave blank to let AI propose a creative title"
                value={storyPromptOptions.title || ''}
                onChange={(e) => setStoryPromptOptions({ title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Target Duration Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Target Video Duration
              </label>
              <div className="grid grid-cols-5 gap-2">
                {durations.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setStoryPromptOptions({ targetDurationSeconds: d })}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      storyPromptOptions.targetDurationSeconds === d
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            {/* Genre & Tone Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Genre / Category</label>
                <select
                  value={storyPromptOptions.category}
                  onChange={(e) => setStoryPromptOptions({ category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tone</label>
                <select
                  value={storyPromptOptions.tone}
                  onChange={(e) => setStoryPromptOptions({ tone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {tones.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Visual Style & Audience */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Visual Aesthetic</label>
                <select
                  value={storyPromptOptions.visualStyle}
                  onChange={(e) => setStoryPromptOptions({ visualStyle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {visualStyles.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Language</label>
                <input
                  type="text"
                  value={storyPromptOptions.language}
                  onChange={(e) => setStoryPromptOptions({ language: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Additional Directing Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Special Directing Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Focus on physical comedy; end with a sudden visual freeze frame..."
                value={storyPromptOptions.additionalInstructions || ''}
                onChange={(e) => setStoryPromptOptions({ additionalInstructions: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Model Selector */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  AI Model
                </span>
                <span className="text-[10px] text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 capitalize">
                  {aiSettings.provider || 'ollama'}
                </span>
              </label>
              <select
                value={aiSettings.model}
                onChange={(e) => {
                  const val = e.target.value;
                  const matched = availableModels.find((m) => m.id === val);
                  if (matched && matched.provider) {
                    setAiSettings({ model: val, provider: matched.provider });
                  } else {
                    setAiSettings({ model: val });
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {availableModels
                  .filter((m) => !aiSettings.provider || m.provider === aiSettings.provider)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                {aiSettings.model &&
                  !availableModels.some(
                    (m) => m.id === aiSettings.model && (!aiSettings.provider || m.provider === aiSettings.provider)
                  ) && (
                    <option value={aiSettings.model}>
                      {aiSettings.model} (Custom)
                    </option>
                  )}
              </select>
            </div>

            {/* Generate Action Button */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGeneratingStory}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-[0.98] ${
                  isGeneratingStory
                    ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 cursor-not-allowed opacity-80'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 border border-indigo-400/40 hover:border-indigo-300 cursor-pointer'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${isGeneratingStory ? 'animate-spin text-indigo-300' : 'text-white'}`} />
                {isGeneratingStory ? 'Generating Original Story (10-20s)...' : storyDraft ? 'Regenerate Story' : 'Generate 3D Short Story'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Generated Story Document & Editor */}
        <div className="lg:col-span-7 space-y-6">
          {!storyDraft ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-900 mx-auto flex items-center justify-center text-slate-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-300">Story Workspace Empty</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Enter your story idea in the prompt panel and click "Generate 3D Short Story" to begin.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
              {/* Story Title & Logline */}
              <div className="space-y-3 pb-6 border-b border-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    Story Title
                  </span>
                  <input
                    type="text"
                    value={storyDraft.title}
                    onChange={(e) => updateStoryDraft({ ...storyDraft, title: e.target.value })}
                    className="w-full bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 text-xl font-extrabold text-white outline-none transition py-1"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Logline
                  </span>
                  <textarea
                    rows={2}
                    value={storyDraft.logline}
                    onChange={(e) => updateStoryDraft({ ...storyDraft, logline: e.target.value })}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Narrative Arc Breakdown */}
              <div className="space-y-4 pb-6 border-b border-slate-800">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Narrative Arc Structure
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Premise & World Setup</label>
                    <textarea
                      rows={2}
                      value={storyDraft.premise}
                      onChange={(e) => updateStoryDraft({ ...storyDraft, premise: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Beginning / Hook</label>
                      <textarea
                        rows={2}
                        value={storyDraft.beginning}
                        onChange={(e) => updateStoryDraft({ ...storyDraft, beginning: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Main Conflict / Obstacle</label>
                      <textarea
                        rows={2}
                        value={storyDraft.mainConflict}
                        onChange={(e) => updateStoryDraft({ ...storyDraft, mainConflict: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Climax</label>
                      <textarea
                        rows={2}
                        value={storyDraft.climax}
                        onChange={(e) => updateStoryDraft({ ...storyDraft, climax: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Ending / Button</label>
                      <textarea
                        rows={2}
                        value={storyDraft.ending}
                        onChange={(e) => updateStoryDraft({ ...storyDraft, ending: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Character Profiles */}
              <div className="space-y-3 pb-6 border-b border-slate-800">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  Stylized Character Cast ({storyDraft.characterDescriptions.length})
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {storyDraft.characterDescriptions.map((char, index) => (
                    <div key={index} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-indigo-300">{char.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {char.role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed">
                        <span className="text-slate-500 font-semibold">Personality: </span>
                        {char.personality}
                      </div>
                      <div className="text-xs text-slate-400 leading-relaxed">
                        <span className="text-slate-500 font-semibold">Look: </span>
                        {char.appearance}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emotional Progression Arc */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400" />
                  Emotional Progression
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium">
                  {storyDraft.emotionalProgression}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={saveStoryDraft}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? 'Saving...' : 'Save Story Revision'}
                </button>

                <button
                  onClick={() => setActiveView('script')}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
                >
                  <span>Proceed to Script Editor</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
