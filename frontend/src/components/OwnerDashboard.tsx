import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { vehiculosApi } from '../api/vehiculos';
import { turnosApi } from '../api/turnos';
import './OwnerDashboard.css';

interface Vehicle {
  id: string;
  plate: string;
  alias?: string;
}

interface Appointment {
  id: string;
  dateTime: string;
  state: string;
  vehicle: Vehicle;
}

export default function OwnerDashboard() {
  const { user, logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newAlias, setNewAlias] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vehiclesData, appointmentsData] = await Promise.all([
        vehiculosApi.getMyVehicles(),
        turnosApi.getMyAppointments(),
      ]);
      setVehicles(vehiclesData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await vehiculosApi.createVehicle(newPlate, newAlias || undefined);
      setNewPlate('');
      setNewAlias('');
      setShowNewVehicle(false);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al crear vehículo');
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="owner-dashboard">
      <header className="dashboard-header">
        <h1>Panel de Dueño de Vehículo</h1>
        <div className="user-info">
          <span>{user?.email}</span>
          <button onClick={logout}>Cerrar Sesión</button>
        </div>
      </header>

      <div className="dashboard-content">
        <section className="vehicles-section">
          <div className="section-header">
            <h2>Mis Vehículos</h2>
            <button onClick={() => setShowNewVehicle(!showNewVehicle)}>
              {showNewVehicle ? 'Cancelar' : '+ Nuevo Vehículo'}
            </button>
          </div>

          {showNewVehicle && (
            <form onSubmit={handleCreateVehicle} className="new-vehicle-form">
              <input
                type="text"
                placeholder="Patente (ej: ABC123)"
                value={newPlate}
                onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                required
              />
              <input
                type="text"
                placeholder="Alias (opcional)"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
              />
              <button type="submit">Crear</button>
            </form>
          )}

          <div className="vehicles-list">
            {vehicles.length === 0 ? (
              <p>No tienes vehículos registrados</p>
            ) : (
              vehicles.map((vehicle) => (
                <div key={vehicle.id} className="vehicle-card">
                  <h3>{vehicle.plate}</h3>
                  {vehicle.alias && <p className="alias">{vehicle.alias}</p>}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="appointments-section">
          <h2>Mis Turnos</h2>
          <div className="appointments-list">
            {appointments.length === 0 ? (
              <p>No tienes turnos registrados</p>
            ) : (
              appointments.map((appt) => (
                <div key={appt.id} className="appointment-card">
                  <div className="appointment-info">
                    <h3>{appt.vehicle.plate}</h3>
                    <p>{new Date(appt.dateTime).toLocaleString('es-AR')}</p>
                    <span className={`state state-${appt.state.toLowerCase()}`}>
                      {appt.state}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

