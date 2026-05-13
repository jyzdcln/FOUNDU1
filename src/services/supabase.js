import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qyfmsscqlewnqvfsyahx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5Zm1zc2NxbGV3bnF2ZnN5YWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDA2NzMsImV4cCI6MjA5MzUxNjY3M30.gHZDHEG548_gXHDGM6JHU4Oplzemp-wXlRu9cUuXVWU';

export const supabase = createClient(supabaseUrl, supabaseKey);