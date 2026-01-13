-- Fix comments table ID type - Date.now() generates values too large for INTEGER

-- Change id column from SERIAL (INTEGER) to BIGINT
ALTER TABLE public.comments 
ALTER COLUMN id TYPE BIGINT;

-- Also update the sequence if it exists
ALTER SEQUENCE IF EXISTS comments_id_seq AS BIGINT;
