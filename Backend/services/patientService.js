const { supabaseAdmin } = require('../config/db');

const makeError = (message, status = 400, code) => ({ message, status, code });

const getPatientById = async (patientId) => {
  return supabaseAdmin.from('patients').select('*').eq('id', patientId).maybeSingle();
};

const getPatientHistory = async (patientId, role) => {
  const patientResult = await getPatientById(patientId);

  if (patientResult.error) {
    return { data: null, error: patientResult.error };
  }

  if (!patientResult.data) {
    return { data: null, error: makeError('Patient not found', 404) };
  }

  const historyQueries = [
    supabaseAdmin.from('appointments').select('*').eq('patient_id', patientId).order('start_time', { ascending: false }),
    supabaseAdmin.from('treatments').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
    supabaseAdmin.from('prescriptions').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
  ];

  const [appointmentsResult, treatmentsResult, prescriptionsResult] = await Promise.all(historyQueries);

  const clinicalError = [appointmentsResult, treatmentsResult, prescriptionsResult].find((result) => result.error);

  if (clinicalError) {
    return { data: null, error: clinicalError.error };
  }

  const baseHistory = {
    patient: patientResult.data,
    appointments: appointmentsResult.data || [],
    treatments: treatmentsResult.data || [],
    prescriptions: prescriptionsResult.data || [],
  };

  if (role === 'receptionist') {
    return {
      data: baseHistory,
      error: null,
    };
  }

  const [invoicesResult, paymentsResult] = await Promise.all([
    supabaseAdmin.from('invoices').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
    supabaseAdmin
      .from('payments')
      .select('*, invoices!inner(patient_id)')
      .eq('invoices.patient_id', patientId)
      .order('payment_date', { ascending: false }),
  ]);

  const firstError = [invoicesResult, paymentsResult].find((result) => result.error);

  if (firstError) {
    return { data: null, error: firstError.error };
  }

  return {
    data: {
      ...baseHistory,
      invoices: invoicesResult.data || [],
      payments: (paymentsResult.data || []).map(({ invoices, ...payment }) => payment),
    },
    error: null,
  };
};

module.exports = { getPatientHistory };
