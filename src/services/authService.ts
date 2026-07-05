import { requireSupabase, supabase } from "@/lib/supabaseClient";
import { hasSupabase } from "@/lib/env";

export class AuthError extends Error {}

export async function signUp(email: string, password: string, displayName: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw new AuthError(error.message);

  if (data.user) {
    await client
      .from("profiles")
      .upsert({ user_id: data.user.id, display_name: displayName }, { onConflict: "user_id" });
  }
  return data;
}

export async function signIn(email: string, password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new AuthError(error.message);
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new AuthError(error.message);
}

export async function getCurrentSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export { hasSupabase as isAuthConfigured };
