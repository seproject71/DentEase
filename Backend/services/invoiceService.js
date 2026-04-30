const { supabaseAdmin } = require('../config/db');

const toMoney = (value) => Number(Number(value || 0).toFixed(2));

const getById = async (invoiceId) => {
  return supabaseAdmin.from('invoices').select('*').eq('id', invoiceId).single();
};

const getByTreatmentId = async (treatmentId) => {
  return supabaseAdmin.from('invoices').select('*').eq('treatment_id', treatmentId).maybeSingle();
};

const calculateInvoiceFields = ({ total_amount, discount = 0, paid_amount = 0 }) => {
  const total = toMoney(total_amount);
  const discountAmount = toMoney(discount);
  const paid = toMoney(paid_amount);
  const netAmount = toMoney(total - discountAmount);
  const remaining = toMoney(Math.max(netAmount - paid, 0));
  const status = paid <= 0 ? 'unpaid' : remaining <= 0 ? 'paid' : 'partial';

  return {
    total_amount: total,
    discount: discountAmount,
    paid_amount: paid,
    remaining_balance: remaining,
    status,
  };
};

const createInvoice = async ({
  patient_id,
  appointment_id = null,
  treatment_id = null,
  total_amount,
  discount = 0,
  status,
}) => {
  const fields = calculateInvoiceFields({ total_amount, discount, paid_amount: 0 });

  return supabaseAdmin
    .from('invoices')
    .insert({
      patient_id,
      appointment_id,
      treatment_id,
      ...fields,
      status: status || fields.status,
    })
    .select()
    .single();
};

const createInvoiceForCompletedTreatment = async (treatment) => {
  if (!treatment?.id) {
    return { data: null, error: { message: 'Treatment is required before invoice creation' } };
  }

  const existingInvoice = await getByTreatmentId(treatment.id);

  if (existingInvoice.error && existingInvoice.error.code !== 'PGRST116') {
    return existingInvoice;
  }

  if (existingInvoice.data) {
    return existingInvoice;
  }

  return createInvoice({
    patient_id: treatment.patient_id,
    appointment_id: treatment.appointment_id,
    treatment_id: treatment.id,
    total_amount: treatment.procedure_cost,
    status: 'unpaid',
  });
};

const updateAfterPayment = async (invoice, nextPaidAmount) => {
  const fields = calculateInvoiceFields({
    total_amount: invoice.total_amount,
    discount: invoice.discount,
    paid_amount: nextPaidAmount,
  });

  return supabaseAdmin.from('invoices').update(fields).eq('id', invoice.id).select().single();
};

module.exports = {
  calculateInvoiceFields,
  createInvoice,
  createInvoiceForCompletedTreatment,
  getById,
  getByTreatmentId,
  updateAfterPayment,
};
