import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

function AdminProtectedRoute({ children }) {
  const { user, loading, isAuthenticated } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-loader-screen">
        <div className="admin-spinner"></div>
        <p>Verifying Admin Security Clearance...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default AdminProtectedRoute;
