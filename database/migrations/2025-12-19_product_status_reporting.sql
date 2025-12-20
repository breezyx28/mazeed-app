-- Migration: Product Status Reporting System
-- Date: 2025-12-19
-- Description: Enables customers to report product availability issues and notify sellers

-- ============================================================================
-- 1. PRODUCT STATUS REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_status_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  
  -- Reporter Information (Show customer name to seller)
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_name text NOT NULL, -- Cached for display even if profile deleted
  
  -- Report Details
  reported_status text NOT NULL CHECK (reported_status IN ('out_of_stock', 'discontinued', 'temporarily_unavailable', 'wrong_info')),
  current_product_status text NOT NULL, -- Product status at time of report
  report_reason text, -- Optional customer comment
  report_count integer DEFAULT 1 CHECK (report_count > 0), -- Number of times this exact report was made
  
  -- Status & Lifecycle
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'expired', 'auto_updated')),
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  first_reported_at timestamptz DEFAULT now() NOT NULL, -- When first report was made
  last_reported_at timestamptz DEFAULT now() NOT NULL, -- When last duplicate report was made
  seller_response_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '24 hours') NOT NULL,
  auto_update_eligible_at timestamptz, -- When eligible for auto-update (12 hours after 5th report)
  
  -- Seller Response
  seller_response text, -- Optional seller comment when declining
  seller_dispute_evidence jsonb, -- Evidence if seller disputes (images, notes, etc.)
  
  -- Prevent duplicate pending reports for same product + status
  CONSTRAINT unique_pending_report UNIQUE(product_id, reported_status, status) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Add check constraint to ensure auto_update_eligible_at is set when count >= 5
