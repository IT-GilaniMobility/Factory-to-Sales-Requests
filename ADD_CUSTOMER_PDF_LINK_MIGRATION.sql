-- Add columns to track customer PDF attachment
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS attached_customer_form_id UUID REFERENCES customer_forms_public(id);

ALTER TABLE g24_requests
ADD COLUMN IF NOT EXISTS attached_customer_form_id UUID REFERENCES customer_forms_public(id);

ALTER TABLE diving_solution_requests
ADD COLUMN IF NOT EXISTS attached_customer_form_id UUID REFERENCES customer_forms_public(id);

ALTER TABLE turney_seat_requests
ADD COLUMN IF NOT EXISTS attached_customer_form_id UUID REFERENCES customer_forms_public(id);

-- Create indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_requests_attached_pdf ON requests(attached_customer_form_id);
CREATE INDEX IF NOT EXISTS idx_g24_attached_pdf ON g24_requests(attached_customer_form_id);
CREATE INDEX IF NOT EXISTS idx_diving_attached_pdf ON diving_solution_requests(attached_customer_form_id);
CREATE INDEX IF NOT EXISTS idx_turney_attached_pdf ON turney_seat_requests(attached_customer_form_id);
