const SUPABASE_URL = 'https://jyzgoapsusmdlcoayeht.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5emdvYXBzdXNtZGxjb2F5ZWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MTQyNTEsImV4cCI6MjA5NDE5MDI1MX0.pOQ1RYsbdIaA4mf8vkH2eAsLj7D3UquNijcqclsRC6Y';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
