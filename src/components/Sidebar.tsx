import { useEffect, useState } from 'react';
import { LayoutDashboard, Store, FileBarChart, Users, Plus, ChevronLeft, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrandMark } from './BrandMark';
import { REGIONS, vehicleRegion } from '../lib/constants';
import { isoDate, mondayOf, slug } from '../lib/helpers';

interface TooltipState {
  visible: boolean;
  text: string;
  x: number;
  y: number;
}

export function Sidebar() {
  const {
    vehicles,
    entries,
    page,
    currentPlate,
    isAdmin,
    navigate,
    openModal,
    sidebarCollapsed,
    toggleSidebar,
    mobileNavOpen,
    setMobileNavOpen,
  } = useApp();

  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, text: '', x: 0, y: 0 });

  const vehicleWeekTrips = (plate: string): number => {
    const monday = mondayOf(isoDate(new Date()));
    const list = entries[plate] || [];
    return list.filter((e) => mondayOf(e.date) === monday).length;
  };

  // Close mobile drawer on Escape
  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen, setMobileNavOpen]);

  const showTooltip = (text: string, e: React.MouseEvent) => {
    if (!sidebarCollapsed) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ visible: true, text, x: rect.right + 4, y: rect.top + rect.height / 2 });
  };
  const hideTooltip = () => setTooltip((t) => ({ ...t, visible: false }));

  const navIcon = (label: string) => {
    switch (label) {
      case 'Dashboard': return <LayoutDashboard size={18} style={{ flex: 'none' }} />;
      case 'Store Directory': return <Store size={18} style={{ flex: 'none' }} />;
      case 'Store Summary': return <FileBarChart size={18} style={{ flex: 'none' }} />;
      case 'Manage Users': return <Users size={18} style={{ flex: 'none' }} />;
      default: return null;
    }
  };

  const navItem = (active: boolean, dotClass: string, label: string, onClick: () => void) => (
    <button
      className={`navitem ${active ? 'active' : ''}`}
      onClick={onClick}
      onMouseEnter={(e) => showTooltip(label, e)}
      onMouseLeave={hideTooltip}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      {sidebarCollapsed && navIcon(label) ? (
        navIcon(label)
      ) : (
        <span className={`dot ${dotClass}`} />
      )}
      <span className="navitem-label">{label}</span>
    </button>
  );

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop ${mobileNavOpen ? 'show' : ''}`}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileNavOpen ? 'mobile-open' : ''}`}
        aria-expanded={!sidebarCollapsed}
      >
        <div className="brand">
          <div className="brand-left">
            <BrandMark size={22} />
            <div style={{ overflow: 'hidden' }}>
              <div className="mark">
                <span className="brand-script">BO'S COFFEE</span>
              </div>
              <div className="sub">WH DISTRIBUTION FLEET</div>
            </div>
          </div>
          {/* Mobile close button — only visible on mobile */}
          <button
            className="sidebar-toggle sidebar-toggle-mobile"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={16} />
          </button>
          {/* Desktop collapse toggle — only visible on desktop */}
          <button
            className="sidebar-toggle sidebar-toggle-desktop"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!sidebarCollapsed}
          >
            <ChevronLeft
              size={16}
              style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>
        </div>

        <nav className="navlist" aria-label="Main navigation">
          {navItem(page === 'dashboard', vehicles.length ? 'good' : '', 'Dashboard', () => navigate('#/dashboard'))}
          {navItem(page === 'stores', '', 'Store Directory', () => navigate('#/stores'))}
          {isAdmin && (
            <>
              {navItem(page === 'store-summary', '', 'Store Summary', () => navigate('#/store-summary'))}
              {navItem(page === 'users', '', 'Manage Users', () => navigate('#/users'))}
            </>
          )}
          <div className="navsection-label">
            FLEET — {vehicles.length} UNIT{vehicles.length === 1 ? '' : 'S'}
          </div>
          {REGIONS.map((region) => {
            const inRegion = vehicles.filter((v) => vehicleRegion(v) === region);
            return (
              <div key={region}>
                <div className="navsection-label">
                  {region.toUpperCase()} — {inRegion.length} UNIT{inRegion.length === 1 ? '' : 'S'}
                </div>
                {inRegion.length === 0 && (
                  <div className="hint region-empty-hint" style={{ padding: '4px 12px 8px' }}>
                    No vehicles yet{isAdmin ? ' — use "+ Add Vehicle" and set Region to ' + region + '.' : '.'}
                  </div>
                )}
                {inRegion.map((v) => {
                  const active = page === 'vehicle' && currentPlate === v.plate;
                  const trips = vehicleWeekTrips(v.plate);
                  return (
                    <button
                      key={v.plate}
                      className={`navitem ${active ? 'active' : ''}`}
                      onClick={() => navigate('#/vehicle/' + encodeURIComponent(slug(v.plate)))}
                      onMouseEnter={(e) => showTooltip(`${v.plate} — ${v.driver || 'Unassigned'}`, e)}
                      onMouseLeave={hideTooltip}
                      aria-label={`${v.plate} — ${v.driver || 'Unassigned'}`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <span className={`dot ${trips > 0 ? 'good' : 'warn'}`} />
                      <span className="navitem-plate-text">
                        <span className="plate">{v.plate}</span>
                        <span className="who">{v.driver || 'Unassigned'}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
        {isAdmin && (
          <button
            className="addvbtn"
            onClick={() => {
              openModal({ type: 'vehicle-add' });
              setMobileNavOpen(false);
            }}
            aria-label="Add Vehicle"
          >
            <Plus size={16} style={{ flex: 'none' }} />
            <span>ADD VEHICLE</span>
          </button>
        )}
        <div className="sidebar-foot">Fleet KPI &amp; Distribution Cost Log</div>
      </aside>

      {/* Tooltip for collapsed sidebar */}
      {tooltip.visible && sidebarCollapsed && (
        <div
          className="nav-tooltip"
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateY(-50%)',
          }}
          role="tooltip"
        >
          {tooltip.text}
        </div>
      )}
    </>
  );
}
