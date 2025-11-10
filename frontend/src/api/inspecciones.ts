import { apiClient } from './client';

export interface Inspection {
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

export const inspeccionesApi = {
  getMyInspections: async (): Promise<Inspection[]> => {
    const response = await apiClient.get<Inspection[]>('/inspecciones/mias');
    return response.data;
  },
};

