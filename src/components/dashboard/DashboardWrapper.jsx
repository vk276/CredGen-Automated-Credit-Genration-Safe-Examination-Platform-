import React from 'react';
import { useApp } from '../../context/AppContext';
import { AdminDashboard } from './AdminDashboard';
import { TeacherDashboard } from './TeacherDashboard';
import { StudentDashboard } from './StudentDashboard';

export const DashboardWrapper = () => {
  const { currentUser } = useApp();
  const role = currentUser?.role || 'STUDENT';

  switch (role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'TEACHER':
      return <TeacherDashboard />;
    case 'STUDENT':
    default:
      return <StudentDashboard />;
  }
};
