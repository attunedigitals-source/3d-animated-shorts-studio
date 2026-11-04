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
} from 'lucide-react';
import { api } from '../../services/api';
import { AIProviderType, TestConnectionResponse } from '@studio/types';

export const SettingsView: React.FC = () => {
  const {
    aiSettings,
    setAiSettings,
    availableModels,
    isSupabaseConfigured,
    setNotification,
  } = useStudioStore();

  const [testResult, setTestResult] = useState<TestConnectionResponse | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const providers: { id: AIProviderType; name: string; desc: string }[] = [
    {
      id: 'openrouter',
      name: 'OpenRouter',
      desc: 'Access Claude 3.5, GPT-4o, Llama 3, and 100+ models with automatic fallbacks.',
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

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testConnection(aiSettings);
      setTestResult(res);
      setNotification({
        type: res.connected ? 'success' : 'error',
        message: res.message,
      });
    } catch (err: any) {
      setTestResult({
        connected: false,
        provider: aiSettings.provider || 'openrouter',
        model: aiSettings.model || 'default',
        latencyMs: 0,
        message: err.message || 'Connection test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-indigo-400" />
          Studio Engine Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure AI reasoning engines, custom models, and database connections.
        </p>
      </div>

      {/* AI Provider Section */}
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
                onClick={() => setAiSettings({ provider: p.id })}
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

        {/* Provider Configuration Fields */}
        <div className="space-y-4 pt-2">
          {/* Model Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Selected Model</span>
              <span className="text-[10px] text-slate-500">Configured model string</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={aiSettings.model}
                onChange={(e) => setAiSettings({ model: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {availableModels.map((m) => (
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

          {/* Custom API Key Input */}
          {aiSettings.provider !== 'mock' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  Override API Key (Optional)
                </span>
                <span className="text-[10px] text-slate-500">
                  Leave blank to use server environment key
                </span>
              </label>
              <input
                type="password"
                placeholder="sk-..."
                value={aiSettings.apiKey || ''}
                onChange={(e) => setAiSettings({ apiKey: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          )}

          {/* Custom Base URL (Useful for local Ollama / LM Studio) */}
          {aiSettings.provider === 'openai' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                Custom Base URL (e.g. for Ollama / vLLM)
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

          {/* Test Connection Button & Result */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-indigo-400' : ''}`} />
              {isTesting ? 'Pinging Provider...' : 'Test Connection'}
            </button>

            {testResult && (
              <div
                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border ${
                  testResult.connected
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                }`}
              >
                {testResult.connected ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>
                  {testResult.message} ({testResult.latencyMs}ms)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Database & Cloud Status */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            Supabase PostgreSQL & Cloud Sync
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

        <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
          {isSupabaseConfigured ? (
            <p className="text-emerald-300 font-medium">
              Supabase cloud database is connected and active. User accounts, projects, stories, scripts, and scenes are securely synchronized to PostgreSQL with Row Level Security.
            </p>
          ) : (
            <div className="space-y-2">
              <p>
                The studio is currently operating in <strong>Local Development Database mode</strong>. All projects, stories, scripts, and 3D scenes are persisted locally on the machine.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-semibold text-slate-300">To enable cloud Supabase:</div>
                <div className="text-[11px] text-slate-400 font-mono">
                  1. Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  2. Apply packages/database/migrations/001_phase1_schema.sql in your Supabase dashboard
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
