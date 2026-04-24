const { supabase, supabaseAdmin } = require('../config/db');

const allowedRoles = ['admin', 'doctor', 'receptionist'];

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const makeError = (message, status = 400) => ({ message, status });

const requireAdminClient = () => {
  if (!supabaseAdmin) {
    return {
      error: makeError('Supabase service role key is not configured on the backend', 500),
    };
  }

  return { error: null };
};

const buildProfile = ({ id, email, role, first_name, last_name }) => ({
  id,
  email,
  first_name: first_name || email.split('@')[0],
  last_name: last_name || role,
  role,
});

const fetchProfile = async (userId) => {
  const adminClient = requireAdminClient();

  if (adminClient.error) {
    return { data: null, error: adminClient.error };
  }

  return supabaseAdmin.from('users').select('id, email, first_name, last_name, role, is_active').eq('id', userId).single();
};

const ensureProfileDoesNotExist = async ({ id, email }) => {
  const existingById = await supabaseAdmin.from('users').select('id').eq('id', id).maybeSingle();

  if (existingById.error) {
    return existingById;
  }

  if (existingById.data) {
    return { data: existingById.data, error: null };
  }

  return supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle();
};

const signup = async ({ email, password, role, first_name, last_name }) => {
  const adminClient = requireAdminClient();

  if (adminClient.error) {
    return { data: null, error: adminClient.error };
  }

  const normalizedRole = normalizeRole(role);

  if (!allowedRoles.includes(normalizedRole)) {
    return { data: null, error: makeError('Invalid role. Use admin, doctor, or receptionist.', 422) };
  }

  const authResult = await supabase.auth.signUp({ email, password });

  if (authResult.error) {
    return authResult;
  }

  const user = authResult.data.user;
  let profile = null;

  if (user) {
    const existingProfile = await ensureProfileDoesNotExist({ id: user.id, email });

    if (existingProfile.error) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      return { data: null, error: existingProfile.error };
    }

    if (existingProfile.data) {
      return {
        data: null,
        error: makeError('A profile already exists for this user or email', 409),
      };
    }

    const profilePayload = buildProfile({
      id: user.id,
      email,
      role: normalizedRole,
      first_name,
      last_name,
    });

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .insert(profilePayload)
      .select('id, email, first_name, last_name, role, is_active')
      .single();

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      return {
        data: null,
        error: makeError(`Signup profile creation failed: ${profileError.message}`, 500),
      };
    }

    profile = profileData;
  }

  return {
    data: {
      user,
      session: authResult.data.session,
      profile,
    },
    error: null,
  };
};

const login = async ({ email, password }) => {
  const authResult = await supabase.auth.signInWithPassword({ email, password });

  if (authResult.error) {
    return authResult;
  }

  const user = authResult.data.user;
  const profileResult = await fetchProfile(user.id);

  if (profileResult.error) {
    return { data: authResult.data, error: profileResult.error };
  }

  return {
    data: {
      user,
      session: authResult.data.session,
      profile: profileResult.data,
      role: profileResult.data.role,
    },
    error: null,
  };
};

const getUserByToken = async (token) => {
  return supabase.auth.getUser(token);
};

module.exports = { allowedRoles, fetchProfile, getUserByToken, login, signup };
