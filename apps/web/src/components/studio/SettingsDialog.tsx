import React, { useState } from 'react';
import { X, Key, Check, Sparkles } from 'lucide-react';
import { usePureStudioStore } from '../../stores/usePureStudioStore';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const { geminiKey, ai33Key, setGeminiKey, setAi33Key } = usePureStudioStore();
  const [localGemini, setLocalGemini] = useState(geminiKey);
  const [localAi33, setLocalAi33] = useState(ai33Key);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setGeminiKey(localGemini.trim());
    setAi33Key(localAi33.trim());
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">API Credentials & Vault</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Your keys are securely encrypted. The app queries Google Gemini Plus models directly for 3D CGI visuals, scripts, and audio.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Google Gemini API Key</span>
              <span className="text-[10px] text-slate-400 font-mono">gemini-2.5-pro • gemini-3-pro-image</span>
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
              <span className="text-[10px] text-slate-400 font-mono">ai33.pro v3 TTS</span>
            </label>
            <input
              type="password"
              placeholder="ai33_..."
              value={localAi33}
              onChange={(e) => setLocalAi33(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          {savedNotice && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
              <Check className="w-4 h-4" />
              API credentials saved successfully!
            </div>
          )}
        </div>

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
            Save Credentials
          </button>
        </div>
      </div>
    </div>
  );
};
