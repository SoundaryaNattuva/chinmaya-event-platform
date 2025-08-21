import React, { useState, useEffect } from 'react';
import Homepage from './components/public/Homepage';
import Login from './components/Login';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setShowLogin(true); // Go straight to dashboard if already logged in
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setShowLogin(true);
  };

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowLogin(false);
  };

  const goBackToPublic = () => {
    setShowLogin(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-blue flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show login page if requested
  if (showLogin && !user) {
    return <Login onLogin={handleLogin} onBack={goBackToPublic} />;
  }

  // Show staff dashboard if logged in
  if (showLogin && user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Dashboard Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-brand-blue">Chinmaya Events - Staff Portal</h1>
                <p className="text-gray-600">Welcome back, {user.name}!</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={goBackToPublic}
                  className="text-brand-blue hover:text-brand-blue-light font-medium"
                >
                  Public Site
                </button>
                <span className="bg-brand-orange text-white px-3 py-1 rounded-full text-sm font-medium">
                  {user.role}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">
                  Staff Dashboard Coming Soon!
                </h2>
                <p className="text-gray-500">
                  {user.role === 'ADMIN' ? 'Admin features' : 'Volunteer features'} will appear here
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show public homepage by default
  return <Homepage onLoginClick={handleLoginClick} />;
}

export default App;