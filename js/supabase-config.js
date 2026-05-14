const SUPABASE_URL = 'https://rfljopmxtxuwfikbwhoa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbGpvcG14dHh1d2Zpa2J3aG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTM5MDMsImV4cCI6MjA5NDMyOTkwM30.Xex_ve-NBDY-4GlsbIUqn4Lfr6XP4_XK8GvG6mMhOWE';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
