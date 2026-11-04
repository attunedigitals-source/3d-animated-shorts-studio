import { createClient, SupabaseClient } from '@supabase/supabase-js';

export { createClient, SupabaseClient };

export interface SupabaseConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
}

export async function testSupabaseConnection(config: SupabaseConfig): Promise<{ connected: boolean; message: string; latencyMs: number }> {
  const url = config.supabaseUrl || process.env.SUPABASE_URL;
  const key = config.supabaseAnonKey || config.supabaseServiceRoleKey || process.env.SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('your-project-id') || key.includes('placeholder')) {
    return {
      connected: false,
      message: 'Supabase URL or Key is missing or placeholder.',
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
        message: `Supabase returned error: ${error.message}`,
        latencyMs: latency,
      };
    }

    return {
      connected: true,
      message: 'Successfully reached Supabase cloud endpoint and verified API key.',
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

export function isSupabaseConfigured(config?: SupabaseConfig): boolean {
  const url = config?.supabaseUrl || process.env.SUPABASE_URL;
  const anonKey = config?.supabaseAnonKey || process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;
  if (url.includes('your-project-id') || anonKey.includes('placeholder')) return false;
  return true;
}

export function createSupabaseBrowserClient(config?: SupabaseConfig): SupabaseClient | null {
  const url = config?.supabaseUrl || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = config?.supabaseAnonKey || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey || url.includes('your-project-id') || anonKey.includes('placeholder')) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export function createSupabaseServerClient(config?: SupabaseConfig): SupabaseClient | null {
  const url = config?.supabaseUrl || process.env.SUPABASE_URL;
  const serviceKey = config?.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !serviceKey || url.includes('your-project-id') || serviceKey.includes('placeholder')) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
