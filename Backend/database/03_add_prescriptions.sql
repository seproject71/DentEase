CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id),
    treatment_id UUID NOT NULL UNIQUE REFERENCES treatments(id) ON DELETE CASCADE,
    medicines JSONB NOT NULL DEFAULT '[]'::jsonb,
    dosage TEXT NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
