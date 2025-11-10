import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { inspeccionesApi } from '../api/inspecciones';
import './InspectorDashboard.css';

interface Inspection {
  id: string;
  total: number;
  result: string;
  appointment: {
    vehicle: {
      plate: string;
    };
    dateTime: string;
  };
}

export default function InspectorDashboard() {
  const { user, logout } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    try {
      setLoading(true);
      const data = await inspeccionesApi.getMyInspections();
      setInspections(data);
    } catch (error) {
      console.error('Error loading inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="inspector-dashboard">
      <header className="dashboard-header">
        <h1>Panel de Inspector</h1>
        <div className="user-info">
          <span>{user?.email}</span>
          <button onClick={logout}>Cerrar Sesión</button>
        </div>
      </header>

      <div className="dashboard-content">
        <section className="inspections-section">
          <h2>Mis Inspecciones</h2>
          <div className="inspections-list">
            {inspections.length === 0 ? (
              <p>No tienes inspecciones realizadas</p>
            ) : (
              inspections.map((inspection) => (
                <div key={inspection.id} className="inspection-card">
                  <div className="inspection-info">
                    <h3>Vehículo: {inspection.appointment.vehicle.plate}</h3>
                    <p>Fecha: {new Date(inspection.appointment.dateTime).toLocaleString('es-AR')}</p>
                    <p>Total: {inspection.total} puntos</p>
                    <span className={`result result-${inspection.result.toLowerCase()}`}>
                      {inspection.result}
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

