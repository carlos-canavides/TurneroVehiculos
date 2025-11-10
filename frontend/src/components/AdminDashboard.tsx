import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { turnosApi } from '../api/turnos';
import { inspeccionesApi } from '../api/inspecciones';
import { vehiculosApi } from '../api/vehiculos';
import './AdminDashboard.css';

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

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'turnos' | 'inspecciones' | 'vehiculos'>('turnos');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appointmentsData, inspectionsData, vehiclesData] = await Promise.all([
        turnosApi.getAllAppointments(),
        inspeccionesApi.getAllInspections(),
        vehiculosApi.getAllVehicles(),
      ]);
      setAppointments(appointmentsData);
      setInspections(inspectionsData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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
                        <td>{new Date(appt.dateTime).toLocaleString('es-AR')}</td>
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
                              {appt.inspection.result === 'SAFE' ? '✅ Seguro' : '⚠️ Rechequear'} ({appt.inspection.total} pts)
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
                        <td>{new Date(inspection.appointment.dateTime).toLocaleString('es-AR')}</td>
                        <td>
                          {inspection.inspector.name} ({inspection.inspector.email})
                        </td>
                        <td>{inspection.total} puntos</td>
                        <td>
                          <span className={`result result-${inspection.result.toLowerCase()}`}>
                            {inspection.result === 'SAFE' ? '✅ Seguro' : '⚠️ Rechequear'}
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
      </div>
    </div>
  );
}
