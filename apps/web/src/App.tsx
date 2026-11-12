import { Pure3DStudioView } from './components/studio/Pure3DStudioView';

export default function App() {
  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-amber-400 selection:text-slate-950">
      <Pure3DStudioView />
    </div>
  );
}

