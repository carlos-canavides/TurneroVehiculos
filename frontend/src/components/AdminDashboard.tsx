import { useAuth } from '../contexts/AuthContext';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Panel de Administrador</h1>
        <div className="user-info">
          <span>{user?.email}</span>
          <button onClick={logout}>Cerrar Sesión</button>
        </div>
      </header>

      <div className="dashboard-content">
        <section className="admin-section">
          <h2>Bienvenido, Administrador</h2>
          <p>Panel de administración en construcción...</p>
        </section>
      </div>
    </div>
  );
}

