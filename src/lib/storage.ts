import { supabase } from './supabase';
import type { Account, Entry, Vehicle } from '../types';

// ---- Vehicles ----

export async function fetchVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('plate, region, driver, location, brand, gw, wheeler, fuel_type, vehicle_type, length, width, height, coding')
    .order('plate');
  if (error) throw error;
  return (data || []).map(rowToVehicle);
}

export async function saveVehicles(vehicles: Vehicle[]): Promise<void> {
  // Upsert all vehicles — simple full-sync approach
  const rows = vehicles.map(vehicleToRow);
  const { error } = await supabase
    .from('vehicles')
    .upsert(rows, { onConflict: 'plate' });
  if (error) throw error;
}

export async function insertVehicle(v: Vehicle): Promise<void> {
  const { error } = await supabase.from('vehicles').insert(vehicleToRow(v));
  if (error) throw error;
}

export async function updateVehicleRow(plate: string, patch: Partial<Vehicle>): Promise<void> {
  const row: Record<string, string> = {};
  if (patch.region !== undefined) row.region = patch.region;
  if (patch.driver !== undefined) row.driver = patch.driver;
  if (patch.location !== undefined) row.location = patch.location;
  if (patch.brand !== undefined) row.brand = patch.brand;
  if (patch.gw !== undefined) row.gw = patch.gw;
  if (patch.wheeler !== undefined) row.wheeler = patch.wheeler;
  if (patch.fuelType !== undefined) row.fuel_type = patch.fuelType;
  if (patch.vehicleType !== undefined) row.vehicle_type = patch.vehicleType;
  if (patch.length !== undefined) row.length = patch.length;
  if (patch.width !== undefined) row.width = patch.width;
  if (patch.height !== undefined) row.height = patch.height;
  if (patch.coding !== undefined) row.coding = patch.coding;
  const { error } = await supabase.from('vehicles').update(row).eq('plate', plate);
  if (error) throw error;
}

export async function deleteVehicleRow(plate: string): Promise<void> {
  const { error } = await supabase.from('vehicles').delete().eq('plate', plate);
  if (error) throw error;
}

// ---- Entries ----

export async function fetchEntries(plate: string): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('id, plate, date, data')
    .eq('plate', plate)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToEntry);
}

export async function fetchAllEntries(plates: string[]): Promise<Record<string, Entry[]>> {
  const result: Record<string, Entry[]> = {};
  if (!plates.length) return result;
  const { data, error } = await supabase
    .from('entries')
    .select('id, plate, date, data')
    .in('plate', plates);
  if (error) throw error;
  for (const row of data || []) {
    const plate: string = row.plate;
    if (!result[plate]) result[plate] = [];
    result[plate].push(rowToEntry(row));
  }
  return result;
}

export async function upsertEntry(plate: string, entry: Entry): Promise<void> {
  const row = entryToRow(plate, entry);
  const { error } = await supabase.from('entries').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteEntryRow(entryId: string): Promise<void> {
  const { error } = await supabase.from('entries').delete().eq('id', entryId);
  if (error) throw error;
}

// ---- Accounts ----

export async function fetchAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('username, password, role, is_protected')
    .order('username');
  if (error) throw error;
  return (data || []).map((row) => ({
    username: row.username,
    passwordHash: row.password,
    role: row.role,
    isProtected: row.is_protected,
  }));
}

export async function saveAccounts(accounts: Account[]): Promise<void> {
  const rows = accounts.map((a) => ({ username: a.username, password: a.passwordHash, role: a.role, is_protected: a.isProtected ?? false }));
  const { error } = await supabase.from('accounts').upsert(rows, { onConflict: 'username' });
  if (error) throw error;
}

export async function insertAccount(a: Account): Promise<void> {
  const { error } = await supabase.from('accounts').insert({ username: a.username, password: a.passwordHash, role: a.role, is_protected: false });
  if (error) throw error;
}

export async function updateAccount(username: string, patch: { password: string; role: string }): Promise<void> {
  const { error } = await supabase.from('accounts').update(patch).eq('username', username);
  if (error) throw error;
}

export async function deleteAccount(username: string): Promise<void> {
  const { error } = await supabase.from('accounts').delete().eq('username', username);
  if (error) throw error;
}

// ---- Settings ----

export async function fetchSetting(key: string): Promise<string> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error) throw error;
  return data?.value ?? '';
}

export async function saveSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw error;
}

// ---- Row mappers ----

function rowToVehicle(row: Record<string, string>): Vehicle {
  return {
    plate: row.plate,
    region: row.region,
    driver: row.driver,
    location: row.location,
    brand: row.brand,
    gw: row.gw,
    wheeler: row.wheeler,
    fuelType: row.fuel_type,
    vehicleType: row.vehicle_type,
    length: row.length,
    width: row.width,
    height: row.height,
    coding: row.coding,
  };
}

function vehicleToRow(v: Vehicle): Record<string, string> {
  return {
    plate: v.plate,
    region: v.region,
    driver: v.driver,
    location: v.location,
    brand: v.brand,
    gw: v.gw,
    wheeler: v.wheeler,
    fuel_type: v.fuelType,
    vehicle_type: v.vehicleType,
    length: v.length,
    width: v.width,
    height: v.height,
    coding: v.coding,
  };
}

function rowToEntry(row: { id: string; plate: string; date: string; data: Record<string, unknown> }): Entry {
  const d = row.data || {};
  return {
    id: row.id,
    date: row.date || (d.date as string) || '',
    firstMile: d.firstMile as Entry['firstMile'],
    commissary: d.commissary as Entry['commissary'],
    stores: d.stores as Entry['stores'],
    lastMileArrival: d.lastMileArrival as string,
    odometer: d.odometer as Entry['odometer'],
    fuel: d.fuel as Entry['fuel'],
    costIncurred: d.costIncurred as Entry['costIncurred'],
    overtime: d.overtime as Entry['overtime'],
    laborCost: d.laborCost as Entry['laborCost'],
  };
}

function entryToRow(plate: string, entry: Entry): { id: string; plate: string; date: string | null; data: Record<string, unknown> } {
  return {
    id: entry.id || '',
    plate,
    date: entry.date || null,
    data: {
      date: entry.date,
      firstMile: entry.firstMile,
      commissary: entry.commissary,
      stores: entry.stores,
      lastMileArrival: entry.lastMileArrival,
      odometer: entry.odometer,
      fuel: entry.fuel,
      costIncurred: entry.costIncurred,
      overtime: entry.overtime,
      laborCost: entry.laborCost,
    },
  };
}
