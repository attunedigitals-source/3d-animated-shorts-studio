import React, { useState } from 'react';
import { X, Key, Check, Sparkles, Cpu, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { AVAILABLE_GEMINI_MODELS, GeminiModelSuiteConfig, GeminiModelEntry } from '@studio/types';
import { usePureStudioStore } from '../../stores/usePureStudioStore';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const {
    sessionGeminiKey,
    sessionAi33Key,
    modelSuite,
    setSessionGeminiKey,
    setSessionAi33Key,
    setModelSuite,
  } = usePureStudioStore();

  const [activeTab, setActiveTab] = useState<'keys' | 'models'>('keys');
  const [localGemini, setLocalGemini] = useState(sessionGeminiKey);
  const [localAi33, setLocalAi33] = useState(sessionAi33Key);
  const [localModels, setLocalModels] = useState<GeminiModelSuiteConfig>({ ...modelSuite });
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSessionGeminiKey(localGemini.trim());
    setSessionAi33Key(localAi33.trim());
    setModelSuite(localModels);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  const handleModelChange = (role: keyof GeminiModelSuiteConfig, modelId: string) => {
    setLocalModels((prev: GeminiModelSuiteConfig) => ({ ...prev, [role]: modelId }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Studio Engine Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('keys')}
            className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'keys'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Credentials</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('models')}
            className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'models'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Gemini Model Suite ({AVAILABLE_GEMINI_MODELS.length} Available)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {activeTab === 'keys' && (
            <div className="space-y-5">
              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Session credentials are held in-memory for the active session and transmitted securely via HTTPS headers to the backend pipeline. Keys are never saved to unencrypted browser localStorage.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Google Gemini API Key</span>
                  <span className="text-[10px] text-slate-400 font-mono">Nano Banana Pro • Gemini 2.5 Pro • Lyria</span>
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={localGemini}
                  onChange={(e) => setLocalGemini(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>ai33.pro Voice API Key</span>
                  <span className="text-[10px] text-slate-400 font-mono">Neural TTS + Word Timestamps</span>
                </label>
                <input
                  type="password"
                  placeholder="ai33_..."
                  value={localAi33}
                  onChange={(e) => setLocalAi33(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Configured from your active Google Gemini Plus model query list</span>
                </div>
                <span className="text-amber-400 font-mono font-bold text-[10px] uppercase">
                  Active Suite
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* 1. Deep Researcher */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <label className="font-bold text-slate-200 block">
                    1. Investigative Researcher
                  </label>
                  <p className="text-[11px] text-slate-400">Viral hook & historical facts discovery</p>
                  <select
                    value={localModels.researcherModel}
                    onChange={(e) => handleModelChange('researcherModel', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs font-mono focus:border-amber-400 outline-none"
                  >
                    {AVAILABLE_GEMINI_MODELS.map((m: GeminiModelEntry) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id}) [{m.category}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Lead Screenwriter */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <label className="font-bold text-slate-200 block">
                    2. Lead Screenwriter & DNA
                  </label>
                  <p className="text-[11px] text-slate-400">8-beat script & Visual Identity Matrix</p>
                  <select
                    value={localModels.screenwriterModel}
                    onChange={(e) => handleModelChange('screenwriterModel', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs font-mono focus:border-amber-400 outline-none"
                  >
                    {AVAILABLE_GEMINI_MODELS.map((m: GeminiModelEntry) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id}) [{m.category}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Continuity */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <label className="font-bold text-slate-200 block">
                    3. Spatial Continuity Supervisor
                  </label>
                  <p className="text-[11px] text-slate-400">Object permanence & color temperatures</p>
                  <select
                    value={localModels.continuityModel}
                    onChange={(e) => handleModelChange('continuityModel', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs font-mono focus:border-amber-400 outline-none"
                  >
                    {AVAILABLE_GEMINI_MODELS.map((m: GeminiModelEntry) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id}) [{m.category}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. 3D CGI Visual Artist */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <label className="font-bold text-slate-200 block">
                    4. 3D CGI Visual Artist (Image)
                  </label>
                  <p className="text-[11px] text-slate-400">Canonical turnaround & conditioned shots</p>
                  <select
                    value={localModels.imageModel}
                    onChange={(e) => handleModelChange('imageModel', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs font-mono focus:border-amber-400 outline-none"
                  >
                    {AVAILABLE_GEMINI_MODELS.map((m: GeminiModelEntry) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id}) [{m.category}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Cinematographer */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <label className="font-bold text-slate-200 block">
                    5. Cinematographer & Director
                  </label>
                  <p className="text-[11px] text-slate-400">Camera motion & volumetric trajectory</p>
                  <select
                    value={localModels.directorModel}
                    onChange={(e) => handleModelChange('directorModel', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs font-mono focus:border-amber-400 outline-none"
                  >
                    {AVAILABLE_GEMINI_MODELS.map((m: GeminiModelEntry) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id}) [{m.category}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Soundtrack */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <label className="font-bold text-slate-200 block">
                    6. Cinematic Soundtrack (Music)
                  </label>
                  <p className="text-[11px] text-slate-400">Adaptive score & -8dB speech ducking</p>
                  <select
                    value={localModels.musicModel}
                    onChange={(e) => handleModelChange('musicModel', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs font-mono focus:border-amber-400 outline-none"
                  >
                    {AVAILABLE_GEMINI_MODELS.map((m: GeminiModelEntry) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id}) [{m.category}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* 7. QA Inspector */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <label className="font-bold text-slate-200 block">
                    7. Multimodal Visual QA Inspector
                  </label>
                  <p className="text-[11px] text-slate-400">Facial & wardrobe identity verification</p>
                  <select
                    value={localModels.qaModel}
                    onChange={(e) => handleModelChange('qaModel', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs font-mono focus:border-amber-400 outline-none"
                  >
                    {AVAILABLE_GEMINI_MODELS.map((m: GeminiModelEntry) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id}) [{m.category}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* 8. UI Streaming */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <label className="font-bold text-slate-200 block">
                    8. Fast UI Streaming & Validation
                  </label>
                  <p className="text-[11px] text-slate-400">Sub-second state validation</p>
                  <select
                    value={localModels.uiModel}
                    onChange={(e) => handleModelChange('uiModel', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs font-mono focus:border-amber-400 outline-none"
                  >
                    {AVAILABLE_GEMINI_MODELS.map((m: GeminiModelEntry) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id}) [{m.category}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {savedNotice && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
              <Check className="w-4 h-4" />
              Settings and model suite preferences saved successfully!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
