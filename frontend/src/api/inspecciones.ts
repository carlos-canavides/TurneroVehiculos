import { apiClient } from './client';

export interface Inspection {
  id: string;
  total: number;
  result: string;
  note?: string;
  appointment: {
    vehicle: {
      plate: string;
    };
    dateTime: string;
  };
}

export const inspeccionesApi = {
  getMyInspections: async (): Promise<Inspection[]> => {
    const response = await apiClient.get<Inspection[]>('/inspecciones/mias');
    return response.data;
  },

  getInspectionByAppointment: async (appointmentId: string): Promise<Inspection> => {
    const response = await apiClient.get<Inspection>(`/inspecciones/turno/${appointmentId}`);
    return response.data;
  },

  createInspection: async (turnoId: string): Promise<any> => {
    const response = await apiClient.post('/inspecciones', { turnoId });
    return response.data;
  },

  addScore: async (inspectionId: string, itemId: string, valor: number, nota?: string): Promise<any> => {
    const response = await apiClient.post(`/inspecciones/${inspectionId}/puntajes`, {
      itemId,
      valor,
      nota,
    });
    return response.data;
  },

  finalizeInspection: async (inspectionId: string, observacionGeneral?: string): Promise<any> => {
    const response = await apiClient.patch(`/inspecciones/${inspectionId}/finalizar`, {
      observacionGeneral,
    });
    return response.data;
  },

  getInspectionById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/inspecciones/${id}`);
    return response.data;
  },

  getAllInspections: async (): Promise<any[]> => {
    const response = await apiClient.get('/inspecciones/todas');
    return response.data;
  },
};

