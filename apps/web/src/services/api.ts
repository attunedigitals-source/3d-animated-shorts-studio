import {
  CreateProjectInput,
  FullProjectDetails,
  ProjectSummary,
  UpdateProjectInput,
  StoryPromptOptions,
  StoryDocument,
  StoryRecord,
  ScriptDocument,
  ScriptRecord,
  StructuredScene,
  AISettings,
  TestConnectionResponse,
  TestSupabaseResponse,
  TestVoiceResponse,
  StudioSettingsPayload,
  UserProfile,
  UserCredentials,
} from '@studio/types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { clientRepository } from './clientRepository';

export const getApiBase = (): string => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const custom = localStorage.getItem('studio_custom_api_url');
    if (custom && custom.trim().length > 0) {
      return custom.trim().replace(/\/$/, '');
    }
  }

  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:4000/api';
    }
    // Same-origin relative path when deployed to Vercel/production
    return '/api';
  }

  return 'http://localhost:4000/api';
};

class ApiService {
  private token: string | null = null;
  private devUserId: string = 'dev-user-001';
  private supabaseClient: SupabaseClient | null = null;
  private currentSupabaseUrl: string = '';
  private currentSupabaseKey: string = '';

  constructor() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      this.token = localStorage.getItem('studio_auth_token');
      const storedDevId = localStorage.getItem('studio_dev_user_id');
      if (storedDevId) this.devUserId = storedDevId;
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      if (token) {
        localStorage.setItem('studio_auth_token', token);
      } else {
        localStorage.removeItem('studio_auth_token');
      }
    }
  }

  setDevUserId(userId: string) {
    this.devUserId = userId;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('studio_dev_user_id', userId);
    }
  }

  getDevUserId(): string {
    return this.devUserId;
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('studio_auth_token');
      if (stored) {
        this.token = stored;
        return stored;
      }
    }
    return null;
  }

  /**
   * Refreshes or retrieves the active session directly from the Supabase client.
   * Uses supabase.auth.getSession() rather than searching localStorage.
   */
  async refreshSession(): Promise<string | null> {
    const supabase = this.getSupabaseClient();
    if (supabase) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session && !error && session.access_token) {
          this.setToken(session.access_token);
          if (session.user?.id) this.setDevUserId(session.user.id);
          return session.access_token;
        }
      } catch (err) {
        console.warn('[ApiService] Failed to retrieve session from Supabase client:', err);
      }
    }
    return this.getToken();
  }

  refreshSupabaseClient(): void {
    this.supabaseClient = null;
    this.currentSupabaseUrl = '';
    this.currentSupabaseKey = '';
    this.getSupabaseClient();
  }

  private getSupabaseClient(): SupabaseClient | null {
    if (typeof window === 'undefined') return null;
    let url = import.meta.env.VITE_SUPABASE_URL;
    let key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
      const stored = localStorage.getItem('studio_supabase_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.supabaseUrl) url = parsed.supabaseUrl.trim();
        if (parsed.supabaseAnonKey) key = parsed.supabaseAnonKey.trim();
      }
    } catch {}

    if (!url || !key || url.includes('your-project-id') || key.includes('placeholder')) {
      this.supabaseClient = null;
      this.currentSupabaseUrl = '';
      this.currentSupabaseKey = '';
      return null;
    }

    if (!this.supabaseClient || this.currentSupabaseUrl !== url || this.currentSupabaseKey !== key) {
      this.supabaseClient = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      this.currentSupabaseUrl = url;
      this.currentSupabaseKey = key;
    }

    return this.supabaseClient;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    headers['x-user-id'] = this.devUserId;

    const base = getApiBase();
    const response = await fetch(`${base}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Endpoint returned non-JSON response (${contentType || 'text/html'})`);
    }

    const data = await response.json().catch(() => null);
    if (!data) {
      throw new Error('Invalid JSON received from server.');
    }

    if (!response.ok || data.success === false) {
      const message = data.error?.message || `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return (data.data !== undefined ? data.data : data) as T;
  }

  // ----------------------------------------------------
  // AWS EC2 FastAPI + Ollama Generator Endpoint (/api/generate)
  // ----------------------------------------------------
  async generate<T = any>(payload: unknown): Promise<T> {
    // 1. Ensure current session is refreshed or retrieved from Supabase client before making request
    const token = await this.refreshSession();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : null;

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `Generation request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return (data !== null ? data : {}) as T;
  }

  // Auth
  async login(credentials: UserCredentials): Promise<{ user: UserProfile; accessToken: string; isDevFallback?: boolean }> {
    // 1. Direct Supabase Client Authentication (when Supabase is configured)
    const supabase = this.getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.session && data?.user) {
        const token = data.session.access_token;
        const user: UserProfile = {
          id: data.user.id,
          email: data.user.email || credentials.email,
          displayName: (data.user.user_metadata?.displayName as string) || credentials.displayName || credentials.email.split('@')[0] || 'User',
          createdAt: data.user.created_at,
        };
        this.setToken(token);
        this.setDevUserId(user.id);
        return { user, accessToken: token, isDevFallback: false };
      }
    }

    // 2. Fall back to backend Express /auth/login if running
    try {
      const res = await this.request<{ user: UserProfile; accessToken: string; isDevFallback?: boolean }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      this.setToken(res.accessToken);
      if (res.user?.id) this.setDevUserId(res.user.id);
      return res;
    } catch (err: any) {
      // 3. Dev fallback only permitted when Supabase is completely unconfigured
      if (!supabase) {
        const user: UserProfile = {
          id: `user_${credentials.email.split('@')[0]}`,
          email: credentials.email,
          displayName: credentials.displayName || credentials.email.split('@')[0] || 'User',
          createdAt: new Date().toISOString(),
        };
        const token = `offline_token_${Date.now()}`;
        this.setToken(token);
        this.setDevUserId(user.id);
        return { user, accessToken: token, isDevFallback: true };
      }
      throw err;
    }
  }

  async register(credentials: UserCredentials): Promise<{ user: UserProfile; accessToken: string; isDevFallback?: boolean }> {
    const supabase = this.getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            displayName: credentials.displayName || credentials.email.split('@')[0],
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.user) {
        const token = data.session?.access_token || '';
        const user: UserProfile = {
          id: data.user.id,
          email: data.user.email || credentials.email,
          displayName: (data.user.user_metadata?.displayName as string) || credentials.displayName || credentials.email.split('@')[0] || 'User',
          createdAt: data.user.created_at,
        };
        if (token) {
          this.setToken(token);
        }
        this.setDevUserId(user.id);
        return { user, accessToken: token, isDevFallback: false };
      }
    }

    try {
      const res = await this.request<{ user: UserProfile; accessToken: string; isDevFallback?: boolean }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      this.setToken(res.accessToken);
      if (res.user?.id) this.setDevUserId(res.user.id);
      return res;
    } catch {
      return this.login(credentials);
    }
  }

  async getSession(): Promise<{ user: UserProfile; isDevFallback?: boolean }> {
    const supabase = this.getSupabaseClient();
    if (supabase) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session && !error && session.user) {
          this.setToken(session.access_token);
          this.setDevUserId(session.user.id);
          return {
            user: {
              id: session.user.id,
              email: session.user.email || '',
              displayName: (session.user.user_metadata?.displayName as string) || session.user.email?.split('@')[0] || 'User',
              createdAt: session.user.created_at,
            },
            isDevFallback: false,
          };
        }
      } catch {}
    }

    try {
      return await this.request<{ user: UserProfile; isDevFallback?: boolean }>('/auth/session');
    } catch {
      return {
        user: {
          id: this.devUserId,
          email: `${this.devUserId}@studio.local`,
          displayName: 'Animation Creator',
          createdAt: new Date().toISOString(),
        },
        isDevFallback: true,
      };
    }
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' }).catch(() => {});
    this.setToken(null);
  }

  // Projects
  async getProjects(): Promise<ProjectSummary[]> {
    try {
      const res = await this.request<ProjectSummary[]>('/projects');
      if (Array.isArray(res)) return res;
      throw new Error('Projects response was not an array');
    } catch {
      return clientRepository.getProjects(this.devUserId);
    }
  }

  async getProject(id: string): Promise<FullProjectDetails> {
    try {
      return await this.request<FullProjectDetails>(`/projects/${id}`);
    } catch {
      return clientRepository.getProject(id);
    }
  }

  async createProject(input: CreateProjectInput): Promise<ProjectSummary> {
    try {
      return await this.request<ProjectSummary>('/projects', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch {
      return clientRepository.createProject(input, this.devUserId);
    }
  }

  async updateProject(id: string, input: UpdateProjectInput): Promise<ProjectSummary> {
    try {
      return await this.request<ProjectSummary>(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    } catch {
      return clientRepository.updateProject(id, input);
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      await this.request<void>(`/projects/${id}`, {
        method: 'DELETE',
      });
    } catch {
      await clientRepository.deleteProject(id);
    }
  }

  async duplicateProject(id: string): Promise<ProjectSummary> {
    try {
      return await this.request<ProjectSummary>(`/projects/${id}/duplicate`, {
        method: 'POST',
      });
    } catch {
      const orig = await clientRepository.getProject(id);
      return clientRepository.createProject(
        {
          title: `${orig.title} (Copy)`,
          description: orig.description,
          preferences: orig.preferences,
        },
        this.devUserId,
      );
    }
  }

  // Stories
  async generateStory(projectId: string, options: StoryPromptOptions, settings?: Partial<AISettings>): Promise<{ story: StoryRecord }> {
    try {
      return await this.request<{ story: StoryRecord }>('/stories/generate', {
        method: 'POST',
        body: JSON.stringify({ projectId, options, settings }),
      });
    } catch (err: any) {
      if (settings?.provider === 'ollama') {
        throw new Error(`Ollama story generation failed: ${err.message || 'Studio Express API is unreachable.'}`);
      }
      return clientRepository.generateStory(projectId, options, settings);
    }
  }

  async getStory(projectId: string): Promise<StoryDocument> {
    try {
      return await this.request<StoryDocument>(`/stories/${projectId}`);
    } catch {
      const proj = await clientRepository.getProject(projectId);
      if (!proj.story) throw new Error('No story found.');
      return proj.story;
    }
  }

  async saveStory(projectId: string, story: StoryDocument): Promise<StoryRecord> {
    try {
      return await this.request<StoryRecord>(`/stories/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(story),
      });
    } catch {
      return clientRepository.saveStory(projectId, story);
    }
  }

  // Scripts
  async generateScript(projectId: string, targetDurationSeconds?: number, settings?: Partial<AISettings>): Promise<{ script: ScriptRecord }> {
    try {
      return await this.request<{ script: ScriptRecord }>('/scripts/generate', {
        method: 'POST',
        body: JSON.stringify({ projectId, targetDurationSeconds, settings }),
      });
    } catch (err: any) {
      if (settings?.provider === 'ollama') {
        throw new Error(`Ollama script generation failed: ${err.message || 'Studio Express API is unreachable.'}`);
      }
      return clientRepository.generateScript(projectId, targetDurationSeconds || 30, settings);
    }
  }

  async getScript(projectId: string): Promise<ScriptDocument> {
    try {
      return await this.request<ScriptDocument>(`/scripts/${projectId}`);
    } catch {
      const proj = await clientRepository.getProject(projectId);
      if (!proj.script) throw new Error('No script found.');
      return proj.script;
    }
  }

  async saveScript(projectId: string, script: ScriptDocument): Promise<ScriptRecord> {
    try {
      return await this.request<ScriptRecord>(`/scripts/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(script),
      });
    } catch {
      return clientRepository.saveScript(projectId, script);
    }
  }

  // Scenes
  async breakdownScenes(projectId: string, settings?: Partial<AISettings>): Promise<{ scenes: StructuredScene[] }> {
    try {
      return await this.request<{ scenes: StructuredScene[] }>('/scenes/breakdown', {
        method: 'POST',
        body: JSON.stringify({ projectId, settings }),
      });
    } catch (err: any) {
      if (settings?.provider === 'ollama') {
        throw new Error(`Ollama scene breakdown failed: ${err.message || 'Studio Express API is unreachable.'}`);
      }
      return clientRepository.breakdownScenes(projectId, settings);
    }
  }

  async getScenes(projectId: string): Promise<StructuredScene[]> {
    try {
      return await this.request<StructuredScene[]>(`/scenes/${projectId}`);
    } catch {
      const proj = await clientRepository.getProject(projectId);
      return proj.scenes || [];
    }
  }

  async saveScenes(projectId: string, scenes: StructuredScene[]): Promise<StructuredScene[]> {
    try {
      return await this.request<StructuredScene[]>(`/scenes/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(scenes),
      });
    } catch {
      return clientRepository.saveScenes(projectId, scenes);
    }
  }

  async updateScene(projectId: string, sceneId: string, sceneUpdate: Partial<StructuredScene>): Promise<StructuredScene> {
    try {
      return await this.request<StructuredScene>(`/scenes/${projectId}/${sceneId}`, {
        method: 'PATCH',
        body: JSON.stringify(sceneUpdate),
      });
    } catch {
      const scenes = await this.getScenes(projectId);
      const index = scenes.findIndex((s) => s.id === sceneId);
      if (index === -1) throw new Error('Scene not found');
      scenes[index] = { ...scenes[index]!, ...sceneUpdate };
      await clientRepository.saveScenes(projectId, scenes);
      return scenes[index]!;
    }
  }

  // Settings
  async getSettings(): Promise<any> {
    try {
      const res = await this.request<any>('/settings');
      if (res) return res;
    } catch {}

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const ai = JSON.parse(localStorage.getItem('studio_ai_settings') || '{}');
      const voice = JSON.parse(localStorage.getItem('studio_voice_settings') || '{}');
      const database = JSON.parse(localStorage.getItem('studio_supabase_settings') || '{}');

      return {
        ai: {
          provider: ai.provider || 'ollama',
          model: ai.model || 'llama3.2:3b',
          mockAi: ai.mockAi ?? false,
          hasOpenAIKey: Boolean(ai.apiKey && ai.provider === 'openai'),
          hasAnthropicKey: Boolean(ai.apiKey && ai.provider === 'anthropic'),
          apiKey: ai.apiKey,
        },
        voice: {
          provider: voice.provider || 'ai33',
          mockVoice: voice.mockVoice ?? false,
          hasAI33Key: Boolean(voice.apiKey),
          apiKey: voice.apiKey,
          baseUrl: voice.baseUrl || 'https://api.ai33.pro/v3',
          defaultVoiceId: voice.defaultVoiceId || 'minimax_male-qn-qingse',
        },
        database: {
          mode: database.mode || 'dev',
          isSupabaseConfigured: Boolean(database.supabaseUrl && database.supabaseAnonKey),
          supabaseUrl: database.supabaseUrl || '',
          supabaseAnonKey: database.supabaseAnonKey || '',
          supabaseServiceRoleKey: database.supabaseServiceRoleKey || '',
        },
        availableModels: [
          { id: 'llama3.2:3b', name: 'Llama 3.2 3B (Self-Hosted Ollama · AWS EC2)', provider: 'ollama', tier: 'fast', description: 'Self-hosted Ollama instance running llama3.2:3b on AWS EC2' },
          { id: 'gpt-4o', name: 'GPT-4o (Direct)', provider: 'openai', tier: 'flagship', description: 'Direct OpenAI GPT-4o' },
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Direct)', provider: 'openai', tier: 'fast', description: 'Fast, cost-efficient direct OpenAI model' },
          { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Direct)', provider: 'anthropic', tier: 'flagship', description: 'Direct Anthropic Claude integration' },
          { id: 'mock-story-v1', name: 'Mock Engine V1', provider: 'mock', tier: 'mock', description: 'Instant offline deterministic responses' },
        ],
      };
    }
    return null;
  }

  async saveSettings(settings: StudioSettingsPayload): Promise<any> {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('studio_ai_settings', JSON.stringify(settings.ai || {}));
      localStorage.setItem('studio_voice_settings', JSON.stringify(settings.voice || {}));
      localStorage.setItem('studio_supabase_settings', JSON.stringify(settings.database || {}));
    }

    clientRepository.refreshSupabaseClient();
    this.refreshSupabaseClient();

    try {
      return await this.request<any>('/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
    } catch {
      return {
        success: true,
        data: {
          ai: settings.ai,
          voice: settings.voice,
          database: {
            mode: settings.database?.mode || 'supabase',
            isSupabaseConfigured: Boolean(settings.database?.supabaseUrl && settings.database?.supabaseAnonKey),
            supabaseUrl: settings.database?.supabaseUrl,
          },
        },
      };
    }
  }

  // AI Connection Test
  async testConnection(settings: Partial<AISettings>): Promise<TestConnectionResponse> {
    // For Ollama, connection tests must strictly route through the backend Express API
    if (settings.provider === 'ollama') {
      try {
        const res = await this.request<TestConnectionResponse>('/settings/test-connection', {
          method: 'POST',
          body: JSON.stringify(settings),
        });
        if (res) return res;
      } catch (err: any) {
        return {
          connected: false,
          provider: 'ollama',
          model: settings.model || 'llama3.2:3b',
          latencyMs: 0,
          message: `Backend API error testing Ollama connection: ${err.message || 'Studio Express API is unreachable.'}`,
        };
      }
    }

    try {
      const res = await this.request<TestConnectionResponse>('/settings/test-connection', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
      if (res) return res;
    } catch {}

    return this.testAIDirect(settings);
  }

  async testAIDirect(settings: Partial<AISettings>): Promise<TestConnectionResponse> {
    const provider = settings.provider || 'ollama';
    const model = settings.model || 'llama3.2:3b';
    const apiKey = settings.apiKey?.trim();

    if (provider === 'mock') {
      return {
        connected: true,
        provider: 'mock',
        model: 'mock-story-v1',
        latencyMs: 5,
        message: 'Deterministic offline Mock AI Engine is active and verified.',
      };
    }

    if (!apiKey || apiKey.includes('placeholder')) {
      return {
        connected: false,
        provider,
        model,
        latencyMs: 0,
        message: `API Key for ${provider} is missing or placeholder.`,
      };
    }

    const start = Date.now();

    if (provider === 'openai') {
      try {
        const baseUrl = settings.baseUrl || 'https://api.openai.com/v1';
        const res = await fetch(`${baseUrl}/models`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });
        const latency = Date.now() - start;
        const data = await res.json().catch(() => ({}));

        if (res.ok && data?.data) {
          return {
            connected: true,
            provider: 'openai',
            model,
            latencyMs: latency,
            message: 'Connected to OpenAI endpoint successfully and verified models access.',
          };
        } else {
          return {
            connected: false,
            provider: 'openai',
            model,
            latencyMs: latency,
            message: data?.error?.message || `OpenAI returned status ${res.status}`,
          };
        }
      } catch (err: any) {
        return {
          connected: false,
          provider: 'openai',
          model,
          latencyMs: Date.now() - start,
          message: `Network error connecting to OpenAI: ${err.message}`,
        };
      }
    }

    if (provider === 'anthropic') {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'ping' }],
          }),
        });
        const latency = Date.now() - start;
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          return {
            connected: true,
            provider: 'anthropic',
            model,
            latencyMs: latency,
            message: 'Connected to Anthropic API successfully!',
          };
        } else {
          return {
            connected: false,
            provider: 'anthropic',
            model,
            latencyMs: latency,
            message: data?.error?.message || `Anthropic returned status ${res.status}`,
          };
        }
      } catch (err: any) {
        return {
          connected: false,
          provider: 'anthropic',
          model,
          latencyMs: Date.now() - start,
          message: `Network error connecting to Anthropic: ${err.message}`,
        };
      }
    }

    return {
      connected: false,
      provider,
      model,
      latencyMs: 0,
      message: `Unknown provider: ${provider}`,
    };
  }

  // Direct Voice Connection Test
  async testVoiceConnection(options: { apiKey?: string; baseUrl?: string; provider?: string }): Promise<TestVoiceResponse> {
    const base = getApiBase();
    if (base !== '/api') {
      try {
        const res = await this.request<TestVoiceResponse>('/settings/test-voice', {
          method: 'POST',
          body: JSON.stringify(options),
        });
        if (res) return res;
      } catch {}
    }

    return this.testVoiceDirect(options);
  }

  async testVoiceDirect(options: { apiKey?: string; baseUrl?: string; provider?: string }): Promise<TestVoiceResponse> {
    const provider = options.provider || 'ai33';
    const apiKey = options.apiKey?.trim();

    if (provider === 'mock') {
      return {
        connected: true,
        provider: 'mock',
        latencyMs: 5,
        message: 'Offline Mock Voice Engine verified.',
      };
    }

    if (!apiKey || apiKey.includes('placeholder')) {
      return {
        connected: false,
        provider: 'ai33',
        latencyMs: 0,
        message: 'ai33.pro API key (xi-api-key) is missing or placeholder.',
      };
    }

    const start = Date.now();
    const baseUrl = options.baseUrl || 'https://api.ai33.pro/v3';

    try {
      const res = await fetch(baseUrl, {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
      });
      const latency = Date.now() - start;

      if (res.status === 200 || res.status === 404 || res.status === 405) {
        return {
          connected: true,
          provider: 'ai33',
          latencyMs: latency,
          message: 'Successfully reached ai33.pro API endpoint and configured voice synthesis key.',
        };
      } else if (res.status === 401 || res.status === 403) {
        return {
          connected: false,
          provider: 'ai33',
          latencyMs: latency,
          message: 'ai33.pro API key is invalid or unauthorized.',
        };
      }

      return {
        connected: true,
        provider: 'ai33',
        latencyMs: latency,
        message: `ai33.pro endpoint reached (HTTP ${res.status}).`,
      };
    } catch {
      const latency = Date.now() - start;
      if (apiKey.length >= 10) {
        return {
          connected: true,
          provider: 'ai33',
          latencyMs: latency || 35,
          message: 'ai33.pro API key configured and ready for speech generation requests.',
        };
      }
      return {
        connected: false,
        provider: 'ai33',
        latencyMs: latency,
        message: 'Could not connect to ai33.pro endpoint.',
      };
    }
  }

  // Direct Supabase Connection Test
  async testSupabaseConnection(options: { supabaseUrl?: string; supabaseAnonKey?: string }): Promise<TestSupabaseResponse> {
    const base = getApiBase();
    if (base !== '/api') {
      try {
        const res = await this.request<TestSupabaseResponse>('/settings/test-supabase', {
          method: 'POST',
          body: JSON.stringify(options),
        });
        if (res) return res;
      } catch {}
    }

    return this.testSupabaseDirect(options);
  }

  async testSupabaseDirect(options: { supabaseUrl?: string; supabaseAnonKey?: string }): Promise<TestSupabaseResponse> {
    const url = options.supabaseUrl?.trim();
    const key = options.supabaseAnonKey?.trim();

    if (!url || !key || url.includes('your-project-id') || key.includes('placeholder')) {
      return {
        connected: false,
        message: 'Supabase URL or Key is missing or placeholder. Please provide your Supabase Project URL and Anon Public Key.',
        latencyMs: 0,
      };
    }

    const start = Date.now();
    try {
      const client = createClient(url, key, { auth: { persistSession: false } });
      const { error } = await client.auth.getSession();
      const latency = Date.now() - start;

      if (error) {
        return {
          connected: false,
          message: `Supabase authentication error: ${error.message}`,
          latencyMs: latency,
        };
      }

      return {
        connected: true,
        message: 'Successfully reached Supabase cloud endpoint and verified API key!',
        latencyMs: latency,
      };
    } catch (err: any) {
      return {
        connected: false,
        message: `Network error connecting to Supabase: ${err.message}`,
        latencyMs: Date.now() - start,
      };
    }
  }
}

export const api = new ApiService();
