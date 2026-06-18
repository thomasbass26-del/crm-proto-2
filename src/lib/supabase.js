// Supabase client for Triskope.
//
// The URL and PUBLISHABLE key below are intentionally embedded
// in the browser bundle. Supabase publishable keys are designed
// to be public — all access control is enforced server-side by
// the Row Level Security policies in supabase/schema.sql.
// Never put a sb_secret_... key in this file.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ypvytuvahfqypngqcnaf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_l1-T_COIeyLsDA33jzlXFw_OHcw6XBS";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
