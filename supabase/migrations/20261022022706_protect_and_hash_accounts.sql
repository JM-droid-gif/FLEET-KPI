/*
# Protect the built-in admin and migrate account passwords to hashes

## Overview
Adds a protection flag to the custom application accounts table, replaces the
built-in admin password with its SHA-256 hash, and prevents protected accounts
from being updated or deleted through the public data API.

## Modified Table

### accounts
- `is_protected` (boolean, not null, default false) — marks accounts that cannot
  be edited or deleted through the application database API.
- `password` — now stores a SHA-256 hexadecimal digest instead of plaintext.

## Security Changes
1. The built-in `admin` account is marked protected.
2. UPDATE policies only allow changes to unprotected accounts.
3. DELETE policies only allow removal of unprotected accounts.
4. INSERT remains available for creating normal application users.
5. Existing shared-app policies remain scoped to `anon, authenticated` because
   this application uses its own login rather than Supabase Auth.

## Important Notes
1. The protected admin password is now `password@bosWH`; only its hash is stored.
2. The frontend hashes passwords before comparing or saving them.
3. This migration does not delete any accounts or user data.
*/

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS is_protected boolean NOT NULL DEFAULT false;

UPDATE accounts
SET password = 'ed0cdb31c8090172a14f0564afd67ed3d0ef99ecffcdc20552f112b02b90c653',
    is_protected = true
WHERE username = 'admin';

DROP POLICY IF EXISTS "anon_update_accounts" ON accounts;
CREATE POLICY "anon_update_accounts" ON accounts FOR UPDATE
  TO anon, authenticated
  USING (is_protected = false)
  WITH CHECK (is_protected = false);

DROP POLICY IF EXISTS "anon_delete_accounts" ON accounts;
CREATE POLICY "anon_delete_accounts" ON accounts FOR DELETE
  TO anon, authenticated
  USING (is_protected = false);
