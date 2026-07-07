export const env = {
  geoapifyApiKey: import.meta.env.VITE_GEOAPIFY_API_KEY as string | undefined,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  aiApiKey: import.meta.env.VITE_AI_API_KEY as string | undefined,
  aiProvider: (import.meta.env.VITE_AI_PROVIDER as string | undefined) ?? "openai",
};

export const hasGeoapify = Boolean(env.geoapifyApiKey);
export const hasSupabase = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const hasAI = Boolean(env.aiApiKey);
