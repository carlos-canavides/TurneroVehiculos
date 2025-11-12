import { apiClient } from './client';

export interface Vehicle {
  id: string;
  plate: string;
  alias?: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

export const vehiculosApi = {
  getMyVehicles: async (): Promise<Vehicle[]> => {
    const response = await apiClient.get<Vehicle[]>('/vehiculos/mios');
    return response.data;
  },

  createVehicle: async (plate: string, alias?: string): Promise<Vehicle> => {
    const response = await apiClient.post<Vehicle>('/vehiculos', {
      patente: plate,
      alias,
    });
    return response.data;
  },

  getAllVehicles: async (): Promise<Vehicle[]> => {
    const response = await apiClient.get<Vehicle[]>('/vehiculos/todos');
    return response.data;
  },
};

