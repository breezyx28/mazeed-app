# Fix Favorites Table RLS Policies

## Problem
The `favorites` table is missing proper Row Level Security (RLS) policies, which prevents users from adding items to their wishlist. When users click the heart button, the item appears temporarily (optimistic update) but disappears after refresh because the database insert fails due to RLS policy violations.

## Solution
Run the following SQL script in your Supabase SQL Editor to fix the RLS policies:

```sql
-- Fix Row Level Security (RLS) policies for favorites table
-- This script will enable RLS and create policies to allow users to manage their own favorites

-- Enable RLS on favorites table
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can update their own favorites" ON favorites;

-- Create policy to allow users to view their own favorites
CREATE POLICY "Users can view their own favorites"
ON favorites
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own favorites
CREATE POLICY "Users can insert their own favorites"
ON favorites
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own favorites
CREATE POLICY "Users can delete their own favorites"
ON favorites
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create policy to allow users to update their own favorites (if needed)
CREATE POLICY "Users can update their own favorites"
ON favorites
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'favorites';
```

## How to Apply

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the SQL script above
5. Click **Run** to execute the script
6. Verify the policies were created by checking the output of the last SELECT query

## What This Does

- **Enables RLS** on the `favorites` table to ensure data security
- **Creates 4 policies** that allow authenticated users to:
  - **SELECT**: View their own favorites
  - **INSERT**: Add new favorites
  - **DELETE**: Remove favorites
  - **UPDATE**: Modify their favorites (if needed)
- All policies use `auth.uid() = user_id` to ensure users can only access their own data

## Testing

After applying the SQL script:
1. Refresh your application
2. Click the heart button on a product
3. The heart should turn red immediately
4. Navigate to the Wishlist page - the product should appear
5. Refresh the page - the product should still be there
6. The heart button should remain red

## Expected Console Output

After applying the fix, you should no longer see errors in the browser console when adding items to the wishlist. The console should show successful database operations.
