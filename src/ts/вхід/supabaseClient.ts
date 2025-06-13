import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://eksifjzzszcqsufwcbsx.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrc2lmanp6c3pjcXN1ZndjYnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NTM4MjQsImV4cCI6MjA2MzEyOTgyNH0.DasUDBuPKtxwU45ayVi4quuI1frorf6QqlRREgjTANw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
