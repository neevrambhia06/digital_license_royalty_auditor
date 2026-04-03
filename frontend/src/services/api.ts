import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const auditService = {
  runAudit: async () => {
    const response = await api.post('/audit/run');
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  },

  getPayments: async (contentId?: string) => {
    const url = contentId ? `/payments?content_id=${contentId}&limit=1000` : '/payments?limit=2000';
    const response = await api.get(url);
    return response.data;
  },

  getAuditResults: async (contentId?: string) => {
    const url = contentId ? `/audit-results?content_id=${contentId}` : '/audit-results?limit=1000';
    const response = await api.get(url);
    return response.data;
  },

  getCalculations: async (contentId: string) => {
    const results = await auditService.getAuditResults(contentId);
    return results[0] || null;
  },

  getContracts: async (limit = 100) => {
    const response = await api.get(`/contracts?limit=${limit}`);
    return response.data;
  },

  getLogs: async (limit = 100) => {
    const response = await api.get(`/logs?limit=${limit}`);
    return response.data;
  },

  getViolations: async (limit = 100) => {
    const response = await api.get(`/violations?limit=${limit}`);
    return response.data;
  },

  getTraces: async (runId?: string) => {
    const url = runId ? `/traces?run_id=${runId}` : '/traces';
    const response = await api.get(url);
    return response.data;
  },

  getUsageAggregation: async () => {
    const response = await api.get('/usage/aggregation');
    return response.data;
  },

  addContract: async (contractData: any) => {
    const response = await api.post('/contracts', contractData);
    return response.data;
  },

  syncLedger: async () => {
    // Re-use current audit engine to simulate a full ledger reconciliation
    const response = await api.post('/audit/run');
    return response.data;
  },

  generateData: async () => {
    const response = await api.post('/setup/generate');
    return response.data;
  },

  seedDatabase: async () => {
    const response = await api.post('/setup/seed');
    return response.data;
  },

  getCountriesBreakdown: async (contentId: string) => {
    const response = await api.get(`/logs?content_id=${contentId}&limit=1000`);
    return response.data;
  }
};

export default api;
