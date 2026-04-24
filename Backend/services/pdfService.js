const { supabaseAdmin } = require('../config/db');

const CLINIC_NAME = process.env.CLINIC_NAME || 'DentEase Dental Clinic';

const makeError = (message, status = 400, code) => ({ message, status, code });

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (value) => {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatMoney = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const loadPuppeteer = async () => {
  try {
    return require('puppeteer');
  } catch (error) {
    throw makeError('Puppeteer is not installed. Add the puppeteer dependency before using PDF generation.', 500);
  }
};

const buildDocument = ({ title, content }) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        color: #1f2937;
        margin: 0;
        padding: 32px;
        font-size: 14px;
        line-height: 1.5;
      }
      .header {
        border-bottom: 2px solid #0f766e;
        padding-bottom: 12px;
        margin-bottom: 24px;
      }
      .clinic-name {
        font-size: 24px;
        font-weight: 700;
        color: #0f766e;
      }
      .title {
        font-size: 20px;
        font-weight: 600;
        margin-top: 8px;
      }
      .section {
        margin-bottom: 20px;
      }
      .section-title {
        font-size: 15px;
        font-weight: 700;
        margin-bottom: 8px;
        color: #111827;
      }
      .grid {
        width: 100%;
        border-collapse: collapse;
      }
      .grid td {
        padding: 6px 0;
        vertical-align: top;
      }
      .label {
        width: 180px;
        font-weight: 600;
        color: #374151;
      }
      .summary-box {
        background: #f0fdfa;
        border: 1px solid #99f6e4;
        border-radius: 8px;
        padding: 16px;
      }
      .medicines {
        padding-left: 18px;
        margin: 0;
      }
      .medicines li {
        margin-bottom: 8px;
      }
      .footer {
        margin-top: 24px;
        font-size: 12px;
        color: #6b7280;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="clinic-name">${escapeHtml(CLINIC_NAME)}</div>
      <div class="title">${escapeHtml(title)}</div>
    </div>
    ${content}
  </body>
</html>`;

const generatePdfBuffer = async ({ title, content }) => {
  const puppeteer = await loadPuppeteer();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(buildDocument({ title, content }), { waitUntil: 'networkidle0' });

    return await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });
  } finally {
    await browser.close();
  }
};

const getInvoicePdfData = async (invoiceId) => {
  const invoiceResult = await supabaseAdmin.from('invoices').select('*').eq('id', invoiceId).maybeSingle();

  if (invoiceResult.error) {
    return { data: null, error: invoiceResult.error };
  }

  if (!invoiceResult.data) {
    return { data: null, error: makeError('Invoice not found', 404) };
  }

  const invoice = invoiceResult.data;

  const [patientResult, treatmentResult, paymentsResult] = await Promise.all([
    supabaseAdmin.from('patients').select('*').eq('id', invoice.patient_id).maybeSingle(),
    invoice.treatment_id
      ? supabaseAdmin.from('treatments').select('*').eq('id', invoice.treatment_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabaseAdmin.from('payments').select('*').eq('invoice_id', invoice.id).order('payment_date', { ascending: false }),
  ]);

  const firstError = [patientResult, treatmentResult, paymentsResult].find((result) => result.error);

  if (firstError) {
    return { data: null, error: firstError.error };
  }

  return {
    data: {
      invoice,
      patient: patientResult.data,
      treatment: treatmentResult.data,
      payments: paymentsResult.data || [],
    },
    error: null,
  };
};

const getPrescriptionPdfData = async (prescriptionId) => {
  const prescriptionResult = await supabaseAdmin.from('prescriptions').select('*').eq('id', prescriptionId).maybeSingle();

  if (prescriptionResult.error) {
    return { data: null, error: prescriptionResult.error };
  }

  if (!prescriptionResult.data) {
    return { data: null, error: makeError('Prescription not found', 404) };
  }

  const prescription = prescriptionResult.data;

  const [patientResult, doctorResult] = await Promise.all([
    supabaseAdmin.from('patients').select('*').eq('id', prescription.patient_id).maybeSingle(),
    supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('id', prescription.doctor_id)
      .maybeSingle(),
  ]);

  const firstError = [patientResult, doctorResult].find((result) => result.error);

  if (firstError) {
    return { data: null, error: firstError.error };
  }

  return {
    data: {
      prescription,
      patient: patientResult.data,
      doctor: doctorResult.data,
    },
    error: null,
  };
};

const buildInvoiceHtml = ({ invoice, patient, treatment, payments }) => {
  const lastPaymentDate = payments[0]?.payment_date ? formatDate(payments[0].payment_date) : 'N/A';

  return `
    <div class="section">
      <div class="section-title">Patient Details</div>
      <table class="grid">
        <tr><td class="label">Patient Name</td><td>${escapeHtml(`${patient?.first_name || ''} ${patient?.last_name || ''}`.trim() || 'N/A')}</td></tr>
        <tr><td class="label">Phone Number</td><td>${escapeHtml(patient?.phone_number || 'N/A')}</td></tr>
        <tr><td class="label">Invoice Date</td><td>${escapeHtml(formatDate(invoice.created_at))}</td></tr>
      </table>
    </div>
    <div class="section">
      <div class="section-title">Treatment Details</div>
      <table class="grid">
        <tr><td class="label">Treatment</td><td>${escapeHtml(treatment?.procedure_name || 'N/A')}</td></tr>
        <tr><td class="label">Tooth Number</td><td>${escapeHtml(treatment?.tooth_number || 'N/A')}</td></tr>
        <tr><td class="label">Notes</td><td>${escapeHtml(treatment?.clinical_notes || 'N/A')}</td></tr>
      </table>
    </div>
    <div class="section summary-box">
      <div class="section-title">Invoice Summary</div>
      <table class="grid">
        <tr><td class="label">Total Amount</td><td>${escapeHtml(formatMoney(invoice.total_amount))}</td></tr>
        <tr><td class="label">Paid Amount</td><td>${escapeHtml(formatMoney(invoice.paid_amount))}</td></tr>
        <tr><td class="label">Remaining Balance</td><td>${escapeHtml(formatMoney(invoice.remaining_balance))}</td></tr>
        <tr><td class="label">Status</td><td>${escapeHtml(invoice.status || 'N/A')}</td></tr>
        <tr><td class="label">Payments Recorded</td><td>${escapeHtml(String(payments.length))}</td></tr>
        <tr><td class="label">Last Payment Date</td><td>${escapeHtml(lastPaymentDate)}</td></tr>
      </table>
    </div>
    <div class="footer">Generated on ${escapeHtml(formatDate(new Date().toISOString()))}</div>
  `;
};

const buildPrescriptionHtml = ({ prescription, patient, doctor }) => {
  const medicines = Array.isArray(prescription.medicines) ? prescription.medicines : [];
  const medicineItems =
    medicines.length > 0
      ? medicines
          .map(
            (medicine) =>
              `<li><strong>${escapeHtml(medicine?.name || 'Medicine')}</strong> - ${escapeHtml(
                medicine?.frequency || prescription.dosage || 'As directed'
              )}</li>`
          )
          .join('')
      : '<li>No medicines listed</li>';

  return `
    <div class="section">
      <div class="section-title">Prescription Details</div>
      <table class="grid">
        <tr><td class="label">Doctor Name</td><td>${escapeHtml(`${doctor?.first_name || ''} ${doctor?.last_name || ''}`.trim() || 'N/A')}</td></tr>
        <tr><td class="label">Patient Name</td><td>${escapeHtml(`${patient?.first_name || ''} ${patient?.last_name || ''}`.trim() || 'N/A')}</td></tr>
        <tr><td class="label">Date</td><td>${escapeHtml(formatDate(prescription.created_at))}</td></tr>
        <tr><td class="label">Dosage</td><td>${escapeHtml(prescription.dosage || 'N/A')}</td></tr>
      </table>
    </div>
    <div class="section">
      <div class="section-title">Medicines</div>
      <ol class="medicines">${medicineItems}</ol>
    </div>
    <div class="section summary-box">
      <div class="section-title">Instructions</div>
      <div>${escapeHtml(prescription.instructions || 'No additional instructions')}</div>
    </div>
    <div class="footer">Generated on ${escapeHtml(formatDate(new Date().toISOString()))}</div>
  `;
};

const generateInvoicePdf = async (invoiceId) => {
  const detailResult = await getInvoicePdfData(invoiceId);

  if (detailResult.error) {
    return detailResult;
  }

  try {
    const pdfBuffer = await generatePdfBuffer({
      title: 'Invoice',
      content: buildInvoiceHtml(detailResult.data),
    });

    return {
      data: {
        buffer: pdfBuffer,
        filename: `invoice-${invoiceId}.pdf`,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error.message || 'Failed to generate invoice PDF',
        status: error.status || 500,
        code: error.code,
      },
    };
  }
};

const generatePrescriptionPdf = async (prescriptionId) => {
  const detailResult = await getPrescriptionPdfData(prescriptionId);

  if (detailResult.error) {
    return detailResult;
  }

  try {
    const pdfBuffer = await generatePdfBuffer({
      title: 'Prescription',
      content: buildPrescriptionHtml(detailResult.data),
    });

    return {
      data: {
        buffer: pdfBuffer,
        filename: `prescription-${prescriptionId}.pdf`,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error.message || 'Failed to generate prescription PDF',
        status: error.status || 500,
        code: error.code,
      },
    };
  }
};

module.exports = {
  generateInvoicePdf,
  generatePrescriptionPdf,
};
