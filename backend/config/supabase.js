import { createClient } from '@supabase/supabase-js';

const isSupabaseMode = () => (process.env.DB_PROVIDER || '').toLowerCase() === 'supabase';

let supabaseClient = null;

const createSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when DB_PROVIDER=supabase');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export const getSupabaseClient = () => {
  if (!isSupabaseMode()) {
    throw new Error('Supabase client requested while DB_PROVIDER is not set to supabase');
  }

  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }

  return supabaseClient;
};

export const checkSupabaseHealth = async () => {
  try {
    const supabase = getSupabaseClient();

    // Lightweight probe; requires the users table from the migration schema.
    const { error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      return {
        status: 'unhealthy',
        details: error.message
      };
    }

    return {
      status: 'connected'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: error.message
    };
  }
};
