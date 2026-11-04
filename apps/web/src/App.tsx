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

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none antialiased">
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
