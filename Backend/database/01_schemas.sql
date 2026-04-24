-- ==========================================
-- ENUMS (Standardizing repeating string values)
-- ==========================================
CREATE TYPE user_role AS ENUM ('doctor', 'receptionist', 'admin');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE treatment_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE invoice_status AS ENUM ('draft', 'unpaid', 'partial', 'paid');

-- ==========================================
-- 1. USERS (Auth Profiles)
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT TRUE, -- Easily revoke access if someone quits
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. PATIENTS (Demographics)
-- ==========================================
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) UNIQUE NOT NULL, 
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    age INTEGER CHECK (age >= 0 AND age <= 120),
    gender VARCHAR(10),
    address TEXT, -- Can be encrypted at the application layer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. MEDICAL ALERTS (3NF: Separating multi-valued attributes)
-- ==========================================
-- Instead of a comma-separated string in the patients table, we split alerts out.
CREATE TABLE medical_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    condition_name VARCHAR(255) NOT NULL, -- e.g., "Penicillin Allergy", "Diabetes"
    severity VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. APPOINTMENTS (The Core Workflow)
-- ==========================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    appointment_time TIMESTAMP WITH TIME ZONE,
    reason_for_visit TEXT,
    status appointment_status DEFAULT 'scheduled',
    CHECK (start_time < end_time),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. TREATMENTS (The EHR & Odontogram Logging)
-- ==========================================
CREATE TABLE treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id),
    tooth_number INTEGER CHECK (tooth_number >= 1 AND tooth_number <= 32), -- Standard adult chart
    procedure_name VARCHAR(255) NOT NULL,
    clinical_notes TEXT,
    procedure_cost DECIMAL(10, 2) NOT NULL, -- Base cost of the procedure for billing
    status treatment_status DEFAULT 'planned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. INVOICES (Financial Header)
-- ==========================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    treatment_id UUID UNIQUE REFERENCES treatments(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10, 2) DEFAULT 0.00,
    net_amount DECIMAL(10, 2) GENERATED ALWAYS AS (total_amount - discount) STORED,
    paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    remaining_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status invoice_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 7. PAYMENTS (Financial Ledger - 3NF)
-- ==========================================
-- Separated from Invoices so a patient can make multiple partial payments over time 
-- without duplicating the invoice data.
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50), -- 'Cash', 'UPI', 'Card'
    processed_by UUID REFERENCES users(id), -- Which receptionist collected the money
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 8. PRESCRIPTIONS (Post-Treatment Medication Plans)
-- ==========================================
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id),
    treatment_id UUID NOT NULL UNIQUE REFERENCES treatments(id) ON DELETE CASCADE,
    medicines JSONB NOT NULL DEFAULT '[]'::jsonb,
    dosage TEXT NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
