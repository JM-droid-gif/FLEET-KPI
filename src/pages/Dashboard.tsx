import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { REGIONS, vehicleRegion } from '../lib/constants';
import { computeEntry } from '../lib/compute';
import { fmtDateLong, isoDate, money, monthLabel, slug } from '../lib/helpers';

function allMonthKeys(
  vehicles: { plate: string }[],
  entries: Record<string, { date: string }[]>
): string[] {
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

interface MonthRow {
  plate: string;
  region: string;
  trips: number;
  tsv: number;
  fuel: number;
  fuelBySales: number;
  variable: number;
  dist: number;
  pct: number | null;
  liters: number;
  labor: number;
}

function monthSummaryRows(
  vehicles: import('../types').Vehicle[],
  entries: Record<string, import('../types').Entry[]>,
  monthKeyStr: string
): MonthRow[] {
  return vehicles.map((v) => {
    const list = (entries[v.plate] || []).filter((e) => e.date && e.date.slice(0, 7) === monthKeyStr);
    let tsv = 0, fuel = 0, fuelBySales = 0, variable = 0, liters = 0, labor = 0;
    list.forEach((e) => {
      const c = computeEntry(e);
      tsv += c.nsv || 0;
      fuel += c.fuelCost || 0;
      fuelBySales += c.fuelCostBySales || 0;
      variable += c.variableCost;
      liters += c.liters || 0;
      labor += c.laborCost;
    });
    const dist = fuelBySales + variable;
    const pct = tsv > 0 ? (dist / tsv) * 100 : null;
    return { plate: v.plate, region: vehicleRegion(v), trips: list.length, tsv, fuel, fuelBySales, variable, dist, pct, liters, labor };
  });
}

export function Dashboard() {
  const { vehicles, entries, showDistanceFuelCost, toggleDistanceFuelCost, isAdmin, navigate } = useApp();
  const months = useMemo(() => allMonthKeys(vehicles, entries), [vehicles, entries]);
  const [selectedMonth, setSelectedMonth] = useState<string>(months[0] || '');

  const currentMonth = months.includes(selectedMonth) ? selectedMonth : months[0] || '';
  const rows = monthSummaryRows(vehicles, entries, currentMonth);

  const totals = rows.reduce(
    (a, r) => ({
      trips: a.trips + r.trips,
      tsv: a.tsv + r.tsv,
      fuel: a.fuel + r.fuel,
      fuelBySales: a.fuelBySales + r.fuelBySales,
      variable: a.variable + r.variable,
      dist: a.dist + r.dist,
      liters: a.liters + r.liters,
      labor: a.labor + r.labor,
    }),
    { trips: 0, tsv: 0, fuel: 0, fuelBySales: 0, variable: 0, dist: 0, liters: 0, labor: 0 }
  );
  const totalPct = totals.tsv > 0 ? (totals.dist / totals.tsv) * 100 : null;
  const dashColCount = showDistanceFuelCost ? 9 : 8;

  const vehicleRow = (r: MonthRow) => (
    <tr key={r.plate}>
      <td className="mono">{r.plate}</td>
      <td>{r.trips}</td>
      <td>{money(r.tsv)}</td>
      {showDistanceFuelCost && <td>{money(r.fuel)}</td>}
      <td>{money(r.fuelBySales)}</td>
      <td>{money(r.labor)}</td>
      <td>{money(r.variable)}</td>
      <td>{money(r.dist)}</td>
      <td className={r.pct == null ? '' : r.pct <= 10 ? 'pct-good' : 'pct-bad'}>
        {r.pct == null ? '—' : r.pct.toFixed(1) + '%'}
      </td>
    </tr>
  );

  const tableRows = REGIONS.map((region) => {
    const inRegion = rows.filter((r) => r.region === region);
    const header = (
      <tr key={`h-${region}`}>
        <td colSpan={dashColCount} style={{ background: 'var(--ink)', color: '#fff', fontWeight: 700, letterSpacing: '.06em' }}>
          {region.toUpperCase()}
        </td>
      </tr>
    );
    if (!inRegion.length) {
      return (
        <FragmentByKey key={`empty-${region}`}>
          {header}
          <tr>
            <td colSpan={dashColCount} style={{ color: 'var(--ink-soft)' }}>
              No vehicles assigned to {region} yet.
            </td>
          </tr>
        </FragmentByKey>
      );
    }
    const sub = inRegion.reduce(
      (a, r) => ({
        trips: a.trips + r.trips,
        tsv: a.tsv + r.tsv,
        fuel: a.fuel + r.fuel,
        fuelBySales: a.fuelBySales + r.fuelBySales,
        variable: a.variable + r.variable,
        dist: a.dist + r.dist,
        labor: a.labor + r.labor,
      }),
      { trips: 0, tsv: 0, fuel: 0, fuelBySales: 0, variable: 0, dist: 0, labor: 0 }
    );
    const subPct = sub.tsv > 0 ? (sub.dist / sub.tsv) * 100 : null;
    return (
      <FragmentByKey key={`region-${region}`}>
        {header}
        {inRegion.map(vehicleRow)}
        <tr className="total-row">
          <td>{region} SUBTOTAL</td>
          <td>{sub.trips}</td>
          <td>{money(sub.tsv)}</td>
          {showDistanceFuelCost && <td>{money(sub.fuel)}</td>}
          <td>{money(sub.fuelBySales)}</td>
          <td>{money(sub.labor)}</td>
          <td>{money(sub.variable)}</td>
          <td>{money(sub.dist)}</td>
          <td className={subPct == null ? '' : subPct <= 10 ? 'pct-good' : 'pct-bad'}>
            {subPct == null ? '—' : subPct.toFixed(1) + '%'}
          </td>
        </tr>
      </FragmentByKey>
    );
  });

  const cards = vehicles.map((v) => {
    const list = entries[v.plate] || [];
    const monthList = list.filter((e) => e.date && e.date.slice(0, 7) === currentMonth);
    let monthDist = 0;
    monthList.forEach((e) => {
      monthDist += computeEntry(e).distCost;
    });
    return (
      <div className="vcard" key={v.plate}>
        <div className="plate">{v.plate}</div>
        <div className="driver">{v.driver || 'Unassigned driver'}</div>
        <div className="specs">
          <div>
            <b>{v.brand || '—'}</b>
          </div>
          <div>
            {v.wheeler || '—'} · {v.gw || '—'} GW
          </div>
          <div className="vehicle-description" title={v.vehicleType || '—'}>{v.vehicleType || '—'}</div>
          <div>Coding: {v.coding || '—'}</div>
        </div>
        <div className="stat-row">
          <div className="stat">
            <div className="num">{monthList.length}</div>
            <div className="lbl">TRIPS THIS MONTH</div>
          </div>
          <div className="stat">
            <div className="num">{money(monthDist)}</div>
            <div className="lbl">DIST. COST (MO)</div>
          </div>
        </div>
        <button className="btn ghost go" onClick={() => navigate('#/vehicle/' + encodeURIComponent(slug(v.plate)))}>
          Open Trip Log →
        </button>
      </div>
    );
  });

  return (
    <>
      <div className="pageheader">
        <div>
          <div className="eyebrow">FLEET OVERVIEW</div>
          <h1>Dashboard</h1>
          <div className="meta">
            {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'} on the Mandaluyong distribution route ·{' '}
            {fmtDateLong(isoDate(new Date()))}
          </div>
        </div>
      </div>

      <div className="grid-cards">
        {cards.length ? (
          cards
        ) : (
          <div className="empty">
            <h3>No vehicles yet</h3>
            <p>Add your first vehicle to start logging trips.</p>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="section">
          <div className="section-title">
            <h2>Monthly Distribution Cost</h2>
            <div className="weekpick">
              <label style={{ fontSize: '12px', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={showDistanceFuelCost} onChange={toggleDistanceFuelCost} /> Show Fuel Cost (Distance)
              </label>
              <label htmlFor="monthSelect" className="hint" style={{ margin: 0 }}>
                Month of
              </label>
              <select
                id="monthSelect"
                value={currentMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="scrollx">
            <table className="datatable">
              <thead>
                <tr>
                  <th>Vehicle Plate</th>
                  <th>Monthly Trip</th>
                  <th>TSV</th>
                  {showDistanceFuelCost && <th>Fuel (Distance)</th>}
                  <th>Fuel (Sales Value)</th>
                  <th>Fixed Cost (Labor)</th>
                  <th>Variable Cost</th>
                  <th>Dist/Cost</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {tableRows}
                <tr className="total-row">
                  <td>GRAND TOTAL</td>
                  <td>{totals.trips}</td>
                  <td>{money(totals.tsv)}</td>
                  {showDistanceFuelCost && <td>{money(totals.fuel)}</td>}
                  <td>{money(totals.fuelBySales)}</td>
                  <td>{money(totals.labor)}</td>
                  <td>{money(totals.variable)}</td>
                  <td>{money(totals.dist)}</td>
                  <td className={totalPct == null ? '' : totalPct <= 10 ? 'pct-good' : 'pct-bad'}>
                    {totalPct == null ? '—' : totalPct.toFixed(1) + '%'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="hint" style={{ marginTop: '8px' }}>
            TSV = total sales value delivered (sum of NSV across stops). Fuel (Sales Value) is shown by default; tick the box above to also show
            Fuel (Distance basis) for comparison. Dist/Cost = fuel (Sales Value basis) + parking/gate/toll costs. % = Dist/Cost ÷ TSV. Select a
            month above to update the totals.
          </div>
        </div>
      )}
    </>
  );
}

function FragmentByKey({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
