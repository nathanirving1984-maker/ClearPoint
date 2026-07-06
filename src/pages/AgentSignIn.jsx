import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function AgentSignIn() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const { signIn } = useAuth();
  const nav = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    try {
      await signIn(email, pw);
      nav('/agent');
    } catch {
      setErr('Could not sign in with that email and password.');
    }
  }

  return (
    <div className="center-wrap">
      <form className="card-box" onSubmit={handleSubmit}>
        <div className="logo-row"><Logo size={32} /><span className="logo-text">ClearPoint</span></div>
        <div className="logo-sub">Agent portal</div>
        <div className="field-group">
          <label className="field-label">Email address</label>
          <input className="si-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field-group">
          <label className="field-label">Password</label>
          <input className="si-input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        </div>
        <button className="si-btn" type="submit">Sign in</button>
        <button className="si-btn secondary" type="button" style={{ marginTop: 8 }} onClick={() => nav('/')}>Back</button>
        {err && <div className="err-msg">{err}</div>}
        <div className="si-footer">
          First time? Create your account in the Firebase console under Authentication → Users,
          or add an Email/Password sign-up form here later.
        </div>
      </form>
    </div>
  );
}
