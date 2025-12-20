-- Function to update product rating and reviews_count
CREATE OR REPLACE FUNCTION public.update_product_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE public.products
    SET 
      rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM public.reviews
        WHERE product_id = NEW.product_id
      ),
      reviews_count = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE product_id = NEW.product_id
      )
    WHERE id = NEW.product_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.products
    SET 
      rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM public.reviews
        WHERE product_id = OLD.product_id
      ),
      reviews_count = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE product_id = OLD.product_id
      )
    WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after each insert, update, or delete on reviews
DROP TRIGGER IF EXISTS trigger_update_product_rating_stats ON public.reviews;
CREATE TRIGGER trigger_update_product_rating_stats
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_product_rating_stats();
