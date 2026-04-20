const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testConnection = async () => {
  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('Database connection failed:', error.message);
    } else {
      console.log('Database connected successfully');
    }
  } catch (err) {
    console.error('Database connection error:', err.message);
  }
};

module.exports = { supabase, testConnection };
