import { Navigate } from 'react-router-dom';
import { getUser } from '../lib/auth';

export default function ProtectedRoute({ children, roles }) {
  const user = getUser();

  if (!user?.role) {
    return <Navigate to="/login" replace />;
  }

  if (Array.isArray(roles) && roles.length > 0) {
    const normalizedUserRole = typeof user.role === 'string' ? user.role.trim() : user.role;

    if (!roles.includes(normalizedUserRole)) {
      return <Navigate to="/" replace />;
    }
  }


  return children;
}

