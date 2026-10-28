import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export function UsersPage() {
  const { accounts, isAdmin, navigate, openModal, deleteUser } = useApp();
  useEffect(() => {
    if (!isAdmin) navigate('#/dashboard');
  }, [isAdmin, navigate]);
  if (!isAdmin) return null;
  return (
    <>
      <div className="pageheader">
        <div>
          <div className="eyebrow">ACCESS CONTROL</div>
          <h1>Manage Users</h1>
          <div className="meta">Admin accounts can manage vehicles, profiles, and deletions. User accounts can add/edit Daily Entries only.</div>
        </div>
        <button className="btn amber" onClick={() => openModal({ type: 'user-add' })}>
          + Add User
        </button>
      </div>
      <div className="scrollx">
        <table className="datatable userlist">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a, i) => (
              <tr key={a.username}>
                <td className="mono">{a.username}</td>
                <td>
                  <span className={`badge ${a.role === 'admin' ? 'tag-owned' : ''}`}>{a.role === 'admin' ? 'Admin' : 'User'}</span>
                </td>
                <td className="rowactions">
                  {!a.isProtected && (
                    <button className="btn ghost small" onClick={() => openModal({ type: 'user-edit', userIndex: i })}>
                      Edit
                    </button>
                  )}
                  {accounts.length > 1 && !a.isProtected && (
                    <button
                      className="btn danger small"
                      onClick={async () => {
                        if (!confirm(`Remove user "${a.username}"?`)) return;
                        const err = await deleteUser(i);
                        if (err) alert(err);
                      }}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
