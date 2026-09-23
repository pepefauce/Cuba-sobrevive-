import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://exvwuqfjfuufrcgxgqut.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_SULVDPEx6yBxO08YwMYvbw_UywovBrq'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
