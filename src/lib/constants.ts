import type { CtdRateOption, Region, StoreSchedule, StoreType, Vehicle, Account } from '../types';

export const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export const DEFAULT_VEHICLES: Vehicle[] = [
  { plate: 'NIO 4192', region: 'Manila', driver: 'Joe Marie Bagatela', location: 'Mandaluyong', brand: 'Isuzu Elf', gw: '4200', wheeler: '6W', fuelType: 'Diesel', vehicleType: 'Reefer Truck with Ambient Side', length: '12ft', width: '7ft', height: '5ft', coding: 'Monday' },
  { plate: 'GEB 4697', region: 'Manila', driver: 'Noriel Sadion', location: 'Mandaluyong', brand: 'Isuzu Elf', gw: '3800', wheeler: '4W', fuelType: 'Diesel', vehicleType: 'Reefer Truck', length: '10.16ft', width: '5.33ft', height: '5.33ft', coding: 'Thursday' },
  { plate: 'PIX 954', region: 'Manila', driver: 'Juhnie Bongon', location: 'Mandaluyong', brand: 'Isuzu ELF', gw: '3800', wheeler: '4W', fuelType: 'Diesel', vehicleType: 'Refrigerated Truck', length: '10.16ft', width: '5.33ft', height: '5.33ft', coding: 'Tuesday' },
];

export const REGIONS: Region[] = ['Manila', 'Cebu'];

export const DEFAULT_ACCOUNTS: Account[] = [
  { username: 'admin', passwordHash: 'ed0cdb31c8090172a14f0564afd67ed3d0ef99ecffcdc20552f112b02b90c653', role: 'admin', isProtected: true },
];

export function vehicleRegion(v: { region?: Region | string }): Region {
  const r = v && v.region ? String(v.region).trim() : '';
  return (REGIONS as readonly string[]).includes(r) ? (r as Region) : REGIONS[0];
}

export const STORE_SCHEDULE: StoreSchedule = {
  Monday: [
    { name: 'STA LUCIA', type: 'owned' }, { name: 'ADB', type: 'owned' }, { name: 'PAYMAYA', type: 'owned' },
    { name: 'GLORIETA 5', type: 'owned' }, { name: 'NAIA 3', type: 'owned' }, { name: 'NAIA 3 LEVEL 1', type: 'owned' },
    { name: 'NAIA 3 LEVEL 3', type: 'owned' }, { name: 'ONE AYALA', type: 'daily' }, { name: 'GREEN HILLS', type: 'owned' },
    { name: 'MAGINHAWA', type: 'owned' }, { name: 'ROLEX', type: 'owned' }, { name: 'ROBINSONS MANILA', type: 'owned' },
    { name: 'EAST WOOD', type: 'franchised' }, { name: 'DAILY MARIKINA', type: 'franchised' }, { name: 'CALAMBA', type: 'franchised' },
  ],
  Tuesday: [
    { name: 'SM LIGHT', type: 'owned' }, { name: 'MEGAMALL', type: 'owned' }, { name: 'GREENFIELD', type: 'owned' },
    { name: 'SM MOA DEPT.', type: 'owned' }, { name: 'SM MOA WING', type: 'owned' }, { name: 'FESTIVAL MALL', type: 'owned' },
    { name: 'NAIA 3', type: 'owned' }, { name: 'NAIA 3 LEVEL 1', type: 'owned' }, { name: 'NAIA 3 LEVEL 3', type: 'owned' },
    { name: 'SOUTHMALL', type: 'daily' }, { name: 'THREE WORLD', type: 'daily' }, { name: 'UPTOWN BGC', type: 'daily' },
  ],
  Wednesday: [
    { name: 'OASIS SAN LAZARO', type: 'owned' }, { name: 'SAN LAZARO DAILY', type: 'owned' }, { name: 'SM MANILA', type: 'owned' },
    { name: 'GREEN HILLS', type: 'owned' }, { name: 'PWU', type: 'owned' }, { name: 'GREEN R.', type: 'owned' },
    { name: 'ROBINSONS MANILA', type: 'owned' }, { name: 'NAIA 3', type: 'owned' }, { name: 'NAIA 3 LEVEL 1', type: 'owned' },
    { name: 'NAIA 3 LEVEL 3', type: 'owned' }, { name: 'STARMILLS', type: 'franchised' }, { name: 'SM NORTH', type: 'franchised' },
    { name: 'BAUAN', type: 'franchised' }, { name: 'CONGRESSIONAL', type: 'franchised' }, { name: 'SCOUT GANDIA', type: 'franchised' },
    { name: 'BICOL', type: 'franchised' }, { name: 'CAL COURTYARD', type: 'franchised' }, { name: 'SM LEGAZPI', type: 'franchised' },
  ],
  Thursday: [
    { name: 'MAGINHAWA', type: 'owned' }, { name: 'STA LUCIA', type: 'owned' }, { name: 'SAN JUAN', type: 'owned' },
    { name: 'ADB', type: 'owned' }, { name: 'ROLEX', type: 'owned' }, { name: 'GREENFIELD', type: 'owned' },
    { name: 'SM LIGHT', type: 'owned' }, { name: 'NAIA 3', type: 'owned' }, { name: 'NAIA 3 LEVEL 1', type: 'owned' },
    { name: 'NAIA 3 LEVEL 3', type: 'owned' }, { name: 'FESTIVAL MALL', type: 'owned' }, { name: 'MARIKINA', type: 'franchised' },
    { name: 'EVER GOTESCO', type: 'franchised' }, { name: 'SAN PABLO', type: 'franchised' },
  ],
  Friday: [
    { name: 'MEGAMALL', type: 'owned' }, { name: 'GLORIETA 5', type: 'owned' }, { name: 'GREEN HILLS', type: 'owned' },
    { name: 'SOUTHMALL', type: 'daily' }, { name: 'THREE WORLD', type: 'daily' }, { name: 'UPTOWN BGC', type: 'daily' },
    { name: 'DASMA', type: 'franchised' }, { name: 'FESTIVAL MALL', type: 'owned' },
  ],
  Saturday: [
    { name: 'GREEN R.', type: 'owned' }, { name: 'LAZARO DAILY', type: 'daily' }, { name: 'SM MANILA', type: 'owned' },
    { name: 'SM LIGHT', type: 'owned' }, { name: 'MOA DEPT', type: 'owned' }, { name: 'SM MOA WING', type: 'owned' },
    { name: 'NAIA 3', type: 'owned' }, { name: 'NAIA 3 LEVEL 1', type: 'owned' }, { name: 'NAIA 3 LEVEL 3', type: 'owned' },
    { name: 'GREENFIELD', type: 'owned' }, { name: 'ROBINSONS MANILA', type: 'owned' }, { name: 'PWU', type: 'owned' },
    { name: 'STA LUCIA - LALAMOVE', type: 'daily' },
  ],
  Sunday: [],
};

