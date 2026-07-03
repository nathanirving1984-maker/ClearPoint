import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

export default function RolePicker() {
  const nav = useNavigate();
  return (
    <div className="center-wrap">
      <div className="card-box" style={{ width: 420 }}>
        <div className="logo-row"><Logo size={32} /><span className="logo-text">ClearPoint</span></div>
        <div className="logo-sub">Real estate transactions, made clear.</div>
        <div className="role-picker">
          <button className="role-btn" onClick={() => nav('/agent/signin')}>
            <div className="role-icon" style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>🏢</div>
            <div><div className="role-title">I'm the agent</div><div className="role-sub">Manage all your transactions and clients</div></div>
          </button>
          <button className="role-btn" onClick={() => nav('/client')}>
            <div className="role-icon" style={{ background: 'var(--green-light)', color: 'var(--green)' }}>🏠</div>
            <div><div className="role-title">I'm the client</div><div className="role-sub">Track your transaction — no account needed</div></div>
          </button>
        </div>
      </div>
    </div>
  );
}
