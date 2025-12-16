import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { Loader, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { profile, loading } = useGlobal();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <Loader className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // System Admin has superuser access to almost everything, 
  // but we can still restrict if needed by not including 'system_admin' in allowedRoles
  // For this system, we'll treat system_admin as having access if 'admin' has access, 
  // or if explicitly listed.
  const effectiveRole = profile.role;
  const hasAccess = allowedRoles.includes(effectiveRole) || (effectiveRole === 'system_admin' && allowedRoles.includes('admin'));

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500 max-w-md mb-6">
          You do not have permission to view this page. If you believe this is an error, please contact your administrator.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
