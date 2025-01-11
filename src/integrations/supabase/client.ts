import { createClient } from '@supabase/supabase-js';

// Use the project ID from the Supabase configuration
const supabaseUrl = 'https://dlspsnjhpmzwxfjajsoa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsc3BzbmpocG16d3hmamFqc29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4NzI5ODAsImV4cCI6MjAyMjQ0ODk4MH0.0oEzfVhPYPH9WxEzGPaVRrqZtHKQ-0fZa4Y5yxvZhVY';

// Remove any trailing colons from the URL
const sanitizedUrl = supabaseUrl.replace(/:$/, '');

export const supabase = createClient(sanitizedUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});