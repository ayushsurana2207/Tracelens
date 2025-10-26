import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Types
export type Trace = {
  id: number; model: string; provider: string; latency_ms: number;
  tokens: number; cost_usd: number; status: "success" | "failure"; created_at: string;
  input_tokens?: number; output_tokens?: number; prompt_tokens?: number; completion_tokens?: number;
  error_message?: string; request_id?: string; user_id?: string; endpoint?: string;
  temperature?: number; max_tokens?: number; metadata?: any;
};

export type MetricsSummary = {
  total_requests: number; avg_latency_ms: number; total_tokens: number;
  total_cost_usd: number; success_rate_pct: number; failure_rate_pct: number;
  p95_latency_ms: number; p99_latency_ms: number; total_input_tokens: number;
  total_output_tokens: number; avg_tokens_per_request: number; cost_per_token: number;
  requests_per_minute: number; error_rate_pct: number;
};

export type Alert = {
  id: number; severity: string; title: string; description?: string; metric: number; threshold: number;
  acknowledged: boolean; acknowledged_at?: string; acknowledged_by?: string; created_at: string;
  alert_type: string; metric_name?: string; session_id?: number; span_id?: number; trace_id?: number;
  metadata?: any; resolved_at?: string;
};

export type AlertThreshold = {
  id: number; metric_name: string; threshold_value: number; severity: string;
  enabled: boolean; created_at: string; updated_at: string; description?: string;
};

export type AgentSession = { 
  id: number; started_at: string; ended_at?: string; user_id?: string | null; 
  title?: string | null; status: string; total_latency_ms: number; total_tokens: number;
  total_cost_usd: number; error_message?: string; metadata?: any;
};

export type AgentSpan = {
  id: number; session_id: number; parent_id?: number | null;
  span_type: "agent" | "tool" | "reasoning" | "llm_call"; name: string;
  status: "success" | "failure"; latency_ms: number; prompt?: string | null; output?: string | null; error?: string | null;
  created_at: string; started_at?: string; ended_at?: string; tokens_used: number; cost_usd: number;
  model_used?: string; provider_used?: string; tool_calls?: any; reasoning_steps?: any;
  metadata?: any; trace_id?: string;
};

export type TimeSeriesDataPoint = {
  timestamp: string; value: number; label?: string;
};

export type MetricsTimeSeries = {
  metric_name: string; data_points: TimeSeriesDataPoint[]; aggregation: string;
};

export type ModelSummary = {
  model: string; provider: string; total_requests: number; avg_latency_ms: number;
  total_tokens: number; total_cost_usd: number; success_count: number; failure_count: number;
  success_rate_pct: number;
};

export type SessionAnalysis = {
  session: any; metrics: any; root_causes: any[]; bottlenecks: any[];
  token_analysis: any; llm_traces: any[];
};

// API Functions
export const fetchSummary = async () => (await api.get<MetricsSummary>("/metrics/summary")).data;
export const fetchTraces = async (params?: any) => (await api.get<Trace[]>("/traces", { params })).data;
export const fetchAlerts = async (params?: any) => (await api.get<Alert[]>("/alerts", { params })).data;
export const ackAlert = async (id: number, acknowledged_by?: string) => (await api.post<Alert>(`/alerts/${id}/ack`, { acknowledged_by })).data;
export const resolveAlert = async (id: number) => (await api.post<Alert>(`/alerts/${id}/resolve`)).data;
export const fetchSessions = async (params?: any) => (await api.get<AgentSession[]>("/agents/sessions", { params })).data;
export const fetchSpans = async (sessionId: number) => (await api.get<AgentSpan[]>(`/agents/sessions/${sessionId}/spans`)).data;

// New API functions
export const fetchTimeSeries = async (metricName: string, hours: number = 24, aggregation: string = "avg") => 
  (await api.get<MetricsTimeSeries>(`/metrics/timeseries?metric_name=${metricName}&hours=${hours}&aggregation=${aggregation}`)).data;

export const fetchModelsSummary = async () => (await api.get<ModelSummary[]>("/metrics/models/summary")).data;

export const fetchSessionAnalysis = async (sessionId: number) => 
  (await api.get<SessionAnalysis>(`/agents/sessions/${sessionId}/analysis`)).data;

export const fetchSessionTrace = async (sessionId: number) => 
  (await api.get(`/agents/sessions/${sessionId}/trace`)).data;

export const fetchSessionSpansTree = async (sessionId: number) => 
  (await api.get(`/agents/sessions/${sessionId}/spans/tree`)).data;

export const fetchSessionsSummary = async (hours: number = 24) => 
  (await api.get(`/agents/sessions/summary?hours=${hours}`)).data;

export const fetchAlertsSummary = async () => (await api.get("/alerts/summary")).data;

export const fetchAlertThresholds = async () => (await api.get<AlertThreshold[]>("/alerts/thresholds")).data;
export const createAlertThreshold = async (threshold: Omit<AlertThreshold, "id" | "created_at" | "updated_at">) => 
  (await api.post<AlertThreshold>("/alerts/thresholds", threshold)).data;
export const updateAlertThreshold = async (id: number, threshold: Omit<AlertThreshold, "id" | "created_at" | "updated_at">) => 
  (await api.put<AlertThreshold>(`/alerts/thresholds/${id}`, threshold)).data;
export const deleteAlertThreshold = async (id: number) => (await api.delete(`/alerts/thresholds/${id}`)).data;

export const checkThresholds = async () => (await api.post("/alerts/check-thresholds")).data;

// WebSocket connections
export const createMetricsWebSocket = () => new WebSocket(`${BASE_URL.replace('http', 'ws')}/metrics/ws`);
export const createAlertsWebSocket = () => new WebSocket(`${BASE_URL.replace('http', 'ws')}/alerts/ws`);
