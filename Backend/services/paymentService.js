const { supabaseAdmin } = require('../config/db');
const invoiceService = require('./invoiceService');

const toMoney = (value) => Number(Number(value || 0).toFixed(2));

const list = async (filters = {}) => {
  let query = supabaseAdmin.from('payments').select('*');

  Object.entries(filters).forEach(([key, value]) => {
    if (['id', 'invoice_id', 'payment_method', 'processed_by'].includes(key)) {
      query = query.eq(key, value);
    }
  });

  return query.order('payment_date', { ascending: false });
};

const getById = async (paymentId) => {
  return supabaseAdmin.from('payments').select('*').eq('id', paymentId).single();
};

const createPayment = async ({ invoice_id, amount_paid, payment_method, processed_by }) => {
  const amount = toMoney(amount_paid);

  if (!invoice_id) {
    return { data: null, error: { message: 'invoice_id is required' } };
  }

  if (!amount || amount <= 0) {
    return { data: null, error: { message: 'amount_paid must be greater than 0' } };
  }

  const invoiceResult = await invoiceService.getById(invoice_id);

  if (invoiceResult.error || !invoiceResult.data) {
    return { data: null, error: { message: 'Invoice not found' } };
  }

  const invoice = invoiceResult.data;
  const remaining = toMoney(invoice.remaining_balance ?? Number(invoice.total_amount) - Number(invoice.paid_amount || 0));

  if (amount > remaining) {
    return {
      data: null,
      error: { message: `Payment exceeds remaining balance. Remaining balance is ${remaining}` },
    };
  }

  const paymentResult = await supabaseAdmin
    .from('payments')
    .insert({
      invoice_id,
      amount_paid: amount,
      payment_method,
      processed_by,
    })
    .select()
    .single();

  if (paymentResult.error) {
    return paymentResult;
  }

  const nextPaidAmount = toMoney(Number(invoice.paid_amount || 0) + amount);
  const invoiceUpdate = await invoiceService.updateAfterPayment(invoice, nextPaidAmount);

  if (invoiceUpdate.error) {
    return { data: { payment: paymentResult.data }, error: invoiceUpdate.error };
  }

  return {
    data: {
      payment: paymentResult.data,
      invoice: invoiceUpdate.data,
    },
    error: null,
  };
};

const update = async (paymentId, payload) => {
  return supabaseAdmin.from('payments').update(payload).eq('id', paymentId).select().single();
};

const remove = async (paymentId) => {
  return supabaseAdmin.from('payments').delete().eq('id', paymentId).select().single();
};

module.exports = { createPayment, getById, list, remove, update };
