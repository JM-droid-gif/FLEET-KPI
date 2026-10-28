export type Region = 'Manila' | 'Cebu';
export type StoreType = 'owned' | 'franchised' | 'daily';
export type Role = 'admin' | 'user';

export interface Account {
  username: string;
  passwordHash: string;
  role: Role;
  isProtected?: boolean;
}

export interface CurrentUser {
  username: string;
  role: Role;
}

export interface Vehicle {
  plate: string;
  region: Region | string;
  driver: string;
  location: string;
  brand: string;
  gw: string;
  wheeler: string;
  fuelType: string;
  vehicleType: string;
  length: string;
  width: string;
  height: string;
  coding: string;
}

export interface StoreStop {
  name: string;
  category: string;
  nsv: string;
  ingress: string;
  egress: string;
  odoIngress: string;
  loadStart: string;
  loadEnd: string;
  storedCost: string;
  ctdRate: string;
}

export interface TimeBlock {
  ingress: string;
  egress: string;
  loadStart: string;
  loadEnd: string;
}

export interface Odometer {
  departure: string;
  arrival: string;
}

export interface Fuel {
  orNum: string;
  liters: string;
  costPerLiter: string;
}

export interface CostIncurred {
  orNum: string;
  parking: string;
  gatePass: string;
  tollFee: string;
}

export interface Overtime {
  standardHrs: string;
}

export interface LaborCost {
  driver: string;
  helper: string;
}

export interface Entry {
  id: string | null;
  date: string;
  firstMile: TimeBlock;
  commissary: TimeBlock;
  stores: StoreStop[];
  lastMileArrival: string;
  odometer: Odometer;
  fuel: Fuel;
  costIncurred: CostIncurred;
  overtime: Overtime;
  laborCost: LaborCost;
}

export interface EntryComputed {
  km: number | null;
  nsv: number | null;
  storedCost: number;
  liters: number | null;
  cpl: number;
  fuelCost: number | null;
  litersBySales: number | null;
  fuelCostBySales: number | null;
  parking: number;
  gatePass: number;
  toll: number;
  variableCost: number;
  driverCost: number;
  helperCost: number;
  laborCost: number;
  distCost: number;
  pct: number | null;
  kml: number | null;
  storesVisited: number;
  totalTransitMin: number | null;
  totalDutyMin: number | null;
  overtimeMin: number | null;
}

export interface OdoAnomaly {
  i: number;
  field: string;
  msg: string;
}

export interface StoreScheduleEntry {
  name: string;
  type: StoreType;
}

export type StoreSchedule = Record<string, StoreScheduleEntry[]>;

export interface CtdRateOption {
  value: number;
  label: string;
}
