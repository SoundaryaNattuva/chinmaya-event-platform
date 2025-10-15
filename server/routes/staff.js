import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StaffRouter = ({ user }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const userRole = user.role; // 'ADMIN', 'STAFF' or 'VOLUNTEER'

    if (isMobile) {
      // Everyone on mobile goes to check-in screen
      navigate('/staff/checkin');
    } else {
      // Desktop routing based on role
      if (userRole === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (userRole === 'VOLUNTEER') {
        navigate('/volunteer/dashboard');
      }
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl text-gray-600">Redirecting...</div>
    </div>
  );
};

export default StaffRouter;