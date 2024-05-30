import { createClient } from "@supabase/supabase-js"

export function supabase() {
    const supabaseUrl = process.env.DB_URL
    const supabaseKey = process.env.DB_KEY
    const supabase = createClient(supabaseUrl, supabaseKey)

    if(supabase == null) {
        console.log('database error');
        return null
    }

    return supabase
}