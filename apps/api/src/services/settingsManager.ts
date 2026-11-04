import fs from 'fs';
import path from 'path';
import { StudioSettingsPayload } from '@studio/types';
import { getDatabaseRepository, SupabaseConfig } from '@studio/database';

interface StoredRuntimeSettings {
  ai?: {
    provider?: string;
    model?: string;
    apiKey?: string;
    baseUrl?: string;
    mockAi?: boolean;
  };
  voice?: {
    provider?: string;
    apiKey?: string;
    baseUrl?: string;
    defaultVoiceId?: string;
    mockVoice?: boolean;
  };
  database?: {
    mode?: 'dev' | 'supabase';
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    supabaseServiceRoleKey?: string;
  };
}

class SettingsManager {
  private filePath: string;
  private settings: StoredRuntimeSettings = {};

  constructor() {
    this.filePath = path.resolve(process.cwd(), '.temp', 'runtime_settings.json');
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.settings = JSON.parse(raw);
        this.applyToEnvironment();
      }
    } catch (err) {
      console.warn('[SettingsManager] Could not read runtime settings file:', err);
    }
  }

  private save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[SettingsManager] Could not save runtime settings file:', err);
    }
  }

  private applyToEnvironment(): void {
    if (this.settings.ai) {
      if (this.settings.ai.provider) process.env.AI_PROVIDER = this.settings.ai.provider;
      if (this.settings.ai.model) {
        process.env.OPENROUTER_DEFAULT_MODEL = this.settings.ai.model;
        process.env.OPENAI_DEFAULT_MODEL = this.settings.ai.model;
        process.env.ANTHROPIC_DEFAULT_MODEL = this.settings.ai.model;
      }
      if (this.settings.ai.mockAi !== undefined) process.env.MOCK_AI = String(this.settings.ai.mockAi);

      if (this.settings.ai.apiKey) {
        if (this.settings.ai.provider === 'openai') {
          process.env.OPENAI_API_KEY = this.settings.ai.apiKey;
        } else if (this.settings.ai.provider === 'anthropic') {
          process.env.ANTHROPIC_API_KEY = this.settings.ai.apiKey;
        } else {
          process.env.OPENROUTER_API_KEY = this.settings.ai.apiKey;
        }
      }
      if (this.settings.ai.baseUrl) {
        if (this.settings.ai.provider === 'openai') {
          process.env.OPENAI_BASE_URL = this.settings.ai.baseUrl;
        } else {
          process.env.OPENROUTER_BASE_URL = this.settings.ai.baseUrl;
        }
      }
    }

    if (this.settings.voice) {
      if (this.settings.voice.provider) process.env.VOICE_PROVIDER = this.settings.voice.provider;
      if (this.settings.voice.apiKey) process.env.AI33_API_KEY = this.settings.voice.apiKey;
      if (this.settings.voice.baseUrl) process.env.AI33_BASE_URL = this.settings.voice.baseUrl;
      if (this.settings.voice.defaultVoiceId) process.env.AI33_DEFAULT_VOICE_ID = this.settings.voice.defaultVoiceId;
      if (this.settings.voice.mockVoice !== undefined) process.env.MOCK_VOICE = String(this.settings.voice.mockVoice);
    }

    if (this.settings.database) {
      if (this.settings.database.mode === 'supabase') {
        if (this.settings.database.supabaseUrl) process.env.SUPABASE_URL = this.settings.database.supabaseUrl;
        if (this.settings.database.supabaseAnonKey) process.env.SUPABASE_ANON_KEY = this.settings.database.supabaseAnonKey;
        if (this.settings.database.supabaseServiceRoleKey) {
          process.env.SUPABASE_SERVICE_ROLE_KEY = this.settings.database.supabaseServiceRoleKey;
        }
        // Reinitialize database repository with fresh credentials
        getDatabaseRepository(
          {
            supabaseUrl: this.settings.database.supabaseUrl,
            supabaseAnonKey: this.settings.database.supabaseAnonKey,
            supabaseServiceRoleKey: this.settings.database.supabaseServiceRoleKey,
          },
          true
        );
      } else if (this.settings.database.mode === 'dev') {
        // Force fallback
        getDatabaseRepository(
          {
            supabaseUrl: 'placeholder',
            supabaseAnonKey: 'placeholder',
          },
          true
        );
      }
    }
  }

  updateSettings(payload: StudioSettingsPayload): StoredRuntimeSettings {
    if (payload.ai) {
      this.settings.ai = {
        ...this.settings.ai,
        ...payload.ai,
      };
    }

    if (payload.voice) {
      this.settings.voice = {
        ...this.settings.voice,
        ...payload.voice,
      };
    }

    if (payload.database) {
      this.settings.database = {
        ...this.settings.database,
        ...payload.database,
      };
    }

    this.applyToEnvironment();
    this.save();
    return this.settings;
  }

  getSettings(): StoredRuntimeSettings {
    return this.settings;
  }

  getSupabaseConfig(): SupabaseConfig {
    return {
      supabaseUrl: this.settings.database?.supabaseUrl || process.env.SUPABASE_URL,
      supabaseAnonKey: this.settings.database?.supabaseAnonKey || process.env.SUPABASE_ANON_KEY,
      supabaseServiceRoleKey: this.settings.database?.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
  }
}

export const settingsManager = new SettingsManager();

