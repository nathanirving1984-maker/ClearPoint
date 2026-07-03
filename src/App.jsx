import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RolePicker from './pages/RolePicker';
import AgentSignIn from './pages/AgentSignIn';
import AgentApp from './pages/AgentApp';
import ClientEntry from './pages/ClientEntry';
import ClientApp from './pages/ClientApp';

function RequireAgent({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/agent/signin" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RolePicker />} />
          <Route path="/agent/signin" element={<AgentSignIn />} />
          <Route path="/agent/*" element={<RequireAgent><AgentApp /></RequireAgent>} />
          <Route path="/client" element={<ClientEntry />} />
          <Route path="/client/:txnId" element={<ClientApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
