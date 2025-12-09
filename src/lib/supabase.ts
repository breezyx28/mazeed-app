
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: localStorage,
      storageKey: 'mazeed-auth',
      flowType: 'pkce'
    }
  }
);

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          price: number;
          // ... add other fields as needed for strict typing
        };
      };
      // ... other tables
    };
  };
};
