-- Fix addresses table to allow custom types and nullable fields
-- Run this in Supabase SQL Editor

-- Step 1: Change type from enum to text to allow custom types
ALTER TABLE public.addresses 
ALTER COLUMN type TYPE text;

-- Step 2: Make street nullable (it's optional)
ALTER TABLE public.addresses 
ALTER COLUMN street DROP NOT NULL;

-- Step 3: Ensure city is required (keep NOT NULL)
-- Already set in schema

-- Step 4: Add check constraint to ensure type is not empty
ALTER TABLE public.addresses 
ADD CONSTRAINT type_not_empty CHECK (type IS NOT NULL AND type <> '');
