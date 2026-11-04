import { IDatabaseRepository } from './repository';
import { DevDatabaseRepository } from './dev-repository';
import { SupabaseDatabaseRepository } from './supabase-repository';
import { createSupabaseServerClient, isSupabaseConfigured, SupabaseConfig } from './client';

export * from './client';
export * from './repository';
export * from './dev-repository';
export * from './supabase-repository';

let cachedRepo: IDatabaseRepository | null = null;

export function getDatabaseRepository(config?: SupabaseConfig, forceFresh = false): IDatabaseRepository {
  if (cachedRepo && !forceFresh) {
    return cachedRepo;
  }

  if (isSupabaseConfigured(config)) {
    const client = createSupabaseServerClient(config);
    if (client) {
      console.log('[Database] Initialized Supabase PostgreSQL Repository');
      cachedRepo = new SupabaseDatabaseRepository(client);
      return cachedRepo;
    }
  }

  console.log('[Database] Supabase credentials not found or placeholder — Initialized Local Development Repository');
  cachedRepo = new DevDatabaseRepository();
  return cachedRepo;
}
