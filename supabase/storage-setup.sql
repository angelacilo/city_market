-- Storage buckets setup
-- Make sure to enable public access for product-images and vendor-docs if needed

INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('vendor-docs', 'vendor-docs', false) ON CONFLICT DO NOTHING;
