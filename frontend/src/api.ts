import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
const llmApi = axios.create({ baseURL: '/llm-service' });

export interface User { id: number; name: string; email: string; }
export interface Model { id: number; name: string; provider: string; model_type: string; access_method: string; credential_reference: string | null; access_url: string | null; browser_textbox: string | null; }
export interface Prompt { id: number; input_text: string; category: string; risk_level: string; created_by: number | null; acceptance_criteria: string | null; }
export interface TestRun { id: number; prompt_id_list: number[]; model_id: number; run_status: string; created_at: string | null; }
export interface Result { id: number; test_run_id: number; prompt_id: number | null; output_text: string | null; vulnerability_detected: boolean; notes: string | null; severity: string | null; confidence: number | null; acceptance_criteria: string | null; }
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

// --- LLM Job types ---
export interface LLMJobPrompt {
  input_text: string;
  category: string;
  risk_level: string;
  created_by: number;
  acceptance_criteria: string;
}
export interface LLMJobModel {
  name: string;
  provider: string;
  model_type: string;
  access_method: string;
  acceptance_criteria: string;
  credential_reference: string | null;
  access_url: string | null;
  browser_textbox: string | null;
  login_info: [];
}
export interface StartJobRequest { prompt_list: LLMJobPrompt[]; model: LLMJobModel; }
export interface StartJobResponse { job_id: string; }
export interface StreamEvent { vulnerability_detected?: boolean; response?: string; error?: string; }

// --- CRUD ---
export const getUsers = () => api.get<User[]>('/users/').then(r => r.data);
export const getModels = () => api.get<Model[]>('/models/').then(r => r.data);
export const createModel = (data: Omit<Model, 'id'>) => api.post<Model>('/models/', data).then(r => r.data);
export const deleteModel = (id: number) => api.delete(`/models/${id}`);
export const getPrompts = () => api.get<Prompt[]>('/scans/prompts/').then(r => r.data);
export const createPrompt = (data: Omit<Prompt, 'id'>) => api.post<Prompt>('/scans/prompts/', data).then(r => r.data);
export const getScans = () => api.get<TestRun[]>('/scans/').then(r => r.data);
export const createScan = (data: { prompt_id_list: number[]; model_id: number }) => api.post<TestRun>('/scans/', data).then(r => r.data);
export const getScanResults = (scanId: number) => api.get<Result[]>(`/scans/${scanId}/results`).then(r => r.data);
export const createResult = (scanId: number, data: Omit<Result, 'id' | 'test_run_id'>) => api.post<Result>(`/scans/${scanId}/results`, data).then(r => r.data);
export const getStatsOverview = () => api.get<StatsOverview>('/scans/stats/overview').then(r => r.data);
export const getAllResults = () => api.get<Result[]>('/scans/results/all').then(r => r.data);

// --- LLM Job ---
export const startJob = (data: StartJobRequest) =>
  llmApi.post<StartJobResponse>('/start-job', data).then(r => r.data);

export const streamJobResults = (
  jobId: string,
  onEvent: (e: StreamEvent) => void,
  onDone: () => void,
  onError?: () => void
): EventSource => {
  const es = new EventSource(`/llm-service/stream/${jobId}`);
  es.onmessage = (e) => {
    if (e.data === '[DONE]') { es.close(); onDone(); return; }
    try { onEvent(JSON.parse(e.data)); } catch { /* ignore */ }
  };
  es.onerror = () => { es.close(); onError?.(); };
  return es;
};
