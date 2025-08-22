import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Homepage from './components/public/Homepage';
import EventDetail from './components/public/EventDetail';
import Login from './components/Login';
import AdminDashboard from './components/admin/AdminDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-blue flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Homepage />} />
        <Route path="/events/:eventId" element={<EventDetail />} />
        
        {/* Staff Routes */}
        <Route 
          path="/staff/login" 
          element={user ? <Navigate to="/staff/dashboard" /> : <Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/staff/dashboard" 
          element={user ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/staff/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;