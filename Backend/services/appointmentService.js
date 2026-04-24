const { supabaseAdmin } = require('../config/db');
const { pick } = require('../utils/requestUtils');

const appointmentFields = [
  'patient_id',
  'doctor_id',
  'start_time',
  'end_time',
  'appointment_time',
  'reason_for_visit',
  'status',
];

const normalizeAppointmentPayload = (body) => {
  const payload = pick(body, appointmentFields);

  if (!payload.start_time && payload.appointment_time) {
    payload.start_time = payload.appointment_time;
  }

  if (!payload.appointment_time && payload.start_time) {
    payload.appointment_time = payload.start_time;
  }

  return payload;
};

const parseIsoTime = (value, fieldName) => {
  const date = new Date(value);

  if (!value || Number.isNaN(date.getTime())) {
    return { error: { message: `${fieldName} must be a valid ISO timestamp` } };
  }

  return { date };
};

const validateTimeRange = ({ start_time, end_time }) => {
  const start = parseIsoTime(start_time, 'start_time');

  if (start.error) {
    return start;
  }

  const end = parseIsoTime(end_time, 'end_time');

  if (end.error) {
    return end;
  }

  if (start.date >= end.date) {
    return { error: { message: 'start_time must be before end_time' } };
  }

  return {
    start: start.date,
    end: end.date,
  };
};

const ensureDoctorExists = async (doctorId) => {
  const result = await supabaseAdmin.from('users').select('id, role').eq('id', doctorId).single();

  if (result.error || !result.data) {
    return { data: null, error: { message: 'Doctor not found' } };
  }

  if (result.data.role !== 'doctor') {
    return { data: null, error: { message: 'doctor_id must reference a user with role doctor' } };
  }

  return result;
};

const findConflictingAppointment = async ({ doctor_id, start_time, end_time, excludeAppointmentId }) => {
  let query = supabaseAdmin
    .from('appointments')
    .select('*')
    .eq('doctor_id', doctor_id)
    .lt('start_time', end_time)
    .gt('end_time', start_time)
    .neq('status', 'cancelled')
    .limit(1);

  if (excludeAppointmentId) {
    query = query.neq('id', excludeAppointmentId);
  }

  const result = await query;

  if (result.error) {
    return result;
  }

  return {
    data: result.data[0] || null,
    error: null,
  };
};

const validateAppointment = async (payload, excludeAppointmentId) => {
  if (!payload.doctor_id) {
    return { error: { message: 'doctor_id is required' } };
  }

  const timeRange = validateTimeRange(payload);

  if (timeRange.error) {
    return timeRange;
  }

  const doctorResult = await ensureDoctorExists(payload.doctor_id);

  if (doctorResult.error) {
    return doctorResult;
  }

  const conflictResult = await findConflictingAppointment({
    doctor_id: payload.doctor_id,
    start_time: timeRange.start.toISOString(),
    end_time: timeRange.end.toISOString(),
    excludeAppointmentId,
  });

  if (conflictResult.error) {
    return conflictResult;
  }

  if (conflictResult.data) {
    return {
      conflict: conflictResult.data,
      error: { message: 'Doctor already has an appointment during this time slot', status: 409 },
    };
  }

  return { data: payload, error: null };
};

const list = async (filters = {}) => {
  let query = supabaseAdmin.from('appointments').select('*');

  Object.entries(filters).forEach(([key, value]) => {
    if (['id', 'patient_id', 'doctor_id', 'status'].includes(key)) {
      query = query.eq(key, value);
    }
  });

  return query.order('start_time', { ascending: false });
};

const getById = async (appointmentId) => {
  return supabaseAdmin.from('appointments').select('*').eq('id', appointmentId).single();
};

const create = async (body) => {
  const payload = normalizeAppointmentPayload(body);
  const validation = await validateAppointment(payload);

  if (validation.error) {
    return validation;
  }

  return supabaseAdmin.from('appointments').insert(payload).select().single();
};

const update = async (appointmentId, body) => {
  const existing = await getById(appointmentId);

  if (existing.error || !existing.data) {
    return existing;
  }

  const payload = normalizeAppointmentPayload(body);
  const merged = {
    ...existing.data,
    ...payload,
  };

  if (payload.doctor_id || payload.start_time || payload.end_time || payload.appointment_time) {
    const validation = await validateAppointment(merged, appointmentId);

    if (validation.error) {
      return validation;
    }
  }

  return supabaseAdmin.from('appointments').update(payload).eq('id', appointmentId).select().single();
};

const remove = async (appointmentId) => {
  return supabaseAdmin.from('appointments').delete().eq('id', appointmentId).select().single();
};

module.exports = {
  create,
  findConflictingAppointment,
  getById,
  list,
  remove,
  update,
  validateAppointment,
};
