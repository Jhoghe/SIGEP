import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Prisoners from './pages/Prisoners';
import Cells from './pages/Cells';
import Layout from './components/Layout';
import Crimes from './pages/Crimes';
import Visits from './pages/Visits';
import Transfers from './pages/Transfers';
import Lawyers from './pages/Lawyers';
import Reports from './pages/Reports';
import Incidents from './pages/Incidents';
import Inspectors from './pages/Inspectors';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import PlaceholderPage from './pages/PlaceholderPage';
import GlobalErrorHandler from './components/GlobalErrorHandler';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));

  const handleLogin = (token: string, user: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  return (
    <GlobalErrorHandler>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
          />
          
          <Route 
            path="/" 
            element={isAuthenticated ? <Layout onLogout={handleLogout} /> : <Navigate to="/login" />}
          >
            <Route index element={<Dashboard />} />
            <Route path="prisoners" element={<Prisoners />} />
            <Route path="cells" element={<Cells />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="crimes" element={<Crimes />} />
            <Route path="transfers" element={<Transfers />} />
            <Route path="visits" element={<Visits />} />
            <Route path="lawyers" element={<Lawyers />} />
            <Route path="reports" element={<Reports />} />
            <Route path="inspectors" element={<Inspectors />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </GlobalErrorHandler>
  );
}
