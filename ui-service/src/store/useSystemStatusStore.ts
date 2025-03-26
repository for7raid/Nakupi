import { create } from 'zustand';
import { healthAPI } from '../api/client';
import { Status } from '../types';

interface StatusState {
  status: boolean;
  error: string | null;
  uptime: number | null;
  timestamp: number | null;
  lastChecked: number | null;
  getStatus: () => Promise<void>;
}

export const useSystemStatusStore = create<StatusState>((set) => ({
  status: false,
  error: null,
  uptime: null,
  timestamp: null,
  lastChecked: null,
  
  getStatus: async () => {
    try {
      const response = await healthAPI.getStatus();
      set({ 
        status: response.status === 'OK',
        uptime: response.uptime,
        timestamp: response.timestamp,
        lastChecked: Date.now(),
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'API не доступно';
      set({ 
        error: errorMessage, 
        status: false,
        lastChecked: Date.now()
      });
    }
  },
})); 