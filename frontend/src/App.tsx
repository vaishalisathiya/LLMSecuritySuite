import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Models from './pages/Models';
import Prompts from './pages/Prompts';
import Scans from './pages/Scans';
import Reports from './pages/Reports';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
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
