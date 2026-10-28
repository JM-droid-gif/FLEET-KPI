import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BrandMark } from './BrandMark';

export function Login() {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const doLogin = async () => {
    const ok = await login(username.trim(), password);
    if (!ok) setError('Invalid username or password.');
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-head">
          <div className="mark">
            <BrandMark size={20} />
            <span className="brand-script">BO'S COFFEE</span>
          </div>
          <div className="sub">WH DISTRIBUTION FLEET — SIGN IN</div>
        </div>
        <div className="login-body">
          <div className="login-error">{error}</div>
          <div className="fld">
            <label>Username</label>
            <input
              autoComplete="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doLogin()}
              autoFocus
            />
          </div>
          <div className="fld">
            <label>Password</label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doLogin()}
            />
          </div>
          <button className="btn amber" onClick={doLogin}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
