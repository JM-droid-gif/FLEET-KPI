import { useApp } from '../context/AppContext';
import { STORE_TYPE_LABEL, storesForDay } from '../lib/constants';

export function StoreDirectory() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  useApp();

  return (
    <>
      <div className="pageheader">
        <div>
          <div className="eyebrow">CENTRAL WAREHOUSE</div>
          <h1>Store Directory</h1>
          <div className="meta">Weekly drop schedule — which stores each vehicle can be routed to, by day.</div>
        </div>
        <div className="legend">
          <span className="legend-item">
            <span className="swatch tag-owned" />
            {STORE_TYPE_LABEL.owned}
          </span>
          <span className="legend-item">
            <span className="swatch tag-franchised" />
            {STORE_TYPE_LABEL.franchised}
          </span>
          <span className="legend-item">
            <span className="swatch tag-daily" />
            {STORE_TYPE_LABEL.daily}
          </span>
        </div>
      </div>
      <div className="sd-grid">
        {days.map((d) => {
          const stores = storesForDay(d);
          return (
            <div className="sd-col" key={d}>
              <div className="sd-day">{d.toUpperCase()}</div>
              <div className="sd-items">
                {stores.length ? (
                  stores.map((s) => (
                    <div className={`sd-item tag-${s.type}`} key={s.name}>
                      {s.name}
                    </div>
                  ))
                ) : (
                  <div className="sd-item" style={{ color: 'var(--ink-soft)' }}>
                    —
                  </div>
                )}
              </div>
              <div className="sd-count">
                {stores.length} STORE{stores.length === 1 ? '' : 'S'}
              </div>
            </div>
          );
        })}
      </div>
      <div className="hint" style={{ marginTop: '14px' }}>
        Type a store name in any Daily Entry's store field and its category (Owned / Franchised / Daily) fills in automatically when it matches
        this directory.
      </div>
    </>
  );
}
