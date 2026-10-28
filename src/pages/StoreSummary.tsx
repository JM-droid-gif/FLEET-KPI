import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { REGIONS, STORE_TYPE_LABEL, getStoreType, vehicleRegion } from '../lib/constants';
import { computeEntry, computeStoreDistances } from '../lib/compute';
import { money, monthLabel, num } from '../lib/helpers';
import type { Entry } from '../types';

function allMonthKeys(vehicles: { plate: string }[], entries: Record<string, { date: string }[]>): string[] {
  const set = new Set<string>();
  const now = new Date();
  set.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  Object.values(entries).forEach((list) => {
    (list || []).forEach((e) => {
      if (e.date) set.add(e.date.slice(0, 7));
    });
  });
  return Array.from(set).sort().reverse();
}

interface StoreAggRow {
  name: string;
  region: string;
  category: string;
  deliveries: number;
  drivers: Set<string>;
  plates: Set<string>;
  salesValue: number;
  fuelCost: number;
  fuelCostBySales: number;
}

function storeSummaryRows(
  vehicles: { plate: string; driver: string; region?: string }[],
  entries: Record<string, Entry[]>,
  monthKeyStr: string
): StoreAggRow[] {
  const map: Record<string, StoreAggRow> = {};
  vehicles.forEach((v) => {
    const region = vehicleRegion(v);
    const list = (entries[v.plate] || []).filter((e) => e.date && e.date.slice(0, 7) === monthKeyStr);
    list.forEach((e) => {
      const cpl = num(e.fuel && e.fuel.costPerLiter);
      const storeDistances = computeStoreDistances(e);
      (e.stores || []).forEach((st, idx) => {
        const name = (st.name || '').trim();
        if (!name) return;
        const key = region + '||' + name;
        if (!map[key]) {
          const type = getStoreType(name);
          map[key] = {
            name,
            region,
            category: st.category || (type ? STORE_TYPE_LABEL[type] : '') || '—',
            deliveries: 0,
            drivers: new Set(),
            plates: new Set(),
            salesValue: 0,
            fuelCost: 0,
            fuelCostBySales: 0,
          };
        }
        const row = map[key];
        row.deliveries += 1;
        if (v.driver) row.drivers.add(v.driver);
        if (v.plate) row.plates.add(v.plate);
        const cost = st.storedCost === '' || st.storedCost == null ? 0 : num(st.storedCost);
        row.salesValue += cost;
        const rate = num(st.ctdRate);
        const dist = storeDistances[idx];
        if (rate > 0 && dist != null) row.fuelCost += (dist / rate) * cpl;
        if (rate > 0 && cost > 0) row.fuelCostBySales += (cost / rate) * cpl;
      });
    });
  });
  return Object.values(map).sort((a, b) => b.salesValue - a.salesValue);
}

interface StoreDeliveryDetail {
  date: string;
  region: string;
  driver: string;
  plate: string;
  category: string;
  salesValue: number;
  fuelCost: number | null;
  fuelCostBySales: number | null;
}

function storeDeliveryDetails(
  vehicles: { plate: string; driver: string; region?: string }[],
  entries: Record<string, Entry[]>,
  monthKeyStr: string,
  storeName: string
): StoreDeliveryDetail[] {
  const out: StoreDeliveryDetail[] = [];
  vehicles.forEach((v) => {
    const list = (entries[v.plate] || []).filter((e) => e.date && e.date.slice(0, 7) === monthKeyStr);
    list.forEach((e) => {
      const cpl = num(e.fuel && e.fuel.costPerLiter);
      const storeDistances = computeStoreDistances(e);
      (e.stores || []).forEach((st, idx) => {
        const name = (st.name || '').trim();
        if (name !== storeName) return;
        const type = getStoreType(name);
        const category = st.category || (type ? STORE_TYPE_LABEL[type] : '') || '—';
        const cost = st.storedCost === '' || st.storedCost == null ? 0 : num(st.storedCost);
        const rate = num(st.ctdRate);
        const dist = storeDistances[idx];
        const fuelCost = rate > 0 && dist != null ? (dist / rate) * cpl : null;
        const fuelCostBySales = rate > 0 && cost > 0 ? (cost / rate) * cpl : null;
        out.push({ date: e.date, region: vehicleRegion(v), driver: v.driver || '—', plate: v.plate, category, salesValue: cost, fuelCost, fuelCostBySales });
      });
    });
  });
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}

