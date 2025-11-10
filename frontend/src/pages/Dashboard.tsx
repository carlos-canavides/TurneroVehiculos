import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OwnerDashboard from '../components/OwnerDashboard';
import InspectorDashboard from '../components/InspectorDashboard';
import AdminDashboard from '../components/AdminDashboard';
import './Dashboard.css';

export default function Dashboard() {
  const { isAuthenticated, hasRole, loading } = useAuth();

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (hasRole('ADMIN')) {
    return <AdminDashboard />;
  }

  if (hasRole('INSPECTOR')) {
    return <InspectorDashboard />;
  }

  if (hasRole('OWNER')) {
    return <OwnerDashboard />;
  }

  return (
    <div className="dashboard">
      <h1>No tienes permisos para acceder a esta aplicación</h1>
    </div>
  );
}

