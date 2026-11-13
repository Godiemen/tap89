import { createClient, SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** true when Supabase env vars are configured — apps run in live mode.
 *  Requires a real *.supabase.co URL so the placeholder doesn't connect. */
export const isLive = () => URL.includes('.supabase.co') && ANON.length > 20;

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(URL, ANON, {
      realtime: { params: { eventsPerSecond: 20 } },
    });
  }
  return client;
}
