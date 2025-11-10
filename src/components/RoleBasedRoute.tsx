import { Navigate } from 'react-router-dom';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { Loader2 } from 'lucide-react';
import { AppRole } from '@/hooks/useUserRole';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  redirectTo?: string;
}

export const RoleBasedRoute = ({ 
  children, 
  allowedRoles,
  redirectTo = '/'
}: RoleBasedRouteProps) => {
  const { role, loading } = useRoleCheck();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
