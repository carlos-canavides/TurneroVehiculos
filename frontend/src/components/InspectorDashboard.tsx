import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { turnosApi, type Appointment } from '../api/turnos';
import { inspeccionesApi } from '../api/inspecciones';
import './InspectorDashboard.css';

interface AvailableAppointment extends Appointment {
  requester: {
    id: string;
    name: string;
    email: string;
  };
  template: {
    items: Array<{
      id: string;
      label: string;
      ord: number;
    }>;
  };
}

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
  scores?: Array<{
    itemId: string;
    value: number;
    note?: string;
  }>;
}

interface ActiveInspection {
  id: string;
  total: number;
  appointment: AvailableAppointment;
  items: Array<{
    id: string;
    label: string;
    ord: number;
    score?: number;
    note?: string;
  }>;
}

export default function InspectorDashboard() {
  const { user, logout } = useAuth();
  const [availableAppointments, setAvailableAppointments] = useState<AvailableAppointment[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [activeInspection, setActiveInspection] = useState<ActiveInspection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appointmentsData, inspectionsData] = await Promise.all([
        turnosApi.getConfirmedAvailable(),
        inspeccionesApi.getMyInspections(),
      ]);
      setAvailableAppointments(appointmentsData as AvailableAppointment[]);
      
      // Separar inspecciones finalizadas de las no finalizadas
      const finalizadas = inspectionsData.filter((insp) => {
        // Una inspección está finalizada si tiene note (observación general) y 8 scores
        return insp.note && insp.scores && insp.scores.length === 8;
      });
      const noFinalizadas = inspectionsData.filter((insp) => {
        return !insp.note || !insp.scores || insp.scores.length < 8;
      });
      
      setInspections(finalizadas);
      
      // Si hay una inspección no finalizada, cargarla automáticamente
      if (noFinalizadas.length > 0) {
        const inspection = noFinalizadas[0]; // Tomar la primera no finalizada
        // Obtener los detalles completos de la inspección
        const fullInspection = await inspeccionesApi.getInspectionById(inspection.id);
        
        if (fullInspection && fullInspection.appointment.template) {
          // Mapear los items de la template con los scores existentes
          const itemsWithScores = fullInspection.appointment.template.items.map((item: any) => {
            const existingScore = fullInspection.scores?.find((s: any) => s.itemId === item.id);
            return {
              id: item.id,
              label: item.label,
              ord: item.ord,
              score: existingScore?.value,
              note: existingScore?.note,
            };
          });
          
          setActiveInspection({
            id: fullInspection.id,
            total: fullInspection.total || 0,
            appointment: {
              id: fullInspection.appointment.id,
              dateTime: fullInspection.appointment.dateTime,
              vehicle: fullInspection.appointment.vehicle,
              requester: fullInspection.appointment.requester || {
                id: '',
                name: 'N/A',
                email: 'N/A',
              },
              template: {
                items: fullInspection.appointment.template.items,
              },
            } as AvailableAppointment,
            items: itemsWithScores,
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInspection = async (appointment: AvailableAppointment) => {
    try {
      const inspection = await inspeccionesApi.createInspection(appointment.id);
      setActiveInspection({
        id: inspection.id,
        total: inspection.total || 0,
        appointment,
        items: appointment.template.items.map((item) => ({
          id: item.id,
          label: item.label,
          ord: item.ord,
        })),
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al crear inspección');
    }
  };

  const handleScoreChange = async (itemId: string, value: number, note?: string) => {
    if (!activeInspection) return;
    
    try {
      await inspeccionesApi.addScore(activeInspection.id, itemId, value, note);
      
      // Recargar la inspección para obtener el total actualizado
      const updatedInspection = await inspeccionesApi.getInspectionById(activeInspection.id);
      
      if (updatedInspection && updatedInspection.appointment.template) {
        // Mapear los items de la template con los scores existentes
        const itemsWithScores = updatedInspection.appointment.template.items.map((item: any) => {
          const existingScore = updatedInspection.scores?.find((s: any) => s.itemId === item.id);
          return {
            id: item.id,
            label: item.label,
            ord: item.ord,
            score: existingScore?.value,
            note: existingScore?.note,
          };
        });
        
        // Actualizar el estado local con los datos actualizados
        setActiveInspection({
          id: updatedInspection.id,
          total: updatedInspection.total || 0,
          appointment: activeInspection.appointment,
          items: itemsWithScores,
        });
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al agregar puntaje');
    }
  };

  const handleFinalize = async (observacionGeneral?: string) => {
    if (!activeInspection) return;
    
    // Validar que todos los ítems tengan puntaje
    const allScored = activeInspection.items.every((item) => item.score !== undefined);
    if (!allScored) {
      alert('Debes puntuar todos los ítems antes de finalizar');
      return;
    }

    try {
      await inspeccionesApi.finalizeInspection(activeInspection.id, observacionGeneral);
      setActiveInspection(null);
      loadData();
      alert('Inspección finalizada exitosamente');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al finalizar inspección');
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
        {activeInspection ? (
          <section className="active-inspection-section">
            <div className="section-header">
              <h2>Inspección en Curso</h2>
              <button onClick={() => setActiveInspection(null)}>Cancelar</button>
            </div>
            <div className="inspection-info">
              <h3>Vehículo: {activeInspection.appointment.vehicle.plate}</h3>
              <p>Fecha: {new Date(activeInspection.appointment.dateTime).toLocaleString('es-AR')}</p>
              <p>Dueño: {activeInspection.appointment.requester?.name || 'N/A'}</p>
              <p><strong>Total acumulado: {activeInspection.total} puntos</strong></p>
            </div>

            <div className="items-list">
              <h3>Puntajes (1-10 por ítem):</h3>
              {activeInspection.items.map((item) => (
                <div key={item.id} className="item-score-card">
                  <h4>{item.ord}. {item.label}</h4>
                  <div className="score-inputs">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={item.score || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value >= 1 && value <= 10) {
                          handleScoreChange(item.id, value);
                        }
                      }}
                      placeholder="1-10"
                    />
                    <input
                      type="text"
                      placeholder="Observación (opcional)"
                      value={item.note || ''}
                      onChange={(e) => {
                        if (item.score) {
                          handleScoreChange(item.id, item.score, e.target.value);
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="finalize-section">
              <textarea
                placeholder="Observación general (opcional)"
                rows={3}
                id="observacionGeneral"
              />
              <button
                onClick={() => {
                  const obs = (document.getElementById('observacionGeneral') as HTMLTextAreaElement)?.value;
                  handleFinalize(obs || undefined);
                }}
                className="finalize-btn"
              >
                Finalizar Inspección
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="available-appointments-section">
              <h2>Turnos Disponibles para Inspección</h2>
              <div className="appointments-list">
                {availableAppointments.length === 0 ? (
                  <p>No hay turnos confirmados disponibles</p>
                ) : (
                  availableAppointments.map((appt) => (
                    <div key={appt.id} className="appointment-card">
                      <div className="appointment-info">
                        <h3>Vehículo: {appt.vehicle.plate}</h3>
                        <p>Fecha: {new Date(appt.dateTime).toLocaleString('es-AR')}</p>
                        <p>Dueño: {appt.requester?.name || 'N/A'} ({appt.requester?.email || 'N/A'})</p>
                        <button
                          onClick={() => handleStartInspection(appt)}
                          className="start-inspection-btn"
                        >
                          Iniciar Inspección
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="inspections-section">
              <h2>Mis Inspecciones Realizadas</h2>
              <div className="inspections-list">
                {inspections.length === 0 ? (
                  <p>No has realizado inspecciones</p>
                ) : (
                  inspections.map((inspection) => (
                    <div key={inspection.id} className="inspection-card">
                      <div className="inspection-info">
                        <h3>Vehículo: {inspection.appointment.vehicle.plate}</h3>
                        <p>Fecha: {new Date(inspection.appointment.dateTime).toLocaleString('es-AR')}</p>
                        <p>Total: {inspection.total} puntos</p>
                        <span className={`result result-${inspection.result.toLowerCase()}`}>
                          {inspection.result === 'SAFE' ? 'Seguro' : 'Rechequear'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
