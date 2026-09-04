import { createClient } from "@supabase/supabase-js";

// A second, isolated Supabase client used ONLY for creating new customer
// logins from inside the app. It's completely separate from the main app's
// session (different storage key, nothing persisted) so calling signUp()
// here can never log the current staff member out or switch their session.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const authHelperClient = createClient(url, key, {
  auth: {
    storageKey: "kzmall-customer-signup-helper",
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
