import { isLive, supabase } from './supabase';
import { useApp } from './store';
import { Account, Category, Role } from './types';
import { LatLng, geocodeAddress } from './geo';
import { stopLive, startLive } from './live';

export interface SignUpInput {
  role: 'customer' | 'driver' | 'store';
  name: string; // display name (store: the store's name)
  email: string;
  password: string;
  phone?: string;
  address?: string;
  vehicle?: string;
  plate?: string;
  categories?: Category[]; // store only
}

const today = () => new Date().toISOString().slice(0, 10);

/* ---------- profile + role-row provisioning ---------- */

type AuthUser = { id: string; email?: string; user_metadata?: Record<string, unknown> };

/** Create the profiles row on first sign-in (also covers the
 *  email-confirmation flow where signUp returns no session). */
async function ensureProfile(user: AuthUser) {
  const sb = supabase();
  const { data } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (data) return data;
  const meta = user.user_metadata ?? {};
  const role: Role = ['customer', 'driver', 'store'].includes(meta.role as Role)
    ? (meta.role as Role)
    : 'customer';
  const { data: created, error } = await sb
    .from('profiles')
    .insert({ id: user.id, role, name: (meta.name as string) ?? '' })
    .select()
    .single();
  if (error) throw error;
  return created;
}

/** Create the row in customers/drivers/stores on first sign-in. */
async function ensureRoleRow(user: AuthUser, role: Role, name: string) {
  const sb = supabase();
  const meta = user.user_metadata ?? {};
  if (role === 'customer') {
    const { data } = await sb.from('customers').select('*').eq('id', user.id).maybeSingle();
    if (data) return data;
    const row = {
      id: user.id,
      name,
      email: user.email ?? '',
      phone: (meta.phone as string) ?? '',
      address: (meta.address as string) ?? '',
      pos_x: 50,
      pos_y: 50,
      lat: (meta.lat as number) ?? null,
      lng: (meta.lng as number) ?? null,
      age_verified: true, // signup form requires the 21+ attestation
      joined: today(),
      status: 'active',
    };
    await sb.from('customers').insert(row);
    return row;
  }
  if (role === 'driver') {
    const { data } = await sb.from('drivers').select('*').eq('id', user.id).maybeSingle();
    if (data) return data;
    const row = {
      id: user.id,
      name,
      vehicle: (meta.vehicle as string) ?? '',
      plate: (meta.plate as string) ?? '',
      phone: (meta.phone as string) ?? '',
      verified: false, // pending admin verification
      online: false,
    };
    await sb.from('drivers').insert(row);
    return row;
  }
  if (role === 'store') {
    const { data } = await sb.from('stores').select('*').eq('id', user.id).maybeSingle();
    if (data) return data;
    const row = {
      id: user.id,
      name,
      categories: (meta.categories as string[]) ?? [],
      address: (meta.address as string) ?? '',
      phone: (meta.phone as string) ?? '',
      lat: (meta.lat as number) ?? null,
      lng: (meta.lng as number) ?? null,
      approved: false, // pending admin approval
      open: false,
    };
    await sb.from('stores').insert(row);
    return row;
  }
  return null;
}

export async function loadAccount(user: AuthUser) {
  try {
    const profile = await ensureProfile(user);
    const role = profile.role as Role;
    const name = (profile.name as string) || (user.user_metadata?.name as string) || '';
    const row = await ensureRoleRow(user, role, name);
    const account: Account = {
      userId: user.id,
      role,
      name,
      email: user.email ?? '',
    };
    if (role === 'customer' && row) {
      account.address = row.address ?? '';
      account.pos = { x: row.pos_x ?? 50, y: row.pos_y ?? 50 };
      account.latLng = row.lat != null ? { lat: row.lat, lng: row.lng } : undefined;
    }
    if (role === 'driver' && row) {
      account.verified = row.verified ?? false;
      account.vehicle = row.vehicle ?? '';
      account.plate = row.plate ?? '';
      useApp.setState({ driverOnline: row.online ?? false });
    }
    if (role === 'store' && row) {
      account.approved = row.approved ?? false;
      account.address = row.address ?? '';
      account.latLng = row.lat != null ? { lat: row.lat, lng: row.lng } : undefined;
    }
    useApp.getState().setAccount(account);
  } catch (e) {
    console.warn('[sipdash] loadAccount failed:', e);
  }
}

/* ---------- public API ---------- */

let listenerBound = false;

/** Resolve the current session and keep the account in sync with auth events. */
export async function initSession() {
  if (!isLive()) {
    useApp.setState({ authReady: true });
    return;
  }
  const sb = supabase();
  if (!listenerBound) {
    listenerBound = true;
    sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        stopLive();
        useApp.getState().setAccount(null);
        void startLive(); // signed-out guests keep browsing the public catalog
        return;
      }
      if (
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
        session?.user &&
        useApp.getState().account?.userId !== session.user.id
      ) {
        void loadAccount(session.user);
      }
    });
  }
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (session?.user && useApp.getState().account?.userId !== session.user.id) {
    await loadAccount(session.user);
  }
  useApp.setState({ authReady: true });
}

/** Returns an error message, or null on success. */
export async function signIn(email: string, password: string): Promise<string | null> {
  if (!isLive()) return 'Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.';
  const { error } = await supabase().auth.signInWithPassword({ email, password });
  return error?.message ?? null;
}

/** Returns an error/info message, or null on success. */
export async function signUp(input: SignUpInput): Promise<string | null> {
  if (!isLive()) return 'Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.';
  if (input.password.length < 6) return 'Password must be at least 6 characters.';
  // resolve the typed address to real coords — falls back to null (grid sim
  // keeps working) if the geocoder can't place it
  const geo: LatLng | null = input.address ? await geocodeAddress(input.address) : null;
  const { data, error } = await supabase().auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        role: input.role,
        name: input.name,
        phone: input.phone ?? '',
        address: input.address ?? '',
        vehicle: input.vehicle ?? '',
        plate: input.plate ?? '',
        categories: input.categories ?? [],
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
      },
    },
  });
  if (error) return error.message;
  if (!data.session) return 'Account created — check your email to confirm it, then sign in.';
  if (data.user) await loadAccount(data.user);
  return null;
}

export async function signOut() {
  stopLive();
  if (isLive()) await supabase().auth.signOut();
  useApp.getState().setAccount(null);
}
