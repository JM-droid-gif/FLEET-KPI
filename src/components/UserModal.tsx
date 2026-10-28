import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from './Modal';

export function UserModal() {
  const { modal, accounts, addUser, updateUser, closeModal } = useApp();
  const editing = modal.type === 'user-edit';
  const existing = editing && modal.userIndex != null ? accounts[modal.userIndex] : null;
  const [username, setUsername] = useState(existing ? existing.username : '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>(existing ? existing.role : 'user');

  const save = async () => {
    if (editing && modal.userIndex != null) {
      const err = await updateUser(modal.userIndex, { password, role });
      if (err) { alert(err); return; }
      closeModal();
    } else {
      const err = await addUser({ username: username.trim(), password, role });
      if (err) { alert(err); return; }
      closeModal();
    }
  };

  return (
    <Modal
      title={editing ? 'Edit User' : 'Add User'}
      footer={
        <>
          <button className="btn ghost" onClick={closeModal}>
            Cancel
          </button>
          <button className="btn amber" onClick={save}>
            {editing ? 'Save Changes' : 'Save User'}
          </button>
        </>
      }
    >
      <div className="frow">
        <div className="fld">
          <label>Username</label>
          <input
            value={username}
            disabled={editing}
            placeholder="e.g. jbagatela"
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="fld">
          <label>Password</label>
          <input type="password" autoComplete="new-password" value={password} placeholder={editing ? 'Enter a new password' : 'Password'} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="fld">
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'user')}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}
