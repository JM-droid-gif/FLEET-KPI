import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from './Modal';
import { DAY_ORDER, REGIONS, vehicleRegion } from '../lib/constants';
import { slug } from '../lib/helpers';
import type { Vehicle } from '../types';

const FUEL_TYPES = ['Diesel', 'Gasoline'];
const WHEELERS = ['4W', '6W', '10W'];

function emptyVehicle(): Vehicle {
  return {
    plate: '', region: 'Manila', driver: '', location: 'Mandaluyong',
    brand: '', gw: '', wheeler: '4W', fuelType: 'Diesel',
    vehicleType: '', length: '', width: '', height: '', coding: 'Monday',
  };
}

export function VehicleModal() {
  const { modal, vehicles, addVehicle, updateVehicle, closeModal, navigate } = useApp();
  const editing = modal.type === 'vehicle-edit';
  const existing = editing ? vehicles.find((v) => v.plate === modal.plate) : null;
  const [form, setForm] = useState<Vehicle>(existing ? { ...existing } : emptyVehicle());
  const region = vehicleRegion(form);

  const set = (k: keyof Vehicle, val: string) => setForm((f) => ({ ...f, [k]: val }));

  const save = async () => {
    if (!form.plate.trim()) {
      alert('Vehicle plate is required.');
      return;
    }
    if (!editing && vehicles.find((v) => v.plate.toLowerCase() === form.plate.toLowerCase())) {
      alert('A vehicle with that plate already exists.');
      return;
    }
    if (editing && modal.plate) {
      const { plate: _ignored, ...patch } = form;
      void _ignored;
      await updateVehicle(modal.plate, patch);
      closeModal();
    } else {
      await addVehicle({ ...form, plate: form.plate.trim() });
      closeModal();
      navigate('#/vehicle/' + encodeURIComponent(slug(form.plate.trim())));
    }
  };

  return (
    <Modal
      title={editing ? 'Edit Vehicle Profile' : 'Add Vehicle'}
      footer={
        <>
          <button className="btn ghost" onClick={closeModal}>
            Cancel
          </button>
          <button className="btn amber" onClick={save}>
            {editing ? 'Save Changes' : 'Save Vehicle'}
          </button>
        </>
      }
    >
      <div className="frow">
        <div className="fld">
          <label>Vehicle Plate</label>
          <input
            value={form.plate}
            disabled={editing}
            placeholder="e.g. NIO 4192"
            onChange={(e) => set('plate', e.target.value)}
          />
        </div>
        <div className="fld">
          <label>Region</label>
          <select value={region} onChange={(e) => set('region', e.target.value)}>
            {REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="fld">
          <label>Driver's Name</label>
          <input value={form.driver} placeholder="Full name" onChange={(e) => set('driver', e.target.value)} />
        </div>
        <div className="fld">
          <label>Base Location</label>
          <input value={form.location} onChange={(e) => set('location', e.target.value)} />
        </div>
      </div>
      <div className="frow">
        <div className="fld">
          <label>Vehicle Brand</label>
          <input value={form.brand} placeholder="e.g. Isuzu Elf" onChange={(e) => set('brand', e.target.value)} />
        </div>
        <div className="fld">
          <label>Vehicle Type</label>
          <input
            value={form.vehicleType}
            title={form.vehicleType || 'Vehicle type'}
            placeholder="e.g. Reefer Truck"
            onChange={(e) => set('vehicleType', e.target.value)}
          />
        </div>
        <div className="fld">
          <label>Fuel Type</label>
          <select value={form.fuelType} onChange={(e) => set('fuelType', e.target.value)}>
            {FUEL_TYPES.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="frow">
        <div className="fld">
          <label>GW</label>
          <input value={form.gw} placeholder="e.g. 4200" onChange={(e) => set('gw', e.target.value)} />
        </div>
        <div className="fld">
          <label>Wheeler</label>
          <select value={form.wheeler} onChange={(e) => set('wheeler', e.target.value)}>
            {WHEELERS.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
        </div>
        <div className="fld">
          <label>Coding Day</label>
          <select value={form.coding} onChange={(e) => set('coding', e.target.value)}>
            {DAY_ORDER.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="frow">
        <div className="fld">
          <label>Length</label>
          <input value={form.length} placeholder="e.g. 12ft" onChange={(e) => set('length', e.target.value)} />
        </div>
        <div className="fld">
          <label>Width</label>
          <input value={form.width} placeholder="e.g. 7ft" onChange={(e) => set('width', e.target.value)} />
        </div>
        <div className="fld">
          <label>Height</label>
          <input value={form.height} placeholder="e.g. 5ft" onChange={(e) => set('height', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
