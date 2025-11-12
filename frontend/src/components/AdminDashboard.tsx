import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { turnosApi } from '../api/turnos';
import { inspeccionesApi } from '../api/inspecciones';
import { vehiculosApi } from '../api/vehiculos';
import { usersApi } from '../api/users';
import { authApi } from '../api/auth';
import './AdminDashboard.css';

// Función helper para formatear fecha/hora desde el formato del backend
const formatDateTime = (dateTimeString: string): string => {
  // El formato que viene puede ser ISO con Z o sin Z
  // Lo parseamos manualmente para evitar problemas de zona horaria
  try {
    const date = new Date(dateTimeString);
    // Si viene en formato ISO sin Z, asumimos hora local
    const dateStr = dateTimeString.includes('T') 
      ? dateTimeString.split('T')[0] 
      : date.toISOString().split('T')[0];
    const timeStr = dateTimeString.includes('T')
      ? dateTimeString.split('T')[1]?.split('.')[0] || dateTimeString.split('T')[1]?.split('Z')[0] || ''
      : date.toTimeString().split(' ')[0];
    
    if (timeStr) {
      const [year, month, day] = dateStr.split('-');
      const [hours, minutes, seconds] = timeStr.split(':');
      // Formatear como DD/MM/YYYY HH:mm:ss
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds || '00'}`;
    }
    
    // Fallback a formato estándar
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    // Si falla, intentar parsear directamente
    const date = new Date(dateTimeString);
    return date.toLocaleString('es-AR');
  }
};

interface Appointment {
  id: string;
  dateTime: string;
  state: string;
  vehicle: {
    plate: string;
    alias?: string;
    owner: {
      name: string;
      email: string;
    };
  };
  requester: {
    name: string;
    email: string;
  };
  inspector?: {
    name: string;
    email: string;
  };
  inspection?: {
    id: string;
    total: number;
    result: string;
  };
}

interface Inspection {
  id: string;
  total: number;
  result: string;
  note?: string;
  appointment: {
    vehicle: {
      plate: string;
      owner: {
        name: string;
        email: string;
      };
    };
    dateTime: string;
  };
  inspector: {
    name: string;
    email: string;
  };
}

interface Vehicle {
  id: string;
  plate: string;
  alias?: string;
  owner: {
    name: string;
    email: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  active: boolean;
  roles: Array<{
    role: {
      name: string;
    };
  }>;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'turnos' | 'inspecciones' | 'vehiculos' | 'usuarios'>('turnos');
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appointmentsData, inspectionsData, vehiclesData, usersData] = await Promise.all([
        turnosApi.getAllAppointments(),
        inspeccionesApi.getAllInspections(),
        vehiculosApi.getAllVehicles(),
        usersApi.getAllUsers(),
      ]);
      setAppointments(appointmentsData);
      setInspections(inspectionsData);
      setVehicles(vehiclesData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authApi.register({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
      });
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setShowNewUser(false);
      loadData();
      alert('Usuario creado exitosamente');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al crear usuario');
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

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
        <div className="tabs">
          <button
            className={activeTab === 'turnos' ? 'active' : ''}
            onClick={() => setActiveTab('turnos')}
          >
            Turnos ({appointments.length})
          </button>
          <button
            className={activeTab === 'inspecciones' ? 'active' : ''}
            onClick={() => setActiveTab('inspecciones')}
          >
            Inspecciones ({inspections.length})
          </button>
          <button
            className={activeTab === 'vehiculos' ? 'active' : ''}
            onClick={() => setActiveTab('vehiculos')}
          >
            Vehículos ({vehicles.length})
          </button>
          <button
            className={activeTab === 'usuarios' ? 'active' : ''}
            onClick={() => setActiveTab('usuarios')}
          >
            Usuarios ({users.length})
          </button>
        </div>

        {activeTab === 'turnos' && (
          <section className="admin-section">
            <h2>Todos los Turnos</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Vehículo</th>
                    <th>Dueño</th>
                    <th>Fecha/Hora</th>
                    <th>Estado</th>
                    <th>Inspector</th>
                    <th>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={6}>No hay turnos registrados</td>
                    </tr>
                  ) : (
                    appointments.map((appt) => (
                      <tr key={appt.id}>
                        <td>{appt.vehicle.plate}</td>
                        <td>{appt.vehicle.owner.name} ({appt.vehicle.owner.email})</td>
                        <td>{formatDateTime(appt.dateTime)}</td>
                        <td>
                          <span className={`state state-${appt.state.toLowerCase()}`}>
                            {appt.state}
                          </span>
                        </td>
                        <td>
                          {appt.inspector ? `${appt.inspector.name} (${appt.inspector.email})` : '-'}
                        </td>
                        <td>
                          {appt.inspection ? (
                            <span className={`result result-${appt.inspection.result.toLowerCase()}`}>
                              {appt.inspection.result === 'SAFE' ? 'Seguro' : 'Rechequear'} ({appt.inspection.total} pts)
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'inspecciones' && (
          <section className="admin-section">
            <h2>Todas las Inspecciones</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Vehículo</th>
                    <th>Dueño</th>
                    <th>Fecha</th>
                    <th>Inspector</th>
                    <th>Total</th>
                    <th>Resultado</th>
                    <th>Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.length === 0 ? (
                    <tr>
                      <td colSpan={7}>No hay inspecciones realizadas</td>
                    </tr>
                  ) : (
                    inspections.map((inspection) => (
                      <tr key={inspection.id}>
                        <td>{inspection.appointment.vehicle.plate}</td>
                        <td>
                          {inspection.appointment.vehicle.owner.name} (
                          {inspection.appointment.vehicle.owner.email})
                        </td>
                        <td>{formatDateTime(inspection.appointment.dateTime)}</td>
                        <td>
                          {inspection.inspector.name} ({inspection.inspector.email})
                        </td>
                        <td>{inspection.total} puntos</td>
                        <td>
                          <span className={`result result-${inspection.result.toLowerCase()}`}>
                            {inspection.result === 'SAFE' ? 'Seguro' : 'Rechequear'}
                          </span>
                        </td>
                        <td>{inspection.note || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'vehiculos' && (
          <section className="admin-section">
            <h2>Todos los Vehículos</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Patente</th>
                    <th>Alias</th>
                    <th>Dueño</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No hay vehículos registrados</td>
                    </tr>
                  ) : (
                    vehicles.map((vehicle) => (
                      <tr key={vehicle.id}>
                        <td>{vehicle.plate}</td>
                        <td>{vehicle.alias || '-'}</td>
                        <td>{vehicle.owner.name}</td>
                        <td>{vehicle.owner.email}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'usuarios' && (
          <section className="admin-section">
            <div className="section-header">
              <h2>Usuarios</h2>
              <button onClick={() => setShowNewUser(!showNewUser)}>
                {showNewUser ? 'Cancelar' : '+ Nuevo Usuario'}
              </button>
            </div>

            {showNewUser && (
              <form onSubmit={handleCreateUser} className="new-user-form" style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    required
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                  <input
                    type="text"
                    placeholder="Contraseña (solo letras y números)"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    required
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                  <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Crear Usuario
                  </button>
                </div>
              </form>
            )}

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Contraseña (hasheada)</th>
                    <th>Roles</th>
                    <th>Activo</th>
                    <th>Fecha Creación</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6}>No hay usuarios registrados</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {u.password}
                        </td>
                        <td>
                          {u.roles.map((r) => r.role.name).join(', ')}
                        </td>
                        <td>{u.active ? '✅' : '❌'}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString('es-AR')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
