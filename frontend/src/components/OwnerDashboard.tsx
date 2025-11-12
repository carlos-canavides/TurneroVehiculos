import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { vehiculosApi } from '../api/vehiculos';
import { turnosApi } from '../api/turnos';
import { inspeccionesApi } from '../api/inspecciones';
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
  inspection?: {
    id: string;
    total: number;
    result: string;
    note?: string;
    scores?: Array<{ id: string; value: number }>;
  };
}

// Función helper para formatear fecha/hora desde el formato del backend
const formatDateTime = (dateTimeString: string): string => {
  // El formato que viene es YYYY-MM-DDTHH:mm:ss
  // Lo parseamos manualmente para evitar problemas de zona horaria
  const [datePart, timePart] = dateTimeString.split('T');
  const [year, month, day] = datePart.split('-');
  const [hours, minutes] = timePart.split(':');
  
  // Formatear como DD/MM/YYYY HH:mm
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export default function OwnerDashboard() {
  const { user, logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newAlias, setNewAlias] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');

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
      
      // Cargar inspecciones para cada turno
      const appointmentsWithInspections = await Promise.all(
        appointmentsData.map(async (appt) => {
          if (appt.state === 'CONFIRMED') {
            try {
              const inspection = await inspeccionesApi.getInspectionByAppointment(appt.id);
              return { ...appt, inspection };
            } catch {
              return appt;
            }
          }
          return appt;
        })
      );
      setAppointments(appointmentsWithInspections);
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

  const handleLoadAvailability = async () => {
    try {
      const availability = await turnosApi.getAvailability();
      setAvailableSlots(availability.horariosDisponibles);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al cargar disponibilidad');
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedSlot) {
      alert('Debes seleccionar un vehículo y un horario');
      return;
    }
    try {
      await turnosApi.createAppointment(selectedVehicle, selectedSlot);
      setSelectedVehicle('');
      setSelectedSlot('');
      setShowNewAppointment(false);
      setAvailableSlots([]);
      loadData();
      alert('Turno solicitado exitosamente. Debes confirmarlo.');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al crear turno');
    }
  };

  const handleConfirmAppointment = async (id: string) => {
    try {
      await turnosApi.confirmAppointment(id);
      loadData();
      alert('Turno confirmado exitosamente');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al confirmar turno');
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
          <div className="section-header">
            <h2>Mis Turnos</h2>
            <button onClick={() => {
              setShowNewAppointment(!showNewAppointment);
              if (!showNewAppointment) {
                handleLoadAvailability();
              }
            }}>
              {showNewAppointment ? 'Cancelar' : '+ Solicitar Turno'}
            </button>
          </div>

          {showNewAppointment && (
            <form onSubmit={handleCreateAppointment} className="new-appointment-form">
              {vehicles.length === 0 ? (
                <p style={{ color: '#dc3545', padding: '10px' }}>
                  Debes tener al menos un vehículo registrado para solicitar un turno.
                </p>
              ) : (
                <>
                  <div className="form-group">
                    <label>Seleccionar Vehículo:</label>
                    <select
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                      required
                    >
                      <option value="">-- Selecciona un vehículo --</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.plate} {v.alias && `(${v.alias})`}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {vehicles.length > 0 && (
                <>
                  {availableSlots.length > 0 ? (
                    <div className="form-group">
                      <label>Horarios Disponibles:</label>
                      <select
                        value={selectedSlot}
                        onChange={(e) => setSelectedSlot(e.target.value)}
                        required
                      >
                        <option value="">-- Selecciona un horario --</option>
                        {availableSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {formatDateTime(slot)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p style={{ color: '#666', padding: '10px' }}>
                      Cargando horarios disponibles...
                    </p>
                  )}

                  <button type="submit" disabled={!selectedVehicle || !selectedSlot || availableSlots.length === 0}>
                    Solicitar Turno
                  </button>
                </>
              )}
            </form>
          )}

          <div className="appointments-list">
            {appointments.length === 0 ? (
              <p>No tienes turnos registrados</p>
            ) : (
              appointments.map((appt) => (
                <div key={appt.id} className="appointment-card">
                  <div className="appointment-info">
                    <h3>Vehículo: {appt.vehicle.plate}</h3>
                    <p>Fecha: {new Date(appt.dateTime).toLocaleString('es-AR')}</p>
                    <span className={`state state-${appt.state.toLowerCase()}`}>
                      {appt.state}
                    </span>
                    
                    {appt.state === 'PENDING' && (
                      <button
                        className="confirm-btn"
                        onClick={() => handleConfirmAppointment(appt.id)}
                      >
                        Confirmar Turno
                      </button>
                    )}

                    {appt.inspection && (() => {
                      // Determinar si la inspección está finalizada
                      // Está finalizada si tiene 8 puntajes Y tiene una observación general (note)
                      const isFinalizada = appt.inspection.scores && appt.inspection.scores.length === 8 && appt.inspection.note;
                      
                      return (
                        <div className="inspection-result">
                          <h4>Resultado de Inspección:</h4>
                          <p>Total: {appt.inspection.total} puntos</p>
                          {isFinalizada ? (
                            <p className={`result result-${appt.inspection.result.toLowerCase()}`}>
                              {appt.inspection.result === 'SAFE' ? 'Seguro' : 'Rechequear'}
                            </p>
                          ) : (
                            <p className="result result-revisando">Revisando...</p>
                          )}
                          {appt.inspection.note && (
                            <p className="inspection-note">Observación: {appt.inspection.note}</p>
                          )}
                        </div>
                      );
                    })()}
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
