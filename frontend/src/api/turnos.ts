import { apiClient } from './client';

export interface Appointment {
  id: string;
  dateTime: string;
  state: string;
  vehicle: {
    id: string;
    plate: string;
    alias?: string;
  };
}

export interface AvailableSlot {
  horariosDisponibles: string[];
  total: number;
}

export const turnosApi = {
  getMyAppointments: async (): Promise<Appointment[]> => {
    const response = await apiClient.get<Appointment[]>('/turnos/mios');
    return response.data;
  },

  getAvailability: async (): Promise<AvailableSlot> => {
    const response = await apiClient.get<AvailableSlot>('/turnos/disponibilidad');
    return response.data;
  },

  createAppointment: async (vehicleId: string, scheduledAt: string): Promise<Appointment> => {
    const response = await apiClient.post<Appointment>('/turnos', {
      vehicleId,
      scheduledAt,
    });
    return response.data;
  },

  confirmAppointment: async (id: string): Promise<Appointment> => {
    const response = await apiClient.patch<Appointment>(`/turnos/${id}/confirmar`);
    return response.data;
  },
};

