import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { vehicleRegion } from '../lib/constants';
import { computeEntry } from '../lib/compute';
import { dayNameOf, fmtDateLong, fmtMins, isoDate, money, monthKey } from '../lib/helpers';

export function VehiclePage() {
  const {
    vehicles,
    entries,
    currentPlate,
    isAdmin,
    showDistanceFuelCost,
    toggleDistanceFuelCost,
    navigate,
    openModal,
    deleteVehicle,
    deleteEntry,
  } = useApp();

  const v = vehicles.find((x) => x.plate === currentPlate);
  useEffect(() => {
    if (!v) navigate('#/dashboard');
  }, [v, navigate]);
  if (!v) return null;

  const list = (entries[v.plate] || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  const thisMonth = monthKey(isoDate(new Date()));

  let totalDistance = 0, monthLiters = 0, monthDieselCost = 0;
  list.forEach((e) => {
    const c = computeEntry(e);
    if (c.km) totalDistance += c.km;
    if (monthKey(e.date || '') === thisMonth) {
      monthLiters += c.litersBySales || 0;
      monthDieselCost += c.fuelCostBySales || 0;
    }
  });

  return (
    <>
      <div className="pageheader">
        <div>
          <div className="eyebrow">VEHICLE MANIFEST</div>
          <h1 className="mono">{v.plate}</h1>
          <div className="meta">
            {v.driver || 'Unassigned driver'} · {v.location || '—'} · {vehicleRegion(v)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {isAdmin && (
            <>
              <button className="btn ghost" onClick={() => openModal({ type: 'vehicle-edit', plate: v.plate })}>
                Edit Profile
              </button>
              <button
                className="btn danger"
                onClick={async () => {
                  if (!confirm(`Remove ${v.plate} and all of its logged trips? This cannot be undone.`)) return;
                  await deleteVehicle(v.plate);
                  navigate('#/dashboard');
                }}
              >
                Delete Vehicle
              </button>
            </>
          )}
          <button className="btn amber" onClick={() => openModal({ type: 'entry', plate: v.plate })}>
            + Add Daily Entry
          </button>
        </div>
      </div>

      <div className="profile-panel">
        <div>
          <div className="hint" style={{ marginBottom: '10px' }}>
            VEHICLE PROFILE
          </div>
          <div className="profile-grid">
            <div className="pfield">
              <div className="k">VEHICLE BRAND</div>
              <div className="v">{v.brand || '—'}</div>
            </div>
            <div className="pfield">
              <div className="k">VEHICLE TYPE</div>
              <div className="v">{v.vehicleType || '—'}</div>
            </div>
            <div className="pfield">
              <div className="k">GW</div>
              <div className="v">{v.gw || '—'}</div>
            </div>
            <div className="pfield">
              <div className="k">WHEELER</div>
              <div className="v">{v.wheeler || '—'}</div>
            </div>
            <div className="pfield">
              <div className="k">FUEL TYPE</div>
              <div className="v">{v.fuelType || '—'}</div>
            </div>
            <div className="pfield">
              <div className="k">CODING DAY</div>
              <div className="v">{v.coding || '—'}</div>
            </div>
            <div className="pfield">
              <div className="k">DIMENSIONS (L×W×H)</div>
              <div className="v">
                {v.length || '—'} × {v.width || '—'} × {v.height || '—'}
              </div>
            </div>
            <div className="pfield">
              <div className="k">REGION</div>
              <div className="v">{vehicleRegion(v)}</div>
            </div>
            <div className="pfield">
              <div className="k">BASE LOCATION</div>
              <div className="v">{v.location || '—'}</div>
            </div>
          </div>
        </div>
        <div className="kpi-box">
          <h4>FLEET KPI</h4>
          <div className="kpi-item">
            <span className="lbl">Total Distance</span>
            <span className="val">{totalDistance.toFixed(0)} km</span>
          </div>
          <div className="kpi-item">
            <span className="lbl">Monthly Total Liters Top Up</span>
            <span className="val">{monthLiters.toFixed(1)} L</span>
          </div>
          <div className="kpi-item">
            <span className="lbl">Monthly Diesel Consumption</span>
            <span className="val">{money(monthDieselCost)}</span>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Daily Trip Log</h2>
          <label style={{ fontSize: '12px', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input type="checkbox" checked={showDistanceFuelCost} onChange={toggleDistanceFuelCost} /> Show Fuel Cost (Distance)
          </label>
        </div>
        {list.length ? (
          <div className="scrollx">
            <table className="datatable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Drops</th>
                  <th>NSV</th>
                  <th>Distance</th>
                  {showDistanceFuelCost && <th>Fuel Cost (Distance)</th>}
                  <th>Fuel Cost (Sales Value)</th>
                  <th>Fixed Cost (Labor)</th>
                  <th>Dist. Cost</th>
                  <th>%</th>
                  <th>Dispatch Time</th>
                  <th>OT</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((e) => {
                  const c = computeEntry(e);
                  return (
                    <tr key={e.id}>
                      <td className="mono">{fmtDateLong(e.date)}</td>
                      <td>{dayNameOf(e.date)}</td>
                      <td>{c.storesVisited}</td>
                      <td>{money(c.nsv || 0)}</td>
                      <td>{c.km == null ? '—' : c.km + ' km'}</td>
                      {showDistanceFuelCost && <td>{money(c.fuelCost || 0)}</td>}
                      <td>{money(c.fuelCostBySales || 0)}</td>
                      <td>{money(c.laborCost)}</td>
                      <td>{money(c.distCost)}</td>
                      <td className={c.pct == null ? '' : c.pct <= 10 ? 'pct-good' : 'pct-bad'}>
                        {c.pct == null ? '—' : c.pct.toFixed(1) + '%'}
                      </td>
                      <td>{fmtMins(c.totalTransitMin)}</td>
                      <td>{fmtMins(c.overtimeMin)}</td>
                      <td className="rowactions">
                        <button className="btn ghost small" onClick={() => openModal({ type: 'entry', plate: v.plate, entryId: e.id })}>
                          Edit
                        </button>
                        {isAdmin && (
                          <button
                            className="btn danger small"
                            onClick={async () => {
                              if (!confirm('Delete this trip entry?')) return;
                              await deleteEntry(v.plate, e.id!);
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <h3>No trips logged yet</h3>
            <p>Use “+ Add Daily Entry” to record the first route for {v.plate}.</p>
          </div>
        )}
      </div>
    </>
  );
}
