import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Database = {
  public: {
    Tables: {
      users: {
        Columns: {
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
      }
    }
  }
}

export type Json =
  string | number | boolean | null | {
    [key: string]: Json
  } | Json[]

export type DatabaseJson = Database['public']['Tables']

export type SupabaseClient = typeof supabase

