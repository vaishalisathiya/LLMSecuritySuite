import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export interface User { id: number; name: string; email: string; }
export interface Model { id: number; name: string; provider: string; model_type: string; access_method: string; credential_reference: string | null; }
export interface Prompt { id: number; input_text: string; category: string; risk_level: string; created_by: number | null; }
export interface TestRun { id: number; prompt_id: number; model_id: number; run_status: string; created_at: string | null; }
export interface Result { id: number; test_run_id: number; output_text: string | null; vulnerability_detected: boolean; notes: string | null; severity: string | null; }
export interface StatsOverview {
  total_scans: number;
  completed: number;
  pending: number;
  total_results: number;
  vulnerable: number;
  safe: number;
  detection_rate: number;
  by_category: { category: string; count: number }[];
  by_risk: { risk_level: string; count: number }[];
  by_severity: { severity: string; count: number }[];
  vuln_by_category: { category: string; count: number }[];
}

export const getUsers = () => api.get<User[]>('/users/').then(r => r.data);
export const getModels = () => api.get<Model[]>('/models/').then(r => r.data);
export const createModel = (data: Omit<Model, 'id'>) => api.post<Model>('/models/', data).then(r => r.data);
export const deleteModel = (id: number) => api.delete(`/models/${id}`);
export const getPrompts = () => api.get<Prompt[]>('/scans/prompts/').then(r => r.data);
export const createPrompt = (data: Omit<Prompt, 'id'>) => api.post<Prompt>('/scans/prompts/', data).then(r => r.data);
export const getScans = () => api.get<TestRun[]>('/scans/').then(r => r.data);
export const createScan = (data: { prompt_id: number; model_id: number }) => api.post<TestRun>('/scans/', data).then(r => r.data);
export const getScanResults = (scanId: number) => api.get<Result[]>(`/scans/${scanId}/results`).then(r => r.data);
export const createResult = (scanId: number, data: Omit<Result, 'id' | 'test_run_id'>) => api.post<Result>(`/scans/${scanId}/results`, data).then(r => r.data);
export const getStatsOverview = () => api.get<StatsOverview>('/scans/stats/overview').then(r => r.data);
export const getAllResults = () => api.get<Result[]>('/scans/results/all').then(r => r.data);
