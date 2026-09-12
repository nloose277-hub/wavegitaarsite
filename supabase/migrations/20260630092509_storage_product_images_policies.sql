
-- Public read for product images
CREATE POLICY "public_read_product_images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

-- Authenticated users (admin) can upload
CREATE POLICY "admin_upload_product_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Authenticated users (admin) can delete
CREATE POLICY "admin_delete_product_images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
