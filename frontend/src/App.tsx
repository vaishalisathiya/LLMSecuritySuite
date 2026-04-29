import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Models from './pages/Models';
import Prompts from './pages/Prompts';
import Scans from './pages/Scans';
import Reports from './pages/Reports';
import AuthPage from './pages/Auth';

function RequireAuth({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('user') ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="scans" element={<Scans />} />
          <Route path="reports" element={<Reports />} />
          <Route path="prompts" element={<Prompts />} />
          <Route path="models" element={<Models />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
