import { createContext, useContext } from 'react';
import type { Account, CurrentUser, Entry, Vehicle } from '../types';

export type PageType = 'dashboard' | 'stores' | 'store-summary' | 'users' | 'vehicle';

export interface BackupPayload {
  exportedAt: string;
  accounts: Account[];
  vehicles: Vehicle[];
  entries: Record<string, Entry[]>;
  lastCpl: string;
}

export interface ModalState {
  type: 'vehicle-add' | 'vehicle-edit' | 'entry' | 'user-add' | 'user-edit' | null;
  plate?: string;
  entryId?: string | null;
  userIndex?: number;
}

export interface AppContextValue {
  ready: boolean;
  currentUser: CurrentUser | null;
  vehicles: Vehicle[];
  entries: Record<string, Entry[]>;
  accounts: Account[];
  lastCpl: string;
  page: PageType;
  currentPlate: string | null;
  showDistanceFuelCost: boolean;
  modal: ModalState;
  isAdmin: boolean;
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setPage: (page: PageType, plate?: string) => void;
  navigate: (hash: string) => void;
  toggleDistanceFuelCost: () => void;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
  addVehicle: (v: Vehicle) => Promise<void>;
  updateVehicle: (plate: string, v: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (plate: string) => Promise<void>;
  saveEntry: (plate: string, entry: Entry, editingId: string | null) => Promise<void>;
  deleteEntry: (plate: string, entryId: string) => Promise<void>;
  addUser: (a: { username: string; password: string; role: Account['role'] }) => Promise<string | null>;
  updateUser: (i: number, a: { password: string; role: Account['role'] }) => Promise<string | null>;
  deleteUser: (i: number) => Promise<string | null>;
  exportData: () => void;
  importData: (file: File) => Promise<void>;
  openModal: (m: ModalState) => void;
  closeModal: () => void;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppContext');
  return ctx;
}
