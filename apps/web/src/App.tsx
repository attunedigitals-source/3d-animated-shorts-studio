import { useEffect } from 'react';
import { useStudioStore } from './stores/useStudioStore';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProjectsView } from './components/projects/ProjectsView';
import { StoryStudioView } from './components/story/StoryStudioView';
import { ScriptEditorView } from './components/script/ScriptEditorView';
import { SceneBreakdownView } from './components/scenes/SceneBreakdownView';
import { SettingsView } from './components/settings/SettingsView';
import { AuthModal } from './components/auth/AuthModal';
import { NotificationToast } from './components/common/NotificationToast';

export default function App() {
  const { activeView, initStudio } = useStudioStore();

  useEffect(() => {
    initStudio();
  }, [initStudio]);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'projects':
        return <ProjectsView />;
      case 'story':
        return <StoryStudioView />;
      case 'script':
        return <ScriptEditorView />;
      case 'scenes':
        return <SceneBreakdownView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  const isPreviewUrl =
    typeof window !== 'undefined' &&
    window.location.hostname.includes('-projects.vercel.app');

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none antialiased">
      {/* Notice if viewing immutable preview snapshot */}
      {isPreviewUrl && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md z-50 shrink-0">
          <div className="flex items-center gap-2">
            <span>⚠️ You are on an immutable preview deployment snapshot.</span>
            <span className="hidden sm:inline font-normal">New updates are deployed to the main production URL.</span>
          </div>
          <a
            href="https://3d-animated-shorts-studio-h9wa.vercel.app"
            className="px-3 py-1 bg-slate-950 text-amber-400 rounded hover:bg-slate-900 transition font-extrabold text-[11px]"
          >
            Switch to Live Production Studio →
          </a>
        </div>
      )}

      {/* Top Studio Header */}
      <Header />

      {/* Main Studio Body: Sidebar + Active Canvas/View */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-950/50">
          {renderActiveView()}
        </main>
      </div>

      {/* Overlays & Modals */}
      <AuthModal />
      <NotificationToast />
    </div>
  );
}
