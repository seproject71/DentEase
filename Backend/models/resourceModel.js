const resources = {
  users: {
    required: ['email', 'first_name', 'last_name', 'role'],
    mutable: ['email', 'first_name', 'last_name', 'role', 'is_active'],
    orderBy: 'created_at',
  },
  patients: {
    required: ['phone_number', 'first_name', 'last_name'],
    mutable: ['phone_number', 'first_name', 'last_name', 'age', 'gender', 'address'],
    orderBy: 'created_at',
  },
  medical_alerts: {
    required: ['patient_id', 'condition_name'],
    mutable: ['patient_id', 'condition_name', 'severity'],
    orderBy: 'created_at',
  },
  appointments: {
    required: ['patient_id', 'doctor_id', 'start_time', 'end_time'],
    mutable: [
      'patient_id',
      'doctor_id',
      'start_time',
      'end_time',
      'appointment_time',
      'reason_for_visit',
      'status',
    ],
    orderBy: 'start_time',
  },
  treatments: {
    required: ['appointment_id', 'patient_id', 'doctor_id', 'procedure_name', 'procedure_cost'],
    mutable: [
      'appointment_id',
      'patient_id',
      'doctor_id',
      'tooth_number',
      'procedure_name',
      'clinical_notes',
      'procedure_cost',
      'status',
    ],
    orderBy: 'created_at',
  },
  invoices: {
    required: ['patient_id', 'total_amount'],
    mutable: [
      'patient_id',
      'appointment_id',
      'treatment_id',
      'total_amount',
      'discount',
      'paid_amount',
      'remaining_balance',
      'status',
    ],
    orderBy: 'created_at',
  },
  payments: {
    required: ['invoice_id', 'amount_paid'],
    mutable: ['invoice_id', 'amount_paid', 'payment_method', 'processed_by'],
    orderBy: 'payment_date',
  },
};

module.exports = { resources };