function monthTotalLaborCost(
  vehicles: { plate: string; region?: string }[],
  entries: Record<string, Entry[]>,
  monthKeyStr: string
) {
  const byRegion: Record<string, { driver: number; helper: number; total: number }> = {};
  REGIONS.forEach((r) => {
    byRegion[r] = { driver: 0, helper: 0, total: 0 };
  });
  let driver = 0, helper = 0;
  vehicles.forEach((v) => {
    const region = vehicleRegion(v);
    const list = (entries[v.plate] || []).filter((e) => e.date && e.date.slice(0, 7) === monthKeyStr);
    list.forEach((e) => {
      const c = computeEntry(e);
      driver += c.driverCost;
      helper += c.helperCost;
      byRegion[region].driver += c.driverCost;
      byRegion[region].helper += c.helperCost;
      byRegion[region].total += c.laborCost;
    });
  });
  return { driver, helper, total: driver + helper, byRegion };
}

export function StoreSummary() {
  const { vehicles, entries, showDistanceFuelCost, toggleDistanceFuelCost, isAdmin, navigate } = useApp();
  const months = useMemo(() => allMonthKeys(vehicles, entries), [vehicles, entries]);
  const [selectedMonth, setSelectedMonth] = useState<string>(months[0] || '');
  const [selectedStore, setSelectedStore] = useState<string>('ALL');

  useEffect(() => {
    if (!isAdmin) navigate('#/dashboard');
  }, [isAdmin, navigate]);
  if (!isAdmin) return null;

  const currentMonth = months.includes(selectedMonth) ? selectedMonth : months[0] || '';
  const rows = storeSummaryRows(vehicles, entries, currentMonth);
  const currentStore =
    selectedStore !== 'ALL' && rows.some((r) => r.name === selectedStore) ? selectedStore : 'ALL';

  const totals = rows.reduce(
    (a, r) => ({
      deliveries: a.deliveries + r.deliveries,
      salesValue: a.salesValue + r.salesValue,
      fuelCost: a.fuelCost + r.fuelCost,
      fuelCostBySales: a.fuelCostBySales + r.fuelCostBySales,
    }),
    { deliveries: 0, salesValue: 0, fuelCost: 0, fuelCostBySales: 0 }
  );
  const totalLabor = monthTotalLaborCost(vehicles, entries, currentMonth);
  const storeNames = Array.from(new Set(rows.map((r) => r.name)));
  const storeSummaryColCount = showDistanceFuelCost ? 8 : 7;

  const storeRow = (r: StoreAggRow) => (
    <tr key={r.region + '|' + r.name}>
      <td>{r.name}</td>
      <td>
        <span className={`badge ${r.category === 'Owned' ? 'tag-owned' : r.category === 'Franchised' ? 'tag-franchised' : r.category === 'Daily' ? 'tag-daily' : ''}`}>
          {r.category}
        </span>
      </td>
      <td>{r.deliveries}</td>
      <td>{r.drivers.size ? Array.from(r.drivers).join(', ') : '—'}</td>
      <td>{r.plates.size ? Array.from(r.plates).join(', ') : '—'}</td>
      <td>{money(r.salesValue)}</td>
      {showDistanceFuelCost && <td>{money(r.fuelCost)}</td>}
      <td>{money(r.fuelCostBySales)}</td>
    </tr>
  );

  const tableRows = REGIONS.map((region) => {
    const inRegion = rows.filter((r) => r.region === region);
    const header = (
      <tr key={`h-${region}`}>
        <td colSpan={storeSummaryColCount} style={{ background: 'var(--ink)', color: '#fff', fontWeight: 700, letterSpacing: '.06em' }}>
          {region.toUpperCase()}
        </td>
      </tr>
    );
    if (!inRegion.length) {
      return (
        <Fragment key={`empty-${region}`}>
          {header}
          <tr>
            <td colSpan={storeSummaryColCount} style={{ color: 'var(--ink-soft)' }}>
              No deliveries logged for {region} this month.
            </td>
          </tr>
        </Fragment>
      );
    }
    const sub = inRegion.reduce(
      (a, r) => ({
        deliveries: a.deliveries + r.deliveries,
        salesValue: a.salesValue + r.salesValue,
        fuelCost: a.fuelCost + r.fuelCost,
        fuelCostBySales: a.fuelCostBySales + r.fuelCostBySales,
      }),
      { deliveries: 0, salesValue: 0, fuelCost: 0, fuelCostBySales: 0 }
    );
    return (
      <Fragment key={`region-${region}`}>
        {header}
        {inRegion.map(storeRow)}
        <tr className="total-row">
          <td colSpan={2}>{region} SUBTOTAL</td>
          <td>{sub.deliveries}</td>
          <td>—</td>
          <td>—</td>
          <td>{money(sub.salesValue)}</td>
          {showDistanceFuelCost && <td>{money(sub.fuelCost)}</td>}
          <td>{money(sub.fuelCostBySales)}</td>
        </tr>
      </Fragment>
    );
  });

  let detailBlock: React.ReactNode = null;
  if (currentStore !== 'ALL') {
    const details = storeDeliveryDetails(vehicles, entries, currentMonth, currentStore);
    const detailColCount = showDistanceFuelCost ? 8 : 7;
    detailBlock = (
      <>
        <div className="pageheader" style={{ marginTop: '22px' }}>
          <div>
            <div className="eyebrow">STORE DETAIL</div>
            <h1>{currentStore}</h1>
            <div className="meta">
              Every individual delivery to this store in {monthLabel(currentMonth)} — date, region, driver, plate, and cost breakdown.
            </div>
          </div>
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Region</th>
                <th>Driver</th>
                <th>Plate</th>
                <th>Category</th>
                <th>Sales Value</th>
                {showDistanceFuelCost && <th>Fuel Cost (Distance)</th>}
                <th>Fuel Cost (Sales Value)</th>
              </tr>
            </thead>
            <tbody>
              {details.length ? (
                details.map((d, i) => (
                  <tr key={i}>
                    <td>{d.date}</td>
                    <td>{d.region}</td>
                    <td>{d.driver}</td>
                    <td>{d.plate}</td>
                    <td>
                      <span className={`badge ${d.category === 'Owned' ? 'tag-owned' : d.category === 'Franchised' ? 'tag-franchised' : d.category === 'Daily' ? 'tag-daily' : ''}`}>
                        {d.category}
                      </span>
                    </td>
                    <td>{money(d.salesValue)}</td>
                    {showDistanceFuelCost && <td>{d.fuelCost == null ? '—' : money(d.fuelCost)}</td>}
                    <td>{d.fuelCostBySales == null ? '—' : money(d.fuelCostBySales)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={detailColCount} style={{ color: 'var(--ink-soft)' }}>
                    No deliveries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="pageheader">
        <div>
          <div className="eyebrow">ALL VEHICLES · ALL DRIVERS</div>
          <h1>Store Summary</h1>
          <div className="meta">
            How many deliveries each store received this month, which drivers/plates made them, and the total Sales Value and Fuel Cost tied to
            that store. Kept per month so you can always look back.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', minWidth: 0 }}>
          <label style={{ fontSize: '12px', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', paddingBottom: '8px' }}>
            <input type="checkbox" checked={showDistanceFuelCost} onChange={toggleDistanceFuelCost} /> Show Fuel Cost (Distance)
          </label>
          <div style={{ minWidth: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>MONTH</label>
            <select
              value={currentMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setSelectedStore('ALL');
              }}
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>STORE</label>
            <select value={currentStore} onChange={(e) => setSelectedStore(e.target.value)}>
              <option value="ALL">All Stores</option>
              {storeNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Store</th>
              <th>Category</th>
              <th>Deliveries</th>
              <th>Drivers</th>
              <th>Plate Number(s)</th>
              <th>Total Sales Value</th>
              {showDistanceFuelCost && <th>Fuel Cost (Distance basis)</th>}
              <th>Fuel Cost (Sales Value basis)</th>
            </tr>
          </thead>
          <tbody>
            {tableRows}
            <tr className="total-row">
              <td colSpan={2}>GRAND TOTAL</td>
              <td>{totals.deliveries}</td>
              <td>—</td>
              <td>—</td>
              <td>{money(totals.salesValue)}</td>
              {showDistanceFuelCost && <td>{money(totals.fuelCost)}</td>}
              <td>{money(totals.fuelCostBySales)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="hint" style={{ marginTop: '14px' }}>
        Fuel Cost (Distance basis) = (distance driven to reach that store ÷ its CTD Rate) × the trip's Cost per Liter. Fuel Cost (Sales Value
        basis) = (that store's Sales Value ÷ its CTD Rate) × Cost per Liter — shown side by side for comparison. Pick a store above to see every
        individual delivery to it.
      </div>

      <h2 style={{ margin: '18px 0 4px' }}>Fixed Cost (Labor) — {monthLabel(currentMonth)}</h2>
      <div className="hint" style={{ marginBottom: '8px' }}>
        Fixed Driver + Helper cost for the month, per region. Not split per store — labor is a fixed daily cost per trip, not attributable to any
        one stop.
      </div>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Region</th>
              <th>Total Driver Cost</th>
              <th>Total Helper Cost</th>
              <th>Total Fixed Cost (Labor)</th>
            </tr>
          </thead>
          <tbody>
            {REGIONS.map((region) => (
              <tr key={region}>
                <td>{region}</td>
                <td>{money(totalLabor.byRegion[region].driver)}</td>
                <td>{money(totalLabor.byRegion[region].helper)}</td>
                <td>{money(totalLabor.byRegion[region].total)}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td>GRAND TOTAL</td>
              <td>{money(totalLabor.driver)}</td>
              <td>{money(totalLabor.helper)}</td>
              <td>
                <strong>{money(totalLabor.total)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {detailBlock}
    </>
  );
}

function Fragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
