import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLoader from './BrandLoader';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <BrandLoader fullScreen={true} />;
  }

  // 1. Unauthenticated users redirected to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Role authorization check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user attempts to access an unauthorized route, redirect to their role-specific default route
    if (user.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    } else if (user.role === 'mentor') {
      return <Navigate to="/mentor/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
