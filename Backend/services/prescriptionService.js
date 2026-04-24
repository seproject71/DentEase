const { supabaseAdmin } = require('../config/db');

const makeError = (message, status = 400, code) => ({ message, status, code });

const generatePrescriptionText = (prescription) => {
  const medicines = Array.isArray(prescription.medicines) ? prescription.medicines : [];

  const medicineLines =
    medicines.length > 0
      ? medicines
          .map((medicine, index) => {
            const name = medicine?.name || `Medicine ${index + 1}`;
            const frequency = medicine?.frequency ? ` - ${medicine.frequency}` : '';
            return `${index + 1}. ${name}${frequency}`;
          })
          .join('\n')
      : 'No medicines listed';

  return [
    `Prescription ID: ${prescription.id || 'Pending'}`,
    `Patient ID: ${prescription.patient_id}`,
    `Doctor ID: ${prescription.doctor_id}`,
    `Treatment ID: ${prescription.treatment_id}`,
    'Medicines:',
    medicineLines,
    `Dosage: ${prescription.dosage}`,
    `Instructions: ${prescription.instructions || 'N/A'}`,
    `Created At: ${prescription.created_at || new Date().toISOString()}`,
  ].join('\n');
};

const withPrescriptionText = (prescription) => ({
  ...prescription,
  prescription_text: generatePrescriptionText(prescription),
});

const validateMedicines = (medicines) => {
  if (!Array.isArray(medicines) || medicines.length === 0) {
    return 'Medicines must be a non-empty array';
  }

  const hasInvalidMedicine = medicines.some(
    (medicine) =>
      !medicine ||
      typeof medicine !== 'object' ||
      Array.isArray(medicine) ||
      typeof medicine.name !== 'string' ||
      medicine.name.trim() === '' ||
      (medicine.frequency !== undefined &&
        (typeof medicine.frequency !== 'string' || medicine.frequency.trim() === ''))
  );

  if (hasInvalidMedicine) {
    return 'Each medicine must include a valid name and optional frequency';
  }

  return null;
};

const getTreatmentById = async (treatmentId) => {
  return supabaseAdmin
    .from('treatments')
    .select('id, patient_id, doctor_id, status')
    .eq('id', treatmentId)
    .maybeSingle();
};

const create = async ({ patient_id, doctor_id, treatment_id, medicines, dosage, instructions }) => {
  const medicinesError = validateMedicines(medicines);

  if (medicinesError) {
    return { data: null, error: makeError(medicinesError, 422) };
  }

  const treatmentResult = await getTreatmentById(treatment_id);

  if (treatmentResult.error) {
    return { data: null, error: treatmentResult.error };
  }

  if (!treatmentResult.data) {
    return { data: null, error: makeError('Treatment not found', 404) };
  }

  if (treatmentResult.data.doctor_id !== doctor_id) {
    return { data: null, error: makeError('Doctor is not assigned to this treatment', 403) };
  }

  if (treatmentResult.data.patient_id !== patient_id) {
    return { data: null, error: makeError('Patient does not match the treatment record', 422) };
  }

  if (treatmentResult.data.status !== 'completed') {
    return { data: null, error: makeError('Prescription can only be created for completed treatments', 422) };
  }

  const existingPrescriptionResult = await supabaseAdmin
    .from('prescriptions')
    .select('id')
    .eq('treatment_id', treatment_id)
    .maybeSingle();

  if (existingPrescriptionResult.error) {
    return { data: null, error: existingPrescriptionResult.error };
  }

  if (existingPrescriptionResult.data) {
    return { data: null, error: makeError('Prescription already exists for this treatment', 409) };
  }

  const insertResult = await supabaseAdmin
    .from('prescriptions')
    .insert({
      patient_id,
      doctor_id,
      treatment_id,
      medicines,
      dosage,
      instructions,
    })
    .select('*')
    .single();

  if (insertResult.error) {
    return insertResult;
  }

  return { data: withPrescriptionText(insertResult.data), error: null };
};

const listByPatientId = async (patientId) => {
  const result = await supabaseAdmin
    .from('prescriptions')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (result.error) {
    return result;
  }

  return {
    data: (result.data || []).map(withPrescriptionText),
    error: null,
  };
};

const getByTreatmentId = async (treatmentId) => {
  const result = await supabaseAdmin
    .from('prescriptions')
    .select('*')
    .eq('treatment_id', treatmentId)
    .maybeSingle();

  if (result.error) {
    return result;
  }

  if (!result.data) {
    return { data: null, error: makeError('Prescription not found', 404) };
  }

  return { data: withPrescriptionText(result.data), error: null };
};

module.exports = {
  create,
  generatePrescriptionText,
  getByTreatmentId,
  listByPatientId,
};
