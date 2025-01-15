import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://dlspsnjhpmzwxfjajsoa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsc3BzbmpocG16d3hmamFqc29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMzg4MDYsImV4cCI6MjA1MTgxNDgwNn0.qpGbi5uvotNyrzCpdWZb4u4w4WqJMclou_zuXEhpvzw";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);