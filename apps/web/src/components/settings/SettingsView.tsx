import React, { useState } from 'react';
import { useStudioStore } from '../../stores/useStudioStore';
import {
  Settings,
  Database,
  Cpu,
  Key,
  Globe,
  Activity,
  CheckCircle2,
  AlertCircle,
  Mic,
  Save,
  Eye,
  EyeOff,
  Cloud,
  HardDrive,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  AIProviderType,
  TestConnectionResponse,
  TestSupabaseResponse,
  TestVoiceResponse,
} from '@studio/types';

export const SettingsView: React.FC = () => {
  const {
    aiSettings,
    setAiSettings,
    voiceSettings,
    setVoiceSettings,
    supabaseSettings,
    setSupabaseSettings,
    saveAllStudioSettings,
    availableModels,
    isSupabaseConfigured,
    isSaving,
    setNotification,
  } = useStudioStore();

  const [activeTab, setActiveTab] = useState<'ai' | 'voice' | 'database'>('ai');

  // Key Visibility Toggles
  const [showAiKey, setShowAiKey] = useState(false);
  const [showVoiceKey, setShowVoiceKey] = useState(false);
  const [showSupabaseAnonKey, setShowSupabaseAnonKey] = useState(false);
  const [showSupabaseServiceKey, setShowSupabaseServiceKey] = useState(false);

  // Custom API URL
  const [customApiUrl, setCustomApiUrl] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('studio_custom_api_url') || '';
    }
    return '';
  });

  // Test states
  const [aiTestResult, setAiTestResult] = useState<TestConnectionResponse | null>(null);
  const [isTestingAi, setIsTestingAi] = useState(false);

  const [voiceTestResult, setVoiceTestResult] = useState<TestVoiceResponse | null>(null);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  const [supabaseTestResult, setSupabaseTestResult] = useState<TestSupabaseResponse | null>(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);

  const providers: { id: AIProviderType; name: string; desc: string }[] = [
    {
      id: 'openrouter',
      name: 'OpenRouter Free Tier & Auto-Fallback',
      desc: 'Automatic free models (Llama 3.3, Gemini 2.0, DeepSeek R1) with instant cascade fallback.',
    },
    {
      id: 'openai',
      name: 'OpenAI / Self-Hosted Compatible',
      desc: 'Connect directly to OpenAI or local models via Ollama, vLLM, or LM Studio.',
    },
    {
      id: 'anthropic',
      name: 'Anthropic Direct',
      desc: 'Direct Claude API integration using your Anthropic console key.',
    },
    {
      id: 'mock',
      name: 'Offline Mock AI Engine',
      desc: 'Zero-cost deterministic generation for offline development and testing.',
    },
  ];

  const handleTestAi = async () => {
    setIsTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await api.testConnection(aiSettings);
      setAiTestResult(res);
      setNotification({
        type: res.connected ? 'success' : 'error',
        message: res.message,
      });
    } catch (err: any) {
      setAiTestResult({
        connected: false,
        provider: aiSettings.provider || 'openrouter',
        model: aiSettings.model || 'default',
        latencyMs: 0,
        message: err.message || 'AI Connection test failed',
      });
    } finally {
      setIsTestingAi(false);
    }
  };

  const handleTestVoice = async () => {
    setIsTestingVoice(true);
    setVoiceTestResult(null);
    try {
      const res = await api.testVoiceConnection({
        apiKey: voiceSettings.apiKey,
        baseUrl: voiceSettings.baseUrl,
        provider: voiceSettings.provider,
      });
      setVoiceTestResult(res);
      setNotification({
        type: res.connected ? 'success' : 'error',
        message: res.message,
      });
    } catch (err: any) {
      setVoiceTestResult({
        connected: false,
        provider: voiceSettings.provider || 'ai33',
        latencyMs: 0,
        message: err.message || 'Voice connection test failed',
      });
    } finally {
      setIsTestingVoice(false);
    }
  };

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseTestResult(null);
    try {
      const res = await api.testSupabaseConnection({
        supabaseUrl: supabaseSettings.supabaseUrl,
        supabaseAnonKey: supabaseSettings.supabaseAnonKey,
      });
      setSupabaseTestResult(res);
      setNotification({
        type: res.connected ? 'success' : 'error',
        message: res.message,
      });
    } catch (err: any) {
      setSupabaseTestResult({
        connected: false,
        latencyMs: 0,
        message: err.message || 'Supabase connection test failed',
      });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-indigo-400" />
            Studio Engine Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure AI reasoning engines, ai33.pro voice models, and Supabase cloud credentials.
          </p>
        </div>

        <button
          onClick={saveAllStudioSettings}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
        >
          <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
          {isSaving ? 'Saving Credentials...' : 'Save All Settings'}
        </button>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'ai'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          AI Language Model
        </button>
        <button
          onClick={() => setActiveTab('voice')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'voice'
              ? 'border-purple-500 text-purple-400 bg-purple-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mic className="w-4 h-4" />
          AI Voice & Dialogue (ai33.pro)
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'database'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          Supabase Cloud Database
        </button>
      </div>

      {/* TAB 1: AI Language Models */}
      {activeTab === 'ai' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              AI Language & Reasoning Provider
            </h2>
            <span className="text-[10px] font-semibold text-slate-400">Phase 1 Engine</span>
          </div>

          {/* Provider Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {providers.map((p) => {
              const isSelected = aiSettings.provider === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    const defaultModels: Record<AIProviderType, string> = {
                      openrouter: 'meta-llama/llama-3.3-70b-instruct:free',
                      openai: 'gpt-4o',
                      anthropic: 'claude-3-5-sonnet-20241022',
                      mock: 'mock-story-v1',
                    };
                    setAiSettings({
                      provider: p.id,
                      model: defaultModels[p.id] || 'gpt-4o',
                    });
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500/50 shadow-md shadow-indigo-600/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{p.name}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <p className="text-xs text-slate-400 leading-normal">{p.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Configuration Fields */}
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Selected Model</span>
                <span className="text-[10px] text-slate-500">Curated or custom model</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={aiSettings.model}
                  onChange={(e) => setAiSettings({ model: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {availableModels
                    .filter((m) => !aiSettings.provider || m.provider === aiSettings.provider)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>

                <input
                  type="text"
                  placeholder="Or enter custom model ID..."
                  value={aiSettings.model || ''}
                  onChange={(e) => setAiSettings({ model: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {aiSettings.provider !== 'mock' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-400" />
                    API Key ({aiSettings.provider})
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Saved securely to studio runtime
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showAiKey ? 'text' : 'password'}
                    placeholder={`Enter your ${aiSettings.provider} API key...`}
                    value={aiSettings.apiKey || ''}
                    onChange={(e) => setAiSettings({ apiKey: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAiKey(!showAiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {aiSettings.provider === 'openai' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  Custom Base URL (e.g. for Ollama / LM Studio)
                </label>
                <input
                  type="text"
                  placeholder="http://localhost:11434/v1"
                  value={aiSettings.baseUrl || ''}
                  onChange={(e) => setAiSettings({ baseUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                onClick={handleTestAi}
                disabled={isTestingAi}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition disabled:opacity-50"
              >
                <Activity className={`w-3.5 h-3.5 ${isTestingAi ? 'animate-spin text-indigo-400' : ''}`} />
                {isTestingAi ? 'Pinging Provider...' : 'Test AI Connection'}
              </button>

              {aiTestResult && (
                <div
                  className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border ${
                    aiTestResult.connected
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {aiTestResult.connected ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>
                    {aiTestResult.message} ({aiTestResult.latencyMs}ms)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI Voice Engine (ai33.pro) */}
      {activeTab === 'voice' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Mic className="w-4 h-4 text-purple-400" />
              ai33.pro Unified Voice & Multi-Speaker Dialogue
            </h2>
            <span className="text-[10px] font-semibold text-purple-300 px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800">
              Unified v3
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The studio uses <strong>ai33.pro Unified v3 API</strong> to synthesize character voices and multi-speaker dialogue. It unifies ElevenLabs, Minimax, Edge, Kokoro, and Custom Cloned voices under a single endpoint.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setVoiceSettings({ provider: 'ai33' })}
              className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                voiceSettings.provider === 'ai33'
                  ? 'bg-purple-600/15 border-purple-500/50 shadow-md shadow-purple-600/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">ai33.pro Cloud Engine</span>
                {voiceSettings.provider === 'ai33' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
              </div>
              <p className="text-xs text-slate-400">High fidelity multi-speaker speech with ElevenLabs, Minimax, & Edge models.</p>
            </div>

            <div
              onClick={() => setVoiceSettings({ provider: 'mock' })}
              className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                voiceSettings.provider === 'mock'
                  ? 'bg-purple-600/15 border-purple-500/50 shadow-md shadow-purple-600/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">Offline Mock Voice</span>
                {voiceSettings.provider === 'mock' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
              </div>
              <p className="text-xs text-slate-400">Local simulation for development without consuming credits.</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {voiceSettings.provider === 'ai33' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-purple-400" />
                    ai33.pro API Key (xi-api-key)
                  </span>
                  <span className="text-[10px] text-slate-500">Sent via xi-api-key header</span>
                </label>
                <div className="relative">
                  <input
                    type={showVoiceKey ? 'text' : 'password'}
                    placeholder="Enter your ai33.pro API key..."
                    value={voiceSettings.apiKey || ''}
                    onChange={(e) => setVoiceSettings({ apiKey: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowVoiceKey(!showVoiceKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showVoiceKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-purple-400" />
                  API Endpoint Base URL
                </label>
                <input
                  type="text"
                  placeholder="https://api.ai33.pro/v3"
                  value={voiceSettings.baseUrl || 'https://api.ai33.pro/v3'}
                  onChange={(e) => setVoiceSettings({ baseUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span>Default Voice ID</span>
                </label>
                <input
                  type="text"
                  placeholder="minimax_male-qn-qingse"
                  value={voiceSettings.defaultVoiceId || 'minimax_male-qn-qingse'}
                  onChange={(e) => setVoiceSettings({ defaultVoiceId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                onClick={handleTestVoice}
                disabled={isTestingVoice}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition disabled:opacity-50"
              >
                <Activity className={`w-3.5 h-3.5 ${isTestingVoice ? 'animate-spin text-purple-400' : ''}`} />
                {isTestingVoice ? 'Pinging ai33.pro...' : 'Test Voice Connection'}
              </button>

              {voiceTestResult && (
                <div
                  className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border ${
                    voiceTestResult.connected
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {voiceTestResult.connected ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>
                    {voiceTestResult.message} ({voiceTestResult.latencyMs}ms)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Supabase Cloud Database */}
      {activeTab === 'database' && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Supabase PostgreSQL Database & Authentication
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isSupabaseConfigured
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border-amber-800'
              }`}
            >
              {isSupabaseConfigured ? 'Supabase Connected' : 'Local Dev Mode'}
            </span>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setSupabaseSettings({ mode: 'supabase' })}
              className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                supabaseSettings.mode === 'supabase'
                  ? 'bg-emerald-600/15 border-emerald-500/50 shadow-md shadow-emerald-600/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  Supabase Cloud
                </span>
                {supabaseSettings.mode === 'supabase' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-xs text-slate-400">Production PostgreSQL cloud storage with Row Level Security & user auth.</p>
            </div>

            <div
              onClick={() => setSupabaseSettings({ mode: 'dev' })}
              className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                supabaseSettings.mode === 'dev'
                  ? 'bg-emerald-600/15 border-emerald-500/50 shadow-md shadow-emerald-600/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  Local Development Store
                </span>
                {supabaseSettings.mode === 'dev' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-xs text-slate-400">Zero-setup offline persistence saved locally to disk.</p>
            </div>
          </div>

          {/* Supabase Credential Fields */}
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  Supabase Project URL
                </span>
                <span className="text-[10px] text-slate-500">Found in Project Settings &gt; API</span>
              </label>
              <input
                type="text"
                placeholder="https://your-project-id.supabase.co"
                value={supabaseSettings.supabaseUrl || ''}
                onChange={(e) => setSupabaseSettings({ supabaseUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  Supabase Anon Key (Public Key)
                </span>
                <span className="text-[10px] text-slate-500">Public browser client key</span>
              </label>
              <div className="relative">
                <input
                  type={showSupabaseAnonKey ? 'text' : 'password'}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseSettings.supabaseAnonKey || ''}
                  onChange={(e) => setSupabaseSettings({ supabaseAnonKey: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSupabaseAnonKey(!showSupabaseAnonKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showSupabaseAnonKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  Supabase Service Role Key (Optional / Backend Only)
                </span>
                <span className="text-[10px] text-slate-500">For administrative operations</span>
              </label>
              <div className="relative">
                <input
                  type={showSupabaseServiceKey ? 'text' : 'password'}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service_role)"
                  value={supabaseSettings.supabaseServiceRoleKey || ''}
                  onChange={(e) => setSupabaseSettings({ supabaseServiceRoleKey: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSupabaseServiceKey(!showSupabaseServiceKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showSupabaseServiceKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                onClick={handleTestSupabase}
                disabled={isTestingSupabase}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition disabled:opacity-50"
              >
                <Activity className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin text-emerald-400' : ''}`} />
                {isTestingSupabase ? 'Pinging Supabase...' : 'Test Supabase Connection'}
              </button>

              {supabaseTestResult && (
                <div
                  className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border ${
                    supabaseTestResult.connected
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {supabaseTestResult.connected ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>
                    {supabaseTestResult.message} {supabaseTestResult.latencyMs > 0 && `(${supabaseTestResult.latencyMs}ms)`}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                Database Migration Instructions:
              </div>
              <div>
                When connecting a new Supabase project, execute the SQL migration script located at{' '}
                <code className="text-emerald-400 font-mono">packages/database/migrations/001_phase1_schema.sql</code>{' '}
                in your Supabase SQL Editor to initialize all tables and Row Level Security policies.
              </div>
            </div>

            {/* Optional Custom API Endpoint */}
            <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  Backend API Endpoint (Optional)
                </span>
                <span className="text-[10px] text-slate-500">
                  Default: Auto-Detect (same-origin / relative)
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. https://your-backend.railway.app/api or leave blank for auto-detect"
                value={customApiUrl}
                onChange={(e) => {
                  setCustomApiUrl(e.target.value);
                  if (typeof localStorage !== 'undefined') {
                    if (e.target.value.trim()) {
                      localStorage.setItem('studio_custom_api_url', e.target.value.trim());
                    } else {
                      localStorage.removeItem('studio_custom_api_url');
                    }
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
