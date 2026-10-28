import type { Entry, EntryComputed, OdoAnomaly } from '../types';
import { num } from './helpers';

export function computeStoreDistances(e: Entry): (number | null)[] {
  const dep =
    e.odometer && e.odometer.departure !== '' && e.odometer.departure != null
      ? num(e.odometer.departure)
      : null;
  let prevOdo: number | null = dep;
  return (e.stores || []).map((st) => {
    const name = (st.name || '').trim();
    if (!name) return null;
    const hasOdo = st.odoIngress !== '' && st.odoIngress != null;
    if (!hasOdo || prevOdo == null) return null;
    const cur = num(st.odoIngress);
    const dist = cur - prevOdo;
    prevOdo = cur;
    return dist >= 0 ? dist : null;
  });
}

export function computeEntry(e: Entry): EntryComputed {
  const dep =
    e.odometer && e.odometer.departure !== '' && e.odometer.departure != null
      ? num(e.odometer.departure)
      : null;
  const arr =
    e.odometer && e.odometer.arrival !== '' && e.odometer.arrival != null
      ? num(e.odometer.arrival)
      : null;
  const km = dep != null && arr != null ? Math.max(0, arr - dep) : null;
  const activeStores = (e.stores || []).filter((st) => st.name && st.name.trim() !== '');
  const allStoredCostsComplete =
    activeStores.length > 0 &&
    activeStores.every(
      (st) => st.storedCost !== '' && st.storedCost != null && !isNaN(parseFloat(st.storedCost))
    );
  const storedCost = activeStores.reduce((s, st) => s + num(st.storedCost), 0);
  const nsv = allStoredCostsComplete ? storedCost : null;
  const cpl = num(e.fuel && e.fuel.costPerLiter);

  const storeDistances = computeStoreDistances(e);
  let litersAcc = 0;
  let litersKnown = false;
  e.stores.forEach((st, idx) => {
    if (!(st.name && st.name.trim() !== '')) return;
    const rate = num(st.ctdRate);
    const dist = storeDistances[idx];
    if (rate > 0 && dist != null) {
      litersAcc += dist / rate;
      litersKnown = true;
    }
  });
  const liters: number | null = litersKnown ? litersAcc : null;
  const fuelCost = liters != null ? liters * cpl : null;

  let litersBySalesAcc = 0;
  let litersBySalesKnown = false;
  activeStores.forEach((st) => {
    const rate = num(st.ctdRate);
    const cost = st.storedCost === '' || st.storedCost == null ? null : num(st.storedCost);
    if (rate > 0 && cost != null) {
      litersBySalesAcc += cost / rate;
      litersBySalesKnown = true;
    }
  });
  const litersBySales: number | null = litersBySalesKnown ? litersBySalesAcc : null;
  const fuelCostBySales = litersBySales != null ? litersBySales * cpl : null;

  const parking = num(e.costIncurred && e.costIncurred.parking);
  const gatePass = num(e.costIncurred && e.costIncurred.gatePass);
  const toll = num(e.costIncurred && e.costIncurred.tollFee);
  const variableCost = parking + gatePass + toll;
  const driverCost = num(e.laborCost && e.laborCost.driver);
  const helperCost = num(e.laborCost && e.laborCost.helper);
  const laborCost = driverCost + helperCost;
  const distCost = (fuelCostBySales != null ? fuelCostBySales : 0) + variableCost;
  const pct = nsv != null && nsv > 0 ? (distCost / nsv) * 100 : null;
  const kml = km != null && liters != null && liters > 0 ? km / liters : null;
  const storesVisited = (e.stores || []).filter((st) => st.name && st.name.trim() !== '').length;

  const firstMileEgress = e.firstMile && e.firstMile.egress;
  const firstMileIngress = e.firstMile && e.firstMile.ingress;
  const totalTransitMin = minDiffLocal(firstMileEgress, e.lastMileArrival);
  const totalDutyMin = minDiffLocal(firstMileIngress, e.lastMileArrival);
  const standardMin = num(e.overtime && e.overtime.standardHrs) * 60;
  const overtimeMin = totalDutyMin != null ? Math.max(0, totalDutyMin - standardMin) : null;

  return {
    km,
    nsv,
    storedCost,
    liters,
    cpl,
    fuelCost,
    litersBySales,
    fuelCostBySales,
    parking,
    gatePass,
    toll,
    variableCost,
    driverCost,
    helperCost,
    laborCost,
    distCost,
    pct,
    kml,
    storesVisited,
    totalTransitMin,
    totalDutyMin,
    overtimeMin,
  };
}

function minDiffLocal(startT: string, endT: string): number | null {
  const timeToMin = (t: string): number | null => {
    if (!t) return null;
    const parts = t.split(':');
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };
  const s = timeToMin(startT);
  const e = timeToMin(endT);
  if (s == null || e == null) return null;
  let d = e - s;
  if (d < 0) d += 1440;
  return d;
}

export function computeOdoAnomalies(e: Entry): OdoAnomaly[] {
  const dep =
    e.odometer && e.odometer.departure !== '' && e.odometer.departure != null
      ? num(e.odometer.departure)
      : null;
  const arr =
    e.odometer && e.odometer.arrival !== '' && e.odometer.arrival != null
      ? num(e.odometer.arrival)
      : null;
  const issues: OdoAnomaly[] = [];
  let prev: number | null = dep;
  let prevLabel = 'Start Odometer';
  (e.stores || []).forEach((st, i) => {
    if (st.odoIngress === '' || st.odoIngress == null) return;
    const v = num(st.odoIngress);
    if (dep != null && v < dep) {
      issues.push({
        i,
        field: `s${i}_odo`,
        msg: `Store ${i + 1} Ingress Odometer (${v}) is less than the Start Odometer (${dep}). Likely a typo — distance/CTD would compute wrong.`,
      });
    } else if (prev != null && v < prev) {
      issues.push({
        i,
        field: `s${i}_odo`,
        msg: `Store ${i + 1} Ingress Odometer (${v}) is less than ${prevLabel} (${prev}). Odometer readings should not go backwards within a trip.`,
      });
    } else if (arr != null && v > arr) {
      issues.push({
        i,
        field: `s${i}_odo`,
        msg: `Store ${i + 1} Ingress Odometer (${v}) exceeds the Arrival Odometer (${arr}).`,
      });
    } else {
      prev = v;
      prevLabel = `Store ${i + 1}'s Ingress Odometer`;
    }
  });
  return issues;
}