ALTER TABLE public.product_status_reports 
ADD CONSTRAINT check_auto_update_eligible 
CHECK (
  (report_count < 5 AND auto_update_eligible_at IS NULL) OR
  (report_count >= 5 AND auto_update_eligible_at IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_status_reports_product 
  ON public.product_status_reports(product_id);

CREATE INDEX IF NOT EXISTS idx_product_status_reports_seller 
  ON public.product_status_reports(seller_id);

CREATE INDEX IF NOT EXISTS idx_product_status_reports_status 
  ON public.product_status_reports(status);

CREATE INDEX IF NOT EXISTS idx_product_status_reports_reporter 
  ON public.product_status_reports(reporter_id);

CREATE INDEX IF NOT EXISTS idx_product_status_reports_auto_update 
  ON public.product_status_reports(auto_update_eligible_at) 
  WHERE status = 'pending' AND report_count >= 5;

CREATE INDEX IF NOT EXISTS idx_product_status_reports_expires 
  ON public.product_status_reports(expires_at) 
  WHERE status = 'pending';

-- ============================================================================
-- 2. PRODUCT STATUS REPORT REPORTERS TABLE
-- ============================================================================
-- Track individual reporters for each report (for duplicate aggregation)
CREATE TABLE IF NOT EXISTS public.product_status_report_reporters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid NOT NULL REFERENCES public.product_status_reports(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_at timestamptz DEFAULT now() NOT NULL,
  
  -- Prevent same user from reporting same report multiple times
  CONSTRAINT unique_reporter_per_report UNIQUE(report_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_report_reporters_report 
  ON public.product_status_report_reporters(report_id);

CREATE INDEX IF NOT EXISTS idx_report_reporters_reporter 
  ON public.product_status_report_reporters(reporter_id);

-- ============================================================================
-- 3. ENHANCE NOTIFICATIONS TABLE
-- ============================================================================
-- Add columns for actionable notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS action_type text,
ADD COLUMN IF NOT EXISTS action_data jsonb,
ADD COLUMN IF NOT EXISTS action_buttons jsonb,
ADD COLUMN IF NOT EXISTS related_entity_type text,
ADD COLUMN IF NOT EXISTS related_entity_id uuid;

-- Index for action notifications
CREATE INDEX IF NOT EXISTS idx_notifications_action_type 
  ON public.notifications(action_type) 
  WHERE action_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_related_entity 
  ON public.notifications(related_entity_type, related_entity_id) 
  WHERE related_entity_type IS NOT NULL;

-- ============================================================================
-- 4. PRODUCT UNAVAILABILITY IMPACTS TABLE
-- ============================================================================
-- Track affected orders when product is confirmed unavailable
CREATE TABLE IF NOT EXISTS public.product_unavailability_impacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid NOT NULL REFERENCES public.product_status_reports(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Financial Impact
  original_order_total numeric NOT NULL CHECK (original_order_total >= 0),
  recalculated_order_total numeric NOT NULL CHECK (recalculated_order_total >= 0),
  refund_amount numeric NOT NULL CHECK (refund_amount >= 0),
  
  -- Status Tracking
  customer_notified boolean DEFAULT false,
  item_removed boolean DEFAULT false,
  order_recalculated boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_unavailability_impacts_report 
  ON public.product_unavailability_impacts(report_id);

CREATE INDEX IF NOT EXISTS idx_unavailability_impacts_order 
  ON public.product_unavailability_impacts(order_id);

CREATE INDEX IF NOT EXISTS idx_unavailability_impacts_customer 
  ON public.product_unavailability_impacts(customer_id);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.product_status_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_status_report_reporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_unavailability_impacts ENABLE ROW LEVEL SECURITY;

-- Product Status Reports Policies
-- Customers can view their own reports
CREATE POLICY "Customers can view own reports" 
  ON public.product_status_reports 
  FOR SELECT 
  USING (reporter_id = auth.uid());

-- Customers can create reports
CREATE POLICY "Customers can create reports" 
  ON public.product_status_reports 
  FOR INSERT 
  WITH CHECK (reporter_id = auth.uid());

-- Sellers can view reports for their products
CREATE POLICY "Sellers can view their product reports" 
  ON public.product_status_reports 
  FOR SELECT 
  USING (
    seller_id IN (
      SELECT id FROM public.sellers WHERE profile_id = auth.uid()
    )
  );

-- Sellers can update their product reports (confirm/decline)
CREATE POLICY "Sellers can respond to their product reports" 
  ON public.product_status_reports 
  FOR UPDATE 
  USING (
    seller_id IN (
      SELECT id FROM public.sellers WHERE profile_id = auth.uid()
    )
  );

-- Report Reporters Policies
CREATE POLICY "Users can view their reporter records" 
  ON public.product_status_report_reporters 
  FOR SELECT 
  USING (reporter_id = auth.uid());

CREATE POLICY "Users can create reporter records" 
  ON public.product_status_report_reporters 
  FOR INSERT 
  WITH CHECK (reporter_id = auth.uid());

-- Unavailability Impacts Policies
CREATE POLICY "Customers can view their impact records" 
  ON public.product_unavailability_impacts 
  FOR SELECT 
  USING (customer_id = auth.uid());

CREATE POLICY "Sellers can view impact records for their reports" 
  ON public.product_unavailability_impacts 
  FOR SELECT 
  USING (
    report_id IN (
      SELECT id FROM public.product_status_reports 
      WHERE seller_id IN (
        SELECT id FROM public.sellers WHERE profile_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user can report a product (rate limiting)
CREATE OR REPLACE FUNCTION can_report_product(
  p_user_id uuid,
  p_product_id text
) RETURNS boolean AS $$
DECLARE
  reports_today integer;
  reports_this_week_for_product integer;
  last_report_time timestamptz;
BEGIN
  -- Check daily limit (5 reports per day)
  SELECT COUNT(*) INTO reports_today
  FROM product_status_report_reporters
  WHERE reporter_id = p_user_id
    AND reported_at >= CURRENT_DATE;
    
  IF reports_today >= 5 THEN
    RETURN false;
  END IF;
  
  -- Check product-specific limit (1 report per product per week)
  SELECT COUNT(*) INTO reports_this_week_for_product
  FROM product_status_report_reporters prr
  JOIN product_status_reports psr ON prr.report_id = psr.id
  WHERE prr.reporter_id = p_user_id
    AND psr.product_id = p_product_id
    AND prr.reported_at >= (CURRENT_DATE - INTERVAL '7 days');
    
  IF reports_this_week_for_product > 0 THEN
    RETURN false;
  END IF;
  
  -- Check time between reports (5 minutes minimum)
  SELECT MAX(reported_at) INTO last_report_time
  FROM product_status_report_reporters
  WHERE reporter_id = p_user_id;
    
  IF last_report_time IS NOT NULL 
     AND (EXTRACT(EPOCH FROM (NOW() - last_report_time)) < 300) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create a report (handles duplicate aggregation)
CREATE OR REPLACE FUNCTION get_or_create_product_report(
  p_product_id text,
  p_reporter_id uuid,
  p_reporter_name text,
  p_reported_status text,
  p_report_reason text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_report_id uuid;
  v_seller_id uuid;
  v_current_status text;
  v_report_count integer;
BEGIN
  -- Get seller_id and current product status
  SELECT seller_id, status INTO v_seller_id, v_current_status
  FROM products
  WHERE id = p_product_id;
  
  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Product not found or has no seller';
  END IF;
  
  -- Check for existing pending report with same product + status
  SELECT id, report_count INTO v_report_id, v_report_count
  FROM product_status_reports
  WHERE product_id = p_product_id
    AND reported_status = p_reported_status
    AND status = 'pending'
  FOR UPDATE; -- Lock the row for update
  
  IF v_report_id IS NOT NULL THEN
    -- Update existing report
    UPDATE product_status_reports
    SET report_count = report_count + 1,
        last_reported_at = NOW(),
        -- Set auto_update_eligible_at when reaching 5 reports
        auto_update_eligible_at = CASE 
          WHEN report_count + 1 = 5 THEN NOW() + INTERVAL '12 hours'
          ELSE auto_update_eligible_at
        END
    WHERE id = v_report_id;
    
    -- Add reporter to reporters list
    INSERT INTO product_status_report_reporters (report_id, reporter_id)
    VALUES (v_report_id, p_reporter_id)
    ON CONFLICT (report_id, reporter_id) DO NOTHING;
    
  ELSE
    -- Create new report
    INSERT INTO product_status_reports (
      product_id,
      seller_id,
      reporter_id,
      reporter_name,
      reported_status,
      current_product_status,
      report_reason,
      report_count
    ) VALUES (
      p_product_id,
      v_seller_id,
      p_reporter_id,
      p_reporter_name,
      p_reported_status,
      v_current_status,
      p_report_reason,
      1
    ) RETURNING id INTO v_report_id;
    
    -- Add reporter to reporters list
    INSERT INTO product_status_report_reporters (report_id, reporter_id)
    VALUES (v_report_id, p_reporter_id);
  END IF;
  
  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.product_status_reports IS 
  'Stores customer reports about product availability issues';

COMMENT ON COLUMN public.product_status_reports.report_count IS 
  'Number of customers who reported this same issue (aggregated duplicates)';

COMMENT ON COLUMN public.product_status_reports.auto_update_eligible_at IS 
  'When this report becomes eligible for auto-update (set when count reaches 5, then + 12 hours)';

COMMENT ON TABLE public.product_status_report_reporters IS 
  'Tracks individual customers who contributed to each report (for duplicate aggregation)';

COMMENT ON TABLE public.product_unavailability_impacts IS 
  'Tracks orders affected when a product is confirmed unavailable';

COMMENT ON FUNCTION can_report_product IS 
  'Checks if a user is allowed to report a product (rate limiting)';

COMMENT ON FUNCTION get_or_create_product_report IS 
  'Gets existing pending report or creates new one, handling duplicate aggregation';
