import type { Entry } from '../types';
import { blankEntry, blankStore } from './constants';

export async function hashPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function num(v: unknown): number {
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

export function money(n: number): string {
  return '₱' + (Math.round(n * 100) / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function uid(): string {
  return 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function slug(plate: string): string {
  return 'fleet_entries_' + String(plate).replace(/[^a-zA-Z0-9]+/g, '_');
}

export function timeToMin(t: string): number | null {
  if (!t) return null;
  const parts = t.split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

export function minDiff(startT: string, endT: string): number | null {
  const s = timeToMin(startT);
  const e = timeToMin(endT);
  if (s == null || e == null) return null;
  let d = e - s;
  if (d < 0) d += 1440;
  return d;
}

export function fmtMins(mins: number | null): string {
  if (mins == null) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function dayNameOf(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
}

export function fmtDateLong(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return isoDate(d);
}

export function weekLabel(mondayStr: string): string {
  const start = new Date(mondayStr + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}\u2013${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} \u2013 ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${end.getFullYear()}`;
}

export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function normalizeEntry(e: Entry): Entry {
  const blank = blankEntry();
  return {
    ...blank,
    ...e,
    firstMile: { ...(e.firstMile || {}), ingress: e.firstMile?.ingress ?? '', egress: e.firstMile?.egress ?? '', loadStart: e.firstMile?.loadStart ?? '', loadEnd: e.firstMile?.loadEnd ?? '' },
    commissary: { ...(e.commissary || {}), ingress: e.commissary?.ingress ?? '', egress: e.commissary?.egress ?? '', loadStart: e.commissary?.loadStart ?? '', loadEnd: e.commissary?.loadEnd ?? '' },
    overtime: { ...(e.overtime || {}), standardHrs: e.overtime?.standardHrs ?? '8' },
    laborCost: { ...(e.laborCost || {}), driver: e.laborCost?.driver ?? '', helper: e.laborCost?.helper ?? '' },
    odometer: { ...(e.odometer || {}), departure: e.odometer?.departure ?? '', arrival: e.odometer?.arrival ?? '' },
    fuel: { ...(e.fuel || {}), orNum: e.fuel?.orNum ?? '', liters: e.fuel?.liters ?? '', costPerLiter: e.fuel?.costPerLiter ?? '' },
    costIncurred: { ...(e.costIncurred || {}), orNum: e.costIncurred?.orNum ?? '', parking: e.costIncurred?.parking ?? '', gatePass: e.costIncurred?.gatePass ?? '', tollFee: e.costIncurred?.tollFee ?? '' },
    stores: (e.stores || []).map((st) => ({ ...blankStore(), ...(st || {}) })),
  };
}
