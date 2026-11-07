import React, { useState } from 'react';
import { useStudioStore } from '../../stores/useStudioStore';
import {
  Film,
  Sparkles,
  Save,
  Database,
  User,
  LogOut,
  ChevronRight,
  Edit2,
  Check,
} from 'lucide-react';
import { api } from '../../services/api';

export const Header: React.FC = () => {
  const {
    user,
    currentProject,
    openAuthModal,
    setUser,
    isDevAuth,
    isSupabaseConfigured,
    aiSettings,
    isSaving,
    saveStoryDraft,
    saveScriptDraft,
    saveScenesDraft,
    updateProjectTitle,
    activeView,
  } = useStudioStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  const handleStartRename = () => {
    if (!currentProject) return;
    setTitleInput(currentProject.title);
    setIsEditingTitle(true);
  };

  const handleFinishRename = async () => {
    if (titleInput.trim() && currentProject && titleInput !== currentProject.title) {
      await updateProjectTitle(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleQuickSave = async () => {
    if (activeView === 'story') await saveStoryDraft();
    else if (activeView === 'script') await saveScriptDraft();
    else if (activeView === 'scenes') await saveScenesDraft();
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
  };

  const statusBadge = () => {
    if (!currentProject) return null;
    const colors: Record<string, string> = {
      draft: 'bg-slate-800 text-slate-300 border-slate-700',
      story_generated: 'bg-blue-950 text-blue-300 border-blue-800',
      script_generated: 'bg-purple-950 text-purple-300 border-purple-800',
      scenes_broken_down: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      ready_for_production: 'bg-amber-950 text-amber-300 border-amber-800',
    };
    const labels: Record<string, string> = {
      draft: 'Draft',
      story_generated: 'Story Ready',
      script_generated: 'Script Ready',
      scenes_broken_down: 'Scenes Staged',
      ready_for_production: 'Ready for 3D',
    };
    return (
      <span
        className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
          colors[currentProject.status] || colors.draft
        }`}
      >
        {labels[currentProject.status] || currentProject.status}
      </span>
    );
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Branding & Active Project */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Film className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight text-white hidden sm:inline">
            3D Shorts <span className="text-indigo-400">Studio</span>
          </span>
        </div>

        {currentProject && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800 text-sm">
            <ChevronRight className="w-4 h-4 text-slate-600" />
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleFinishRename}
                  onKeyDown={(e) => e.key === 'Enter' && handleFinishRename()}
                  autoFocus
                  className="bg-slate-900 border border-indigo-500 px-2 py-0.5 rounded text-white text-sm outline-none w-48"
                />
                <button onClick={handleFinishRename} className="text-emerald-400 p-1 hover:text-white">
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={handleStartRename}
                className="group flex items-center gap-2 cursor-pointer hover:text-indigo-300 transition"
                title="Click to rename project"
              >
                <span className="font-semibold text-slate-200 max-w-xs truncate">{currentProject.title}</span>
                <Edit2 className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
              </div>
            )}
            {statusBadge()}
          </div>
        )}
      </div>

      {/* Right: Actions, System Badges & User Profile */}
      <div className="flex items-center gap-3">
        {/* Save button if in an editable view */}
        {currentProject && ['story', 'script', 'scenes'].includes(activeView) && (
          <button
            onClick={handleQuickSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition disabled:opacity-50"
          >
            <Save className={`w-3.5 h-3.5 text-indigo-400 ${isSaving ? 'animate-spin' : ''}`} />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
        )}

        {/* Database Status Pill */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-900/60 border-slate-800 text-slate-400"
          title={isSupabaseConfigured ? 'Connected to Supabase PostgreSQL' : 'Operating in Local Development Database mode'}
        >
          <Database className={`w-3.5 h-3.5 ${isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span>{isSupabaseConfigured ? 'Supabase' : 'Dev DB'}</span>
        </div>

        {/* AI Engine Status Pill (Ollama Exclusive) */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-900/60 border-slate-800 text-slate-300"
          title={`Active AI Engine: Self-Hosted Ollama on AWS EC2 (${aiSettings.model || 'llama3.2:3b'})`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Ollama ({aiSettings.model || 'llama3.2:3b'})</span>
        </div>

        {/* User Account Menu */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-indigo-300 font-bold text-xs uppercase">
              {user.displayName.slice(0, 2)}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-medium text-slate-200 leading-none">{user.displayName}</div>
              <div className="text-[10px] text-slate-500 leading-none mt-1">
                {isDevAuth ? 'Local Account' : user.email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 transition ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
          >
            <User className="w-3.5 h-3.5" />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

