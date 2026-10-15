CREATE TABLE IF NOT EXISTS sourcing_records (
  id uuid PRIMARY KEY,
  reference_name text NOT NULL,
  meesho_url text NOT NULL,
  reference_brand text,
  department text NOT NULL CHECK (department IN ('MEN', 'WOMEN', 'ACCESSORIES')),
  subcategory text NOT NULL,
  reference_price_inr integer CHECK (reference_price_inr IS NULL OR reference_price_inr > 0),
  reference_price_unverified boolean NOT NULL DEFAULT true CHECK (reference_price_unverified = true),
  last_checked_on date,
  supplier_name text,
  supplier_contact text,
  supplier_reference text,
  wholesale_cost_inr integer CHECK (wholesale_cost_inr IS NULL OR wholesale_cost_inr > 0),
  minimum_order_quantity integer CHECK (minimum_order_quantity IS NULL OR minimum_order_quantity > 0),
  delivery_time text,
  resale_authorization text NOT NULL CHECK (resale_authorization IN ('NOT_PROVIDED', 'PENDING', 'GRANTED', 'DENIED')),
  authenticity_status text NOT NULL CHECK (authenticity_status IN ('NOT_PROVIDED', 'PENDING', 'GRANTED', 'DENIED')),
  image_permission text NOT NULL CHECK (image_permission IN ('NOT_PROVIDED', 'PENDING', 'GRANTED', 'DENIED')),
  documentation_reference text,
  internal_notes text,
  workflow_status text NOT NULL CHECK (workflow_status IN (
    'SHORTLISTED',
    'SUPPLIER_IDENTIFIED',
    'VERIFICATION_PENDING',
    'APPROVED_FOR_SOURCING',
    'STOCK_VERIFIED',
    'READY_TO_PUBLISH',
    'REJECTED',
    'ARCHIVED'
  )),
  archived_from_status text CHECK (archived_from_status IS NULL OR archived_from_status IN (
    'SHORTLISTED',
    'SUPPLIER_IDENTIFIED',
    'VERIFICATION_PENDING',
    'APPROVED_FOR_SOURCING',
    'STOCK_VERIFIED',
    'READY_TO_PUBLISH',
    'REJECTED',
    'ARCHIVED'
  )),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS sourcing_records_status_updated_idx
  ON sourcing_records (workflow_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS sourcing_records_department_subcategory_idx
  ON sourcing_records (department, subcategory);
