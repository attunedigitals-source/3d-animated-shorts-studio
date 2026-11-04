import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
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
