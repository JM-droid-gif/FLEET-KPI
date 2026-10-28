import { useRef } from 'react';
import { Menu, Download, Upload, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Topbar() {
  const { currentUser, isAdmin, exportData, importData, logout, setMobileNavOpen, mobileNavOpen } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  if (!currentUser) return null;

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileNavOpen}
          aria-controls="sidebar"
        >
          <Menu size={22} />
        </button>
      </div>
      <div className="topbar-right">
        <div className="who-badge">
          <span className="mono">{currentUser.username}</span>
          <span className={`role-pill ${isAdmin ? 'role-admin' : ''}`}>{isAdmin ? 'ADMIN' : 'USER'}</span>
        </div>
        <button className="btn ghost small" onClick={exportData} title="Save a backup file of all logs" aria-label="Export Data">
          <Download size={14} />
          <span className="btn-text">Export</span>
        </button>
        <button className="btn ghost small" onClick={() => fileRef.current?.click()} title="Restore logs from a backup file" aria-label="Import Data">
          <Upload size={14} />
          <span className="btn-text">Import</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files && e.target.files[0];
            if (f) importData(f);
            e.target.value = '';
          }}
        />
        <button className="btn ghost small" onClick={logout} aria-label="Logout">
          <LogOut size={14} />
          <span className="btn-text">Logout</span>
        </button>
      </div>
    </div>
  );
}
