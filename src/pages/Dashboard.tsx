import React from 'react';
import { useGlobal } from '../context/GlobalContext';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import TeacherDashboard from '../components/dashboards/TeacherDashboard';
import StudentDashboard from '../components/dashboards/StudentDashboard';
import ParentDashboard from '../components/dashboards/ParentDashboard';
import CashierDashboard from '../components/dashboards/CashierDashboard';
import { Loader, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';

const Dashboard: React.FC = () => {
  const { profile, loading } = useGlobal();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // Cast role to any to support extended roles
  const role = (profile?.role as any);

  switch (role) {
    case 'admin':
    case 'principal':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    case 'parent':
      return <ParentDashboard />;
    case 'cashier':
      return <CashierDashboard />;
    default:
      return (
        <div className="flex flex-col justify-center items-center h-96 text-center p-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to Load Dashboard</h2>
          <p className="text-slate-500 max-w-md mb-6">
            We couldn't retrieve your profile information. This might be due to a network issue or missing permissions.
          </p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      );
  }
};

export default Dashboard;
