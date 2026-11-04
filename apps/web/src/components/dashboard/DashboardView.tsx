import React, { useState } from 'react';
import { useStudioStore } from '../../stores/useStudioStore';
import {
  Plus,
  FolderKanban,
  Sparkles,
  Clapperboard,
  Clock,
  ArrowRight,
  Film,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    projects,
    selectProject,
    setActiveView,
    createProject,
    currentProject,
    setStoryPromptOptions,
  } = useStudioStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Statistics calculation from real project data
  const totalProjects = projects.length;
  const totalScenes = projects.reduce((acc, p) => acc + (p.sceneCount || 0), 0);
  const totalSeconds = projects.reduce((acc, p) => acc + (p.estimatedDurationSeconds || 0), 0);
  const formattedDuration = `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`;
  const storiesGenerated = projects.filter((p) => p.hasStory).length;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await createProject(newTitle.trim(), newDescription.trim() || undefined);
      setIsModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setActiveView('story');
    } catch {
      // notification handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartIdeaQuick = (topic: string, category: string) => {
    setStoryPromptOptions({ topic, category });
    setActiveView('story');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/20 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            AI 3D Animation Production Pipeline
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Create Engaging 3D Animated Shorts
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            From an initial story idea to script, character emotional arcs, and production-ready 3D scene staging.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Projects</span>
            <FolderKanban className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalProjects}</div>
          <div className="text-xs text-slate-500">Active shorts in workspace</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Stories Generated</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{storiesGenerated}</div>
          <div className="text-xs text-slate-500">Narratives completed</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total 3D Scenes</span>
            <Clapperboard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalScenes}</div>
          <div className="text-xs text-slate-500">Staged production scenes</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Estimated Runtime</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{formattedDuration}</div>
          <div className="text-xs text-slate-500">Total duration of all scripts</div>
        </div>
      </div>

      {/* Active Project Quick Card if loaded */}
      {currentProject && (
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase text-indigo-400 tracking-wider">
              Currently Active Project
            </div>
            <div className="text-xl font-bold text-white">{currentProject.title}</div>
            <div className="text-sm text-slate-400">
              {currentProject.preferences.category} • {currentProject.preferences.targetDurationSeconds}s •{' '}
              {currentProject.sceneCount} Scenes
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('story')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
            >
              Resume Story
              <ArrowRight className="w-4 h-4" />
            </button>
            {currentProject.hasScript && (
              <button
                onClick={() => setActiveView('script')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-sm font-medium transition"
              >
                Open Script
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recent Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-400" />
            Recent Projects
          </h2>
          <button
            onClick={() => setActiveView('projects')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            View All ({projects.length})
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-900 mx-auto flex items-center justify-center text-slate-600">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="text-base font-semibold text-slate-300">No Projects Found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Begin your 3D animation journey by creating a new project or testing a quick story concept below.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
            >
              Create First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((proj) => (
              <div
                key={proj.id}
                onClick={async () => {
                  await selectProject(proj.id);
                  setActiveView('story');
                }}
                className="group p-5 rounded-2xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="font-bold text-base text-slate-200 group-hover:text-indigo-300 transition truncate">
                      {proj.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {proj.description || 'No description provided'}
                    </p>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                    {proj.preferences.category}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {proj.preferences.targetDurationSeconds}s
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      {proj.sceneCount} Scenes
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Inspiration Prompts */}
      <div className="space-y-3 pt-4 border-t border-slate-900">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Quick Story Starters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { topic: 'A clumsy robot accidentally invents pancake teleportation', category: 'Comedy' },
            { topic: 'A tiny dragon who can only sneeze tiny colorful bubbles', category: 'Whimsical' },
            { topic: 'An ambitious hamster building an interstellar cardboard rocket', category: 'Adventure' },
          ].map((idea, i) => (
            <button
              key={i}
              onClick={() => handleStartIdeaQuick(idea.topic, idea.category)}
              className="p-3 rounded-xl bg-slate-900/40 hover:bg-indigo-950/30 border border-slate-800 hover:border-indigo-500/30 text-left transition group"
            >
              <div className="text-xs font-semibold text-slate-300 group-hover:text-indigo-300 line-clamp-1">
                "{idea.topic}"
              </div>
              <div className="text-[10px] text-slate-500 mt-1">{idea.category} • One-Click Starter</div>
            </button>
          ))}
        </div>
      </div>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Create New Short Project</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Barnaby's Great Robot Cake"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Short Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="A short note on what this cartoon short is about..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create & Open Studio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

