const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

const testConnection = async () => {
  if (!supabaseAdmin) {
    console.warn('Database not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    return;
  }

  try {
    const { error } = await supabaseAdmin.from('users').select('count').limit(1);
    if (error) {
      console.error('Database connection failed:', error.message);
    } else {
      console.log('Database connected successfully');
    }
  } catch (err) {
    console.error('Database connection error:', err.message);
  }
};

module.exports = { supabase, supabaseAdmin, testConnection };
