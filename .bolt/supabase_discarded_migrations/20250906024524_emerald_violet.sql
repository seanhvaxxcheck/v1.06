@@ .. @@
 /*
   # Get user inventory stored procedure
 
   1. New Functions
     - `sp_get_user_inventory()` - Returns all inventory items for the current user
       - Uses auth.uid() to get the current user ID
       - Returns all columns from inventory_items table
       - Orders by created_at descending
   
   2. Security
     - Function uses SECURITY DEFINER to access auth.uid()
     - Only returns data for the authenticated user
 */
 
-CREATE OR REPLACE FUNCTION sp_get_user_inventory()
+CREATE OR REPLACE FUNCTION sp_get_user_inventory(p_user_id uuid)
 RETURNS TABLE (
   id uuid,
-  user_id uuid,
   category text,
   name text,
   manufacturer text,
@@ .. @@
   updated_at timestamptz
 )
 LANGUAGE plpgsql
-SECURITY DEFINER
 AS $$
 BEGIN
   RETURN QUERY
   SELECT 
     i.id,
-    i.user_id,
     i.category,
     i.name,
@@ .. @@
     i.updated_at
   FROM inventory_items i
-  WHERE i.user_id = auth.uid()
+  WHERE i.user_id = p_user_id
   ORDER BY i.created_at DESC;
 END;
 $$;