-- Convert public.users from a credential table into a Supabase Auth profile table.
-- Passwords are stored only by Supabase Auth in auth.users.

ALTER TABLE public.users
DROP COLUMN IF EXISTS password_hash;

ALTER TABLE public.users
ALTER COLUMN id DROP DEFAULT;

ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_id_fkey;

ALTER TABLE public.users
ADD CONSTRAINT users_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
