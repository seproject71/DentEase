const { supabaseAdmin } = require('../config/db');

const getSummary = async () => {
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const tomorrowStart = new Date(new Date().setHours(24, 0, 0, 0)).toISOString();

  const [patients, todayAppointments, unpaidInvoices, payments] = await Promise.all([
    supabaseAdmin.from('patients').select('id', { count: 'exact', head: true }),
    supabaseAdmin
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .gte('start_time', todayStart)
        .lt('start_time', tomorrowStart),
    supabaseAdmin
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .in('status', ['draft', 'unpaid', 'partial']),
    supabaseAdmin.from('payments').select('amount_paid'),
  ]);

  const firstError = [patients, todayAppointments, unpaidInvoices, payments].find((result) => result.error);

  if (firstError) {
    return firstError;
  }

  const revenue = payments.data.reduce((total, payment) => total + Number(payment.amount_paid || 0), 0);

  return {
    data: {
      patients: patients.count || 0,
      todayAppointments: todayAppointments.count || 0,
      unpaidInvoices: unpaidInvoices.count || 0,
      revenue,
    },
    error: null,
  };
};

module.exports = { getSummary };
