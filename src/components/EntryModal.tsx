import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from './Modal';
import {
  CTD_RATE_OPTIONS,
  STORE_TYPE_LABEL,
  blankEntry,
  classifyCtdPct,
  defaultCtdRateForCategory,
  getStoreType,
  storesForDay,
} from '../lib/constants';
import { computeEntry, computeOdoAnomalies } from '../lib/compute';
import { dayNameOf, fmtMins, minDiff, money, normalizeEntry, num } from '../lib/helpers';
import type { Entry, StoreStop } from '../types';

export function EntryModal() {
  const { modal, entries, lastCpl, showDistanceFuelCost, toggleDistanceFuelCost, saveEntry, closeModal } = useApp();
  const plate = modal.plate || '';
  const editingId = modal.entryId || null;
  const list = entries[plate] || [];
  const editing = editingId ? list.find((x) => x.id === editingId) : null;

  const [form, setForm] = useState<Entry>(() => {
    if (editing) return normalizeEntry(JSON.parse(JSON.stringify(editing)));
    const e = blankEntry();
    if (lastCpl) e.fuel.costPerLiter = lastCpl;
    return e;
  });

  const computed = useMemo(() => computeEntry(form), [form]);
  const odoIssues = useMemo(() => computeOdoAnomalies(form), [form]);
  const dayStoreList = useMemo(() => storesForDay(form.date ? dayNameOf(form.date) : ''), [form.date]);

  const update = (patch: Partial<Entry>) => setForm((f) => ({ ...f, ...patch }));
  const updateFirstMile = (patch: Partial<Entry['firstMile']>) =>
    setForm((f) => ({ ...f, firstMile: { ...f.firstMile, ...patch } }));
  const updateCommissary = (patch: Partial<Entry['commissary']>) =>
    setForm((f) => ({ ...f, commissary: { ...f.commissary, ...patch } }));
  const updateStore = (i: number, patch: Partial<StoreStop>) =>
    setForm((f) => ({ ...f, stores: f.stores.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }));
  const updateOdometer = (patch: Partial<Entry['odometer']>) =>
    setForm((f) => ({ ...f, odometer: { ...f.odometer, ...patch } }));
  const updateFuel = (patch: Partial<Entry['fuel']>) =>
    setForm((f) => ({ ...f, fuel: { ...f.fuel, ...patch } }));
  const updateCostIncurred = (patch: Partial<Entry['costIncurred']>) =>
    setForm((f) => ({ ...f, costIncurred: { ...f.costIncurred, ...patch } }));
  const updateOvertime = (patch: Partial<Entry['overtime']>) =>
    setForm((f) => ({ ...f, overtime: { ...f.overtime, ...patch } }));
  const updateLabor = (patch: Partial<Entry['laborCost']>) =>
    setForm((f) => ({ ...f, laborCost: { ...f.laborCost, ...patch } }));

  const onStoreNameInput = (i: number, name: string) => {
    const type = getStoreType(name);
    if (type) {
      const cat = form.stores[i].category || STORE_TYPE_LABEL[type];
      let ctdRate = form.stores[i].ctdRate;
      if (!ctdRate) {
        const suggested = defaultCtdRateForCategory(cat);
        if (suggested) ctdRate = suggested;
      }
      updateStore(i, { name, category: cat, ctdRate });
    } else {
      updateStore(i, { name });
    }
  };

  const activeStores = form.stores.filter((st) => st.name && st.name.trim() !== '');
  const allStoredCostsComplete =
    activeStores.length > 0 &&
    activeStores.every((st) => st.storedCost !== '' && st.storedCost != null && !isNaN(parseFloat(st.storedCost)));
  const totalStoreCost = activeStores.reduce((sum, st) => sum + num(st.storedCost), 0);

  const totalDutyMin = minDiff(form.firstMile.ingress, form.lastMileArrival);
  const standardMin = num(form.overtime.standardHrs) * 60;
  const overtimeMin = totalDutyMin != null ? Math.max(0, totalDutyMin - standardMin) : null;

  const save = async () => {
    if (!form.date) { alert('Please set the trip date.'); return; }
    if (odoIssues.length) {
      alert(
        'Cannot save — odometer anomaly detected:\n\n' +
          odoIssues.map((x) => '• ' + x.msg).join('\n') +
          '\n\nPlease correct the flagged Ingress Odometer value(s) before saving.'
      );
      return;
    }
    // nsv mirrors storedCost per original logic
    const toSave: Entry = {
      ...form,
      stores: form.stores.map((st) => ({ ...st, nsv: st.storedCost })),
    };
    await saveEntry(plate, toSave, editingId);
    closeModal();
  };

  return (
    <Modal
      title={editing ? `Edit Trip — ${plate}` : `Add Daily Entry — ${plate}`}
      footer={
        <>
          <button className="btn ghost" onClick={closeModal}>
            Cancel
          </button>
          <button className="btn amber" onClick={save}>
            Save Trip
          </button>
        </>
      }
    >
      <fieldset>
        <legend>TRIP DATE</legend>
        <div className="frow">
          <div className="fld">
            <label>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => update({ date: e.target.value })}
            />
          </div>
          <div className="fld">
            <label>Day</label>
            <input value={form.date ? dayNameOf(form.date) : ''} disabled />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>FIRST MILE — BO'S WH MANDALUYONG</legend>
        <div className="frow">
          <div className="fld">
            <label>Ingress</label>
            <input type="time" value={form.firstMile.ingress} onChange={(e) => updateFirstMile({ ingress: e.target.value })} />
          </div>
          <div className="fld">
            <label>Egress</label>
            <input type="time" value={form.firstMile.egress} onChange={(e) => updateFirstMile({ egress: e.target.value })} />
          </div>
          <div className="fld">
            <label>Loading Start</label>
            <input type="time" value={form.firstMile.loadStart} onChange={(e) => updateFirstMile({ loadStart: e.target.value })} />
          </div>
          <div className="fld">
            <label>Loading End</label>
            <input type="time" value={form.firstMile.loadEnd} onChange={(e) => updateFirstMile({ loadEnd: e.target.value })} />
          </div>
        </div>
        <div className="hint">
          Loading time: {fmtMins(minDiff(form.firstMile.loadStart, form.firstMile.loadEnd))} · Gate time:{' '}
          {fmtMins(minDiff(form.firstMile.ingress, form.firstMile.egress))}
        </div>
      </fieldset>

      <fieldset>
        <legend>COMMISSARY</legend>
        <div className="frow">
          <div className="fld">
            <label>Gate Ingress</label>
            <input type="time" value={form.commissary.ingress} onChange={(e) => updateCommissary({ ingress: e.target.value })} />
          </div>
          <div className="fld">
            <label>Gate Egress</label>
            <input type="time" value={form.commissary.egress} onChange={(e) => updateCommissary({ egress: e.target.value })} />
          </div>
          <div className="fld">
            <label>Loading Start</label>
            <input type="time" value={form.commissary.loadStart} onChange={(e) => updateCommissary({ loadStart: e.target.value })} />
          </div>
          <div className="fld">
            <label>Loading End</label>
            <input type="time" value={form.commissary.loadEnd} onChange={(e) => updateCommissary({ loadEnd: e.target.value })} />
          </div>
        </div>
        <div className="hint">
          Loading time: {fmtMins(minDiff(form.commissary.loadStart, form.commissary.loadEnd))} · Gate (idle) time:{' '}
          {fmtMins(minDiff(form.commissary.ingress, form.commissary.egress))}
        </div>
      </fieldset>

      <fieldset>
        <legend>STORE STOPS (UP TO 6)</legend>
        <datalist id="dayStoreList">
          {dayStoreList.map((s) => (
            <option key={s.name} value={s.name} />
          ))}
        </datalist>
        {form.stores.map((st, i) => {
          const existingType = getStoreType(st.name);
          const loadT = fmtMins(minDiff(st.loadStart, st.loadEnd));
          const gateT = fmtMins(minDiff(st.ingress, st.egress));
          const ctdRate = num(st.ctdRate);
          const storedCostVal = st.storedCost === '' || st.storedCost == null ? null : num(st.storedCost);
          const pct = ctdRate > 0 && storedCostVal != null && storedCostVal > 0 ? (ctdRate / storedCostVal) * 100 : null;
          const band = classifyCtdPct(pct);
          const hit = odoIssues.find((x) => x.i === i);
          return (
            <div className="store-block" key={i}>
              <div className="store-h">
                STORE {i + 1}{' '}
                {existingType && (
                  <span className={`badge tag-${existingType}`}>{STORE_TYPE_LABEL[existingType]}</span>
                )}
              </div>
              <div className="frow">
                <div className="fld">
                  <label>Location</label>
                  <input
                    list="dayStoreList"
                    value={st.name}
                    placeholder="Store name / area"
                    onChange={(e) => onStoreNameInput(i, e.target.value)}
                  />
                </div>
                <div className="fld">
                  <label>Category</label>
                  <input
                    value={st.category}
                    placeholder="Owned / Franchised / Daily"
                    onChange={(e) => updateStore(i, { category: e.target.value })}
                  />
                </div>
                <div className="fld">
                  <label>Sales Value (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={st.storedCost}
                    onChange={(e) => updateStore(i, { storedCost: e.target.value })}
                  />
                </div>
              </div>
              <div className="frow">
                <div className="fld">
                  <label>Gate Ingress</label>
                  <input type="time" value={st.ingress} onChange={(e) => updateStore(i, { ingress: e.target.value })} />
                </div>
                <div className="fld">
                  <label>Gate Egress</label>
                  <input type="time" value={st.egress} onChange={(e) => updateStore(i, { egress: e.target.value })} />
                </div>
                <div className="fld">
                  <label>Loading Start</label>
                  <input type="time" value={st.loadStart} onChange={(e) => updateStore(i, { loadStart: e.target.value })} />
                </div>
                <div className="fld">
                  <label>Loading End</label>
                  <input type="time" value={st.loadEnd} onChange={(e) => updateStore(i, { loadEnd: e.target.value })} />
                </div>
              </div>
              <div className="frow">
                <div className="fld">
                  <label>Ingress Odometer (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={st.odoIngress}
                    className={hit ? 'odo-bad' : ''}
                    onChange={(e) => updateStore(i, { odoIngress: e.target.value })}
                  />
                </div>
                <div className="fld">
                  <label>CTD Rate (₱)</label>
                  <select value={st.ctdRate} onChange={(e) => updateStore(i, { ctdRate: e.target.value })}>
                    <option value="">— Select —</option>
                    {CTD_RATE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="hint">
                Loading time: {loadT} · Gate (idle) time: {gateT}
              </div>
              <div className="hint">
                Total % of CTD (CTD Rate ÷ Sales Value × 100):{' '}
                <span style={{ color: pct == null ? 'inherit' : band.color, fontWeight: pct == null ? 'normal' : 700 }}>
                  {pct == null ? '—' : `${pct.toFixed(2)}% (${band.label})`}
                </span>
              </div>
              {hit && (
                <div className="hint odo-warn" style={{ display: 'block' }}>
                  ⚠ {hit.msg}
                </div>
              )}
            </div>
          );
        })}
        <div className="computed-strip" style={{ marginTop: '12px' }}>
          <div className="c-item">
            <div className="l">TOTAL STORE COST / NSV</div>
            <div className="v">{allStoredCostsComplete ? money(totalStoreCost) : '—'}</div>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>LAST MILE — RETURN TO BO'S WH MANDALUYONG</legend>
        <div className="frow">
          <div className="fld">
            <label>Arrival in WH</label>
            <input type="time" value={form.lastMileArrival} onChange={(e) => update({ lastMileArrival: e.target.value })} />
          </div>
        </div>
        <div className="hint">
          Total Dispatch Time (First Mile Egress → Last Mile Arrival):{' '}
          {fmtMins(minDiff(form.firstMile.egress, form.lastMileArrival))}
        </div>
      </fieldset>

      <fieldset>
        <legend>OVERTIME</legend>
        <div className="frow">
          <div className="fld">
            <label>Standard Shift (hrs)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={form.overtime.standardHrs}
              onChange={(e) => updateOvertime({ standardHrs: e.target.value })}
            />
          </div>
        </div>
        <div className="hint">
          Total duty time (First Mile Ingress → Last Mile Arrival): {fmtMins(totalDutyMin)} · Overtime incurred:{' '}
          {fmtMins(overtimeMin)}
        </div>
      </fieldset>

      <fieldset>
        <legend>ODOMETER READING</legend>
        <div className="frow">
          <div className="fld">
            <label>Departure (km)</label>
            <input type="number" step="0.1" value={form.odometer.departure} onChange={(e) => updateOdometer({ departure: e.target.value })} />
          </div>
          <div className="fld">
            <label>Arrival (km)</label>
            <input type="number" step="0.1" value={form.odometer.arrival} onChange={(e) => updateOdometer({ arrival: e.target.value })} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>DIESEL CONSUMPTION</span>
          <label
            style={{
              fontSize: '11px',
              fontWeight: 400,
              color: 'var(--ink-soft)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            <input type="checkbox" checked={showDistanceFuelCost} onChange={toggleDistanceFuelCost} /> Show Distance basis
          </label>
        </legend>
        <div className="frow">
          <div className="fld">
            <label>OR #</label>
            <input value={form.fuel.orNum} onChange={(e) => updateFuel({ orNum: e.target.value })} />
          </div>
          <div className="fld">
            <label>Cost per Liter (₱)</label>
            <input
              type="number"
              step="0.01"
              value={form.fuel.costPerLiter}
              onChange={(e) => updateFuel({ costPerLiter: e.target.value })}
            />
          </div>
        </div>
        {showDistanceFuelCost && (
          <div className="hint">
            Total Liters (auto, from each store's Actual Fuel Cost share):{' '}
            {computed.liters == null ? '—' : `${computed.liters.toFixed(2)} L`}
          </div>
        )}
        <div className="hint">
          Total Liters / Fuel Cost — Sales Value basis:{' '}
          {computed.litersBySales == null ? '—' : `${computed.litersBySales.toFixed(2)} L`} /{' '}
          {computed.fuelCostBySales == null ? '—' : money(computed.fuelCostBySales)}
        </div>
      </fieldset>

      <fieldset>
        <legend>COST INCURRED</legend>
        <div className="frow">
          <div className="fld">
            <label>OR #</label>
            <input value={form.costIncurred.orNum} onChange={(e) => updateCostIncurred({ orNum: e.target.value })} />
          </div>
          <div className="fld">
            <label>Parking (₱)</label>
            <input type="number" step="0.01" value={form.costIncurred.parking} onChange={(e) => updateCostIncurred({ parking: e.target.value })} />
          </div>
          <div className="fld">
            <label>Gate Pass (₱)</label>
            <input type="number" step="0.01" value={form.costIncurred.gatePass} onChange={(e) => updateCostIncurred({ gatePass: e.target.value })} />
          </div>
          <div className="fld">
            <label>Toll Fee / RFID (₱)</label>
            <input type="number" step="0.01" value={form.costIncurred.tollFee} onChange={(e) => updateCostIncurred({ tollFee: e.target.value })} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>FIXED COST (LABOR)</legend>
        <div className="frow">
          <div className="fld">
            <label>Driver Cost (₱)</label>
            <input type="number" step="0.01" value={form.laborCost.driver} onChange={(e) => updateLabor({ driver: e.target.value })} />
          </div>
          <div className="fld">
            <label>Helper Cost (₱)</label>
            <input type="number" step="0.01" value={form.laborCost.helper} onChange={(e) => updateLabor({ helper: e.target.value })} />
          </div>
        </div>
        <div className="hint">Total Fixed Cost (Labor): {money(computed.laborCost)}</div>
      </fieldset>

      <div className="computed-strip">
        <div className="c-item">
          <div className="l">TOTAL NSV</div>
          <div className="v">{money(computed.nsv || 0)}</div>
        </div>
        <div className="c-item">
          <div className="l">DISTANCE</div>
          <div className="v">{computed.km == null ? '— km' : `${computed.km.toFixed(1)} km`}</div>
        </div>
        <div className="c-item">
          <div className="l">FUEL COST</div>
          <div className="v">{computed.fuelCostBySales == null ? '—' : money(computed.fuelCostBySales)}</div>
        </div>
        <div className="c-item">
          <div className="l">DIST. COST</div>
          <div className="v">{money(computed.distCost)}</div>
        </div>
        <div className="c-item">
          <div className="l">% OF NSV</div>
          <div className="v">{computed.pct == null ? '—' : computed.pct.toFixed(1) + '%'}</div>
        </div>
        <div className="c-item">
          <div className="l">FUEL EFFICIENCY</div>
          <div className="v">{computed.kml == null ? '— km/L' : `${computed.kml.toFixed(2)} km/L`}</div>
        </div>
      </div>
    </Modal>
  );
}
