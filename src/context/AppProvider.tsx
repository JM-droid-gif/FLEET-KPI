import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Account, CurrentUser, Entry, Vehicle } from '../types';
import { DEFAULT_ACCOUNTS, DEFAULT_VEHICLES } from '../lib/constants';
import { hashPassword, uid } from '../lib/helpers';
import {
  fetchAccounts,
  fetchVehicles,
  fetchAllEntries,
  fetchSetting,
  insertVehicle,
  updateVehicleRow,
  deleteVehicleRow,
  upsertEntry,
  deleteEntryRow,
  insertAccount,
  updateAccount,
  deleteAccount,
  saveSetting,
  saveVehicles,
  saveAccounts,
} from '../lib/storage';
import { AppContext, type AppContextValue, type BackupPayload, type ModalState, type PageType } from './AppContext';

const ROUTE_VEHICLE_RE = /^#\/vehicle\/(.+)$/;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [entries, setEntries] = useState<Record<string, Entry[]>>({});
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [lastCpl, setLastCpl] = useState('');
  const [page, setPageState] = useState<PageType>('dashboard');
  const [currentPlate, setCurrentPlate] = useState<string | null>(null);
  const [showDistanceFuelCost, setShowDistanceFuelCost] = useState(false);
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // init — load from Supabase, seed defaults if empty
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        let acc = await fetchAccounts();
        if (!acc.length) {
          // seed default accounts
          acc = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS)) as Account[];
          await saveAccounts(acc);
        }
        let veh = await fetchVehicles();
        if (!veh.length) {
          // seed default vehicles
          veh = JSON.parse(JSON.stringify(DEFAULT_VEHICLES)) as Vehicle[];
          await saveVehicles(veh);
        }
        const plates = veh.map((v) => v.plate);
        const ent = await fetchAllEntries(plates);
        const cpl = await fetchSetting('last_cpl');
        if (!mounted) return;
        setAccounts(acc);
        setVehicles(veh);
        setEntries(ent);
        setLastCpl(cpl);
        setReady(true);
      } catch (err) {
        console.error('Failed to load from Supabase:', err);
        if (!mounted) return;
        setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const isAdmin = !!(currentUser && currentUser.role === 'admin');

  const routeFromHash = useCallback(
    (hash: string) => {
      if (!currentUser) return;
      const h = hash || '#/dashboard';
      const m = h.match(ROUTE_VEHICLE_RE);
      if (m) {
        const targetPlate = decodeURIComponent(m[1]).replace(/^fleet_entries_/, '').replace(/_/g, ' ');
        const v = vehicles.find((x) => x.plate.toLowerCase() === targetPlate.toLowerCase());
        if (v) {
          setPageState('vehicle');
          setCurrentPlate(v.plate);
          return;
        }
      }
      if (h === '#/stores') {
        setPageState('stores');
        setCurrentPlate(null);
      } else if (h === '#/store-summary' && isAdmin) {
        setPageState('store-summary');
        setCurrentPlate(null);
      } else if (h === '#/users' && isAdmin) {
        setPageState('users');
        setCurrentPlate(null);
      } else {
        setPageState('dashboard');
        setCurrentPlate(null);
      }
    },
    [currentUser, vehicles, isAdmin]
  );

  useEffect(() => {
    if (!ready || !currentUser) return;
    routeFromHash(location.hash);
    const onHash = () => routeFromHash(location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [ready, currentUser, routeFromHash]);

  const setPage = useCallback((p: PageType, plate?: string) => {
    setPageState(p);
    setCurrentPlate(plate ?? null);
  }, []);

  const navigate = useCallback((hash: string) => {
    location.hash = hash;
    setMobileNavOpen(false);
  }, []);

  const toggleDistanceFuelCost = useCallback(() => setShowDistanceFuelCost((s) => !s), []);
  const toggleSidebar = useCallback(() => setSidebarCollapsed((s) => !s), []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [mobileNavOpen]);

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      const passwordHash = await hashPassword(password);
      const acct = accounts.find(
        (a) => a.username.toLowerCase() === username.toLowerCase() && a.passwordHash === passwordHash
      );
      if (!acct) return false;
      setCurrentUser({ username: acct.username, role: acct.role });
      return true;
    },
    [accounts]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    setPageState('dashboard');
    setCurrentPlate(null);
    setModal({ type: null });
    setMobileNavOpen(false);
    location.hash = '';
  }, []);

  const addVehicle = useCallback(async (v: Vehicle) => {
    setVehicles((prev) => [...prev, v]);
    setEntries((prev) => ({ ...prev, [v.plate]: [] }));
    try {
      await insertVehicle(v);
    } catch (err) {
      console.error('Failed to save vehicle to Supabase:', err);
    }
  }, []);

  const updateVehicle = useCallback(async (plate: string, patch: Partial<Vehicle>) => {
    const updated = vehicles.map((v) => (v.plate === plate ? { ...v, ...patch } : v));
    setVehicles(updated);
    try {
      await updateVehicleRow(plate, patch);
    } catch (err) {
      console.error('Failed to update vehicle in Supabase:', err);
    }
  }, [vehicles]);

  const deleteVehicle = useCallback(async (plate: string) => {
    const updated = vehicles.filter((v) => v.plate !== plate);
    setVehicles(updated);
    setEntries((prev) => {
      const next = { ...prev };
      delete next[plate];
      return next;
    });
    try {
      await deleteVehicleRow(plate);
    } catch (err) {
      console.error('Failed to delete vehicle from Supabase:', err);
    }
  }, [vehicles]);

  const saveEntry = useCallback(async (plate: string, entry: Entry, editingId: string | null) => {
    setEntries((prev) => {
      const list = prev[plate] ? [...prev[plate]] : [];
      if (editingId) {
        const idx = list.findIndex((x) => x.id === editingId);
        entry.id = editingId;
        if (idx >= 0) list[idx] = entry;
        else list.push(entry);
      } else {
        entry.id = uid();
        list.push(entry);
      }
      return { ...prev, [plate]: list };
    });
    try {
      await upsertEntry(plate, entry);
    } catch (err) {
      console.error('Failed to save entry to Supabase:', err);
    }
    if (entry.fuel.costPerLiter) {
      setLastCpl(entry.fuel.costPerLiter);
      try {
        await saveSetting('last_cpl', entry.fuel.costPerLiter);
      } catch (err) {
        console.error('Failed to save setting to Supabase:', err);
      }
    }
  }, []);

  const deleteEntry = useCallback(async (plate: string, entryId: string) => {
    setEntries((prev) => {
      const list = (prev[plate] || []).filter((x) => x.id !== entryId);
      return { ...prev, [plate]: list };
    });
    try {
      await deleteEntryRow(entryId);
    } catch (err) {
      console.error('Failed to delete entry from Supabase:', err);
    }
  }, []);

  const addUser = useCallback(async (a: { username: string; password: string; role: Account['role'] }): Promise<string | null> => {
    if (!a.username || !a.password) return 'Username and password are required.';
    if (accounts.find((x) => x.username.toLowerCase() === a.username.toLowerCase())) {
      return 'That username already exists.';
    }
    const account: Account = { username: a.username, passwordHash: await hashPassword(a.password), role: a.role };
    const updated = [...accounts, account];
    setAccounts(updated);
    try {
      await insertAccount(account);
    } catch (err) {
      console.error('Failed to save account to Supabase:', err);
    }
    return null;
  }, [accounts]);

  const updateUser = useCallback(async (i: number, patch: { password: string; role: Account['role'] }): Promise<string | null> => {
    const a = accounts[i];
    if (!a) return 'Account not found.';
    if (a.isProtected) return 'The built-in admin account cannot be edited.';
    if (!patch.password) return 'Password is required.';
    if (a.username === currentUser?.username && patch.role !== 'admin' && !accounts.some((x, xi) => xi !== i && x.role === 'admin')) {
      return 'At least one Admin account must remain.';
    }
    const passwordHash = await hashPassword(patch.password);
    const updated = accounts.map((x, xi) => (xi === i ? { ...x, passwordHash, role: patch.role } : x));
    setAccounts(updated);
    try {
      await updateAccount(a.username, { password: passwordHash, role: patch.role });
    } catch (err) {
      console.error('Failed to update account in Supabase:', err);
    }
    return null;
  }, [accounts, currentUser]);

  const deleteUser = useCallback(async (i: number): Promise<string | null> => {
    const a = accounts[i];
    if (!a) return 'Account not found.';
    if (a.isProtected) return 'The built-in admin account cannot be deleted.';
    if (a.role === 'admin' && accounts.filter((x) => x.role === 'admin').length <= 1) {
      return 'At least one Admin account must remain.';
    }
    const updated = accounts.filter((_, xi) => xi !== i);
    setAccounts(updated);
    try {
      await deleteAccount(a.username);
    } catch (err) {
      console.error('Failed to delete account from Supabase:', err);
    }
    return null;
  }, [accounts]);

  const exportData = useCallback(() => {
    const payload: BackupPayload = {
      exportedAt: new Date().toISOString(),
      accounts,
      vehicles,
      entries,
      lastCpl,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `fleet-kpi-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [accounts, vehicles, entries, lastCpl]);

  const importData = useCallback(async (file: File) => {
    const text = await file.text();
    let data: BackupPayload;
    try {
      data = JSON.parse(text);
    } catch {
      alert('Could not read that file — make sure it\'s a Fleet KPI backup .json file exported from this app.');
      return;
    }
    if (!data || typeof data !== 'object' || !Array.isArray(data.vehicles)) {
      alert('This file doesn\'t look like a valid Fleet KPI backup.');
      return;
    }
    if (!confirm('Importing will REPLACE all current accounts, vehicles, and trip logs with the contents of this backup file. Continue?')) return;
    const newAccounts = Array.isArray(data.accounts) && data.accounts.length ? data.accounts : accounts;
    const newVehicles = data.vehicles;
    const newEntries = data.entries && typeof data.entries === 'object' ? data.entries : {};
    const newCpl = data.lastCpl || '';
    setAccounts(newAccounts);
    setVehicles(newVehicles);
    setEntries(newEntries);
    setLastCpl(newCpl);
    // Persist to Supabase
    try {
      await saveAccounts(newAccounts);
      await saveVehicles(newVehicles);
      for (const v of newVehicles) {
        const list = newEntries[v.plate] || [];
        for (const e of list) {
          await upsertEntry(v.plate, e);
        }
      }
      await saveSetting('last_cpl', newCpl);
    } catch (err) {
      console.error('Failed to persist import to Supabase:', err);
    }
    alert('Backup imported successfully.');
  }, [accounts]);

  const openModal = useCallback((m: ModalState) => setModal(m), []);
  const closeModal = useCallback(() => setModal({ type: null }), []);

  const value: AppContextValue = useMemo(
    () => ({
      ready,
      currentUser,
      vehicles,
      entries,
      accounts,
      lastCpl,
      page,
      currentPlate,
      showDistanceFuelCost,
      modal,
      isAdmin,
      sidebarCollapsed,
      mobileNavOpen,
      login,
      logout,
      setPage,
      navigate,
      toggleDistanceFuelCost,
      toggleSidebar,
      setMobileNavOpen,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      saveEntry,
      deleteEntry,
      addUser,
      updateUser,
      deleteUser,
      exportData,
      importData,
      openModal,
      closeModal,
    }),
    [ready, currentUser, vehicles, entries, accounts, lastCpl, page, currentPlate, showDistanceFuelCost, modal, isAdmin, sidebarCollapsed, mobileNavOpen, login, logout, setPage, navigate, toggleDistanceFuelCost, toggleSidebar, setMobileNavOpen, addVehicle, updateVehicle, deleteVehicle, saveEntry, deleteEntry, addUser, updateUser, deleteUser, exportData, importData, openModal, closeModal]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