export const STORE_TYPE_LABEL: Record<StoreType, string> = {
  owned: 'Owned',
  franchised: 'Franchised',
  daily: 'Daily',
};

export const CTD_RATE_OPTIONS: CtdRateOption[] = [
  { value: 2131, label: '₱2,131 — Franchised (Standard)' },
  { value: 800, label: '₱800 — Franchised (Cebu)' },
  { value: 300, label: '₱300 — Franchised (Cebu)' },
  { value: 1000, label: '₱1,000 — Owned' },
];

export function getStoreType(name: string): StoreType | null {
  if (!name) return null;
  const clean = name.trim().toLowerCase();
  for (const day of Object.keys(STORE_SCHEDULE)) {
    const hit = STORE_SCHEDULE[day].find((s) => s.name.toLowerCase() === clean);
    if (hit) return hit.type;
  }
  return null;
}

export function storesForDay(dayName: string) {
  return STORE_SCHEDULE[dayName] || [];
}

export function defaultCtdRateForCategory(category: string): string {
  const c = String(category || '').trim().toLowerCase();
  if (c === 'franchised') return '2131';
  if (c === 'owned') return '1000';
  return '';
}

export function classifyCtdPct(pct: number | null): { label: string; color: string } {
  if (pct == null || isNaN(pct)) return { label: '—', color: 'inherit' };
  if (pct < 4) return { label: 'Normal', color: '#111827' };
  if (pct < 6) return { label: 'Elevated', color: '#2563eb' };
  return { label: 'High', color: '#dc2626' };
}

export function blankStore(): import('../types').StoreStop {
  return { name: '', category: '', nsv: '', ingress: '', egress: '', odoIngress: '', loadStart: '', loadEnd: '', storedCost: '', ctdRate: '' };
}

export function blankEntry(): import('../types').Entry {
  return {
    id: null,
    date: '',
    firstMile: { ingress: '', egress: '', loadStart: '', loadEnd: '' },
    commissary: { ingress: '', egress: '', loadStart: '', loadEnd: '' },
    stores: [0, 1, 2, 3, 4, 5].map(blankStore),
    lastMileArrival: '',
    odometer: { departure: '', arrival: '' },
    fuel: { orNum: '', liters: '', costPerLiter: '' },
    costIncurred: { orNum: '', parking: '', gatePass: '', tollFee: '' },
    overtime: { standardHrs: '8' },
    laborCost: { driver: '', helper: '' },
  };
}
