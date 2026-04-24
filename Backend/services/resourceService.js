const { supabaseAdmin } = require('../config/db');
const { pick } = require('../utils/requestUtils');

const filterableFields = [
  'id',
  'role',
  'status',
  'patient_id',
  'doctor_id',
  'appointment_id',
  'treatment_id',
  'invoice_id',
];

const list = async (resource, options, filters) => {
  let query = supabaseAdmin.from(resource).select('*');

  Object.entries(filters).forEach(([key, value]) => {
    if (options.mutable.includes(key) || filterableFields.includes(key)) {
      query = query.eq(key, value);
    }
  });

  return query.order(options.orderBy, { ascending: false });
};

const getById = async (resource, id) => {
  return supabaseAdmin.from(resource).select('*').eq('id', id).single();
};

const create = async (resource, options, body) => {
  return supabaseAdmin.from(resource).insert(pick(body, options.mutable)).select().single();
};

const update = async (resource, options, id, body) => {
  return supabaseAdmin.from(resource).update(pick(body, options.mutable)).eq('id', id).select().single();
};

const remove = async (resource, id) => {
  return supabaseAdmin.from(resource).delete().eq('id', id).select().single();
};

module.exports = { create, getById, list, remove, update };
