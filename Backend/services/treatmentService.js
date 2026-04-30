const { supabaseAdmin } = require('../config/db');
const invoiceService = require('./invoiceService');
const { pick } = require('../utils/requestUtils');

const treatmentFields = [
  'appointment_id',
  'patient_id',
  'doctor_id',
  'tooth_number',
  'procedure_name',
  'clinical_notes',
  'procedure_cost',
  'status',
];

const create = async (body) => {
  const treatmentResult = await supabaseAdmin.from('treatments').insert(pick(body, treatmentFields)).select().single();

  if (treatmentResult.error) {
    return treatmentResult;
  }

  if (treatmentResult.data.status === 'completed') {
    const invoiceResult = await invoiceService.createInvoiceForCompletedTreatment(treatmentResult.data);

    if (invoiceResult.error) {
      return { data: { treatment: treatmentResult.data }, error: invoiceResult.error };
    }

    return {
      data: {
        treatment: treatmentResult.data,
        invoice: invoiceResult.data,
      },
      error: null,
    };
  }

  return { data: treatmentResult.data, error: null };
};

const update = async (treatmentId, body) => {
  const treatmentResult = await supabaseAdmin
    .from('treatments')
    .update(pick(body, treatmentFields))
    .eq('id', treatmentId)
    .select()
    .single();

  if (treatmentResult.error) {
    return treatmentResult;
  }

  if (treatmentResult.data.status === 'completed') {
    const invoiceResult = await invoiceService.createInvoiceForCompletedTreatment(treatmentResult.data);

    if (invoiceResult.error) {
      return { data: { treatment: treatmentResult.data }, error: invoiceResult.error };
    }

    return {
      data: {
        treatment: treatmentResult.data,
        invoice: invoiceResult.data,
      },
      error: null,
    };
  }

  return { data: treatmentResult.data, error: null };
};

module.exports = { create, update };
