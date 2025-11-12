import { apiClient } from './client';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // Hasheada
  active: boolean;
  roles: Array<{
    role: {
      name: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export const usersApi = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/users/todos');
    return response.data;
  },
};

