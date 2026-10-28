/*
# Create Fleet KPI Database Schema

## Overview
Migrates the Bo's Coffee Fleet KPI & Distribution Cost Log app from localStorage
to Supabase Postgres. The app has its own custom login (username/password stored
in the accounts table) — it does NOT use Supabase Auth. All data is shared across
users, so policies use `TO anon, authenticated` with `USING (true)` because the
app manages access control in the frontend.

## New Tables

### 1. vehicles
- `plate` (text, primary key) — vehicle plate number, unique identifier
- `region` (text) — Manila or Cebu
- `driver` (text) — assigned driver name
- `location` (text) — base location
- `brand` (text) — vehicle brand/model
- `gw` (text) — gross weight
- `wheeler` (text) — 4W, 6W, 10W
- `fuel_type` (text) — Diesel, Gasoline
- `vehicle_type` (text) — body type description
- `length` (text) — cargo length
- `width` (text) — cargo width
- `height` (text) — cargo height
- `coding` (text) — coding day (Mon–Sun)
- `created_at` (timestamptz) — record creation time

### 2. entries
- `id` (text, primary key) — client-generated unique ID
- `plate` (text, foreign key → vehicles.plate ON DELETE CASCADE) — which vehicle
- `date` (date) — trip date
- `data` (jsonb) — full entry payload: firstMile, commissary, stores array,
  lastMileArrival, odometer, fuel, costIncurred, overtime, laborCost
- `created_at` (timestamptz) — record creation time
- Index on (plate, date) for efficient per-vehicle trip queries

### 3. accounts
- `username` (text, primary key) — login username
- `password` (text) — plaintext password (matches existing app behavior)
- `role` (text) — 'admin' or 'user'
- `created_at` (timestamptz) — record creation time

### 4. app_settings
- `key` (text, primary key) — setting key (e.g. 'last_cpl')
- `value` (text) — setting value as string
- `updated_at` (timestamptz) — last update time

## Security
- RLS enabled on ALL tables.
- All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because the app uses its own custom login (not Supabase Auth) and manages access
  control in the frontend. The anon-key client needs full CRUD to function.

## Notes
1. The entries table stores the complex nested entry structure (stores, time blocks,
   fuel, odometer, etc.) as a single JSONB column rather than normalizing into many
   tables. This matches the app's existing data model and avoids unnecessary complexity.
2. Vehicles are keyed by plate (text), matching the app's existing identity scheme.
3. Accounts store plaintext passwords to match the existing app behavior — this is
   the app's custom auth, not Supabase Auth.
*/

-- ===== Vehicles =====
CREATE TABLE IF NOT EXISTS vehicles (
  plate text PRIMARY KEY,
  region text NOT NULL DEFAULT 'Manila',
  driver text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  brand text NOT NULL DEFAULT '',
  gw text NOT NULL DEFAULT '',
  wheeler text NOT NULL DEFAULT '',
  fuel_type text NOT NULL DEFAULT '',
  vehicle_type text NOT NULL DEFAULT '',
  length text NOT NULL DEFAULT '',
  width text NOT NULL DEFAULT '',
  height text NOT NULL DEFAULT '',
  coding text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_vehicles" ON vehicles;
CREATE POLICY "anon_select_vehicles" ON vehicles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_vehicles" ON vehicles;
CREATE POLICY "anon_insert_vehicles" ON vehicles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_vehicles" ON vehicles;
CREATE POLICY "anon_update_vehicles" ON vehicles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_vehicles" ON vehicles;
CREATE POLICY "anon_delete_vehicles" ON vehicles FOR DELETE
  TO anon, authenticated USING (true);

-- ===== Entries =====
CREATE TABLE IF NOT EXISTS entries (
  id text PRIMARY KEY,
  plate text NOT NULL REFERENCES vehicles(plate) ON DELETE CASCADE,
  date date,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entries_plate_date ON entries(plate, date DESC);

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_entries" ON entries;
CREATE POLICY "anon_select_entries" ON entries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_entries" ON entries;
CREATE POLICY "anon_insert_entries" ON entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_entries" ON entries;
CREATE POLICY "anon_update_entries" ON entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_entries" ON entries;
CREATE POLICY "anon_delete_entries" ON entries FOR DELETE
  TO anon, authenticated USING (true);

-- ===== Accounts =====
CREATE TABLE IF NOT EXISTS accounts (
  username text PRIMARY KEY,
  password text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_accounts" ON accounts;
CREATE POLICY "anon_select_accounts" ON accounts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_accounts" ON accounts;
CREATE POLICY "anon_insert_accounts" ON accounts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_accounts" ON accounts;
CREATE POLICY "anon_update_accounts" ON accounts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_accounts" ON accounts;
CREATE POLICY "anon_delete_accounts" ON accounts FOR DELETE
  TO anon, authenticated USING (true);

-- ===== App Settings =====
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON app_settings;
CREATE POLICY "anon_select_settings" ON app_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON app_settings;
CREATE POLICY "anon_insert_settings" ON app_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON app_settings;
CREATE POLICY "anon_update_settings" ON app_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_settings" ON app_settings;
CREATE POLICY "anon_delete_settings" ON app_settings FOR DELETE
  TO anon, authenticated USING (true);
