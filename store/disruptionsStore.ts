import { getAllLineStatus } from '@/services/api/disruptions';
import { LineStatus } from '@/types/disruption';
import { create } from 'zustand';

interface DisruptionsStore {
  lineStatuses: LineStatus[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Actions
  fetchLineStatus: () => Promise<void>;
  clearError: () => void;
  
  // Computed values
  getDisruptedLines: () => LineStatus[];
  getGoodServiceLines: () => LineStatus[];
}

export const useDisruptionsStore = create<DisruptionsStore>((set, get) => ({
  lineStatuses: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchLineStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const lineStatuses = await getAllLineStatus();
      
      set({ 
        lineStatuses,
        lastUpdated: new Date(),
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch line status',
        isLoading: false 
      });
    }
  },

  clearError: () => set({ error: null }),

  getDisruptedLines: () => {
    const { lineStatuses } = get();
    // StatusSeverity: 10 = Good Service, anything less indicates issues
    return lineStatuses.filter(line => line.statusSeverity < 10);
  },

  getGoodServiceLines: () => {
    const { lineStatuses } = get();
    return lineStatuses.filter(line => line.statusSeverity === 10);
  },
}));
