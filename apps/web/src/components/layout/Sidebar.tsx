import React from 'react';
import { useStudioStore, ActiveView } from '../../stores/useStudioStore';
import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  FileText,
  Clapperboard,
  Settings,
  CheckCircle2,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, currentProject } = useStudioStore();

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode; requiresProject?: boolean; isCompleted?: boolean }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: <FolderKanban className="w-4 h-4" />,
    },
    {
      id: 'story',
      label: 'AI Story Studio',
      icon: <Sparkles className="w-4 h-4" />,
      requiresProject: false,
      isCompleted: Boolean(currentProject?.hasStory),
    },
    {
      id: 'script',
      label: 'Script Editor',
      icon: <FileText className="w-4 h-4" />,
      requiresProject: true,
      isCompleted: Boolean(currentProject?.hasScript),
    },
    {
      id: 'scenes',
      label: 'Scene Breakdown',
      icon: <Clapperboard className="w-4 h-4" />,
      requiresProject: true,
      isCompleted: Boolean(currentProject?.sceneCount && currentProject.sceneCount > 0),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between shrink-0 select-none">
      <div className="p-4 space-y-6">
        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Production Pipeline
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              const isLocked = item.requiresProject && !currentProject;

              return (
                <button
                  key={item.id}
                  disabled={isLocked}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                      : isLocked
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-indigo-400' : 'text-slate-500'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>

                  {item.isCompleted && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-900 text-xs text-slate-500">
        <div className="flex items-center justify-between mb-1">
          <span>Phase 1</span>
          <span className="text-emerald-400 font-semibold">Active</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-normal">
          AI Story Engine & Production Staging
        </p>
      </div>
    </aside>
  );
};

