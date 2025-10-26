import KPI from "../components/KPI";
import TracesTable from "../components/TracesTable";
import MockDataToggle from "../components/MockDataToggle";
import { useEffect, useState } from "react";
import { fetchSummary, fetchTraces, fetchTimeSeries, fetchModelsSummary, MetricsSummary, Trace, ModelSummary, createMetricsWebSocket } from "../lib/api";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { 
  mockMetricsSummary, 
  mockModelsSummary, 
  mockTimeSeriesData,
  mockTraces
} from "../lib/mockData";

export default function Dashboard() {
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [modelsSummary, setModelsSummary] = useState<ModelSummary[]>([]);
  const [latencyTimeSeries, setLatencyTimeSeries] = useState<any[]>([]);
  const [costTimeSeries, setCostTimeSeries] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [useMockData, setUseMockData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (useMockData) {
          // Use mock data
          setSummary(mockMetricsSummary);
          setTraces(mockTraces);
          setModelsSummary(mockModelsSummary);
          
          // Format mock time series data
          setLatencyTimeSeries(mockTimeSeriesData.latency_ms.map(dp => ({
            name: new Date(dp.timestamp).toLocaleTimeString(),
            latency: dp.value
          })));
          
          setCostTimeSeries(mockTimeSeriesData.cost_usd.map(dp => ({
            name: new Date(dp.timestamp).toLocaleTimeString(),
            cost: dp.value
          })));
        } else {
          // Use real API data
          const [summaryData, tracesData, modelsData, latencyData, costData] = await Promise.all([
            fetchSummary(),
            fetchTraces({ limit: 50 }),
            fetchModelsSummary(),
            fetchTimeSeries("latency_ms", 24, "avg"),
            fetchTimeSeries("cost_usd", 24, "sum")
          ]);
          
          setSummary(summaryData);
          setTraces(tracesData);
          setModelsSummary(modelsData);
          
          // Format time series data
          setLatencyTimeSeries(latencyData.data_points.map(dp => ({
            name: new Date(dp.timestamp).toLocaleTimeString(),
            latency: dp.value
          })));
          
          setCostTimeSeries(costData.data_points.map(dp => ({
            name: new Date(dp.timestamp).toLocaleTimeString(),
            cost: dp.value
          })));
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    };

    loadData();

    // Set up WebSocket connection for real-time updates
    const ws = createMetricsWebSocket();
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log("Connected to metrics WebSocket");
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "metrics_update") {
        setSummary(data.data);
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      console.log("Disconnected from metrics WebSocket");
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [useMockData]);

  // Prepare data for charts
  const modelData = modelsSummary.map(model => ({
    name: model.model,
    requests: model.total_requests,
    avgLatency: model.avg_latency_ms,
    cost: model.total_cost_usd,
    successRate: model.success_rate_pct
  }));

  const statusData = [
    { name: "Success", value: summary?.success_rate_pct || 0, color: "#10b981" },
    { name: "Failure", value: summary?.failure_rate_pct || 0, color: "#ef4444" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold tracking-tight">Dashboard</h2>
        <div className="flex items-center gap-4">
          <MockDataToggle onToggle={setUseMockData} useMockData={useMockData} />
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-slate-400">
              {isConnected ? 'Live Updates' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI title="Total LLM Traces" value={summary ? String(summary.total_requests) : "—"} sub="All time" />
        <KPI title="Avg Latency" value={summary ? `${Math.round(summary.avg_latency_ms)} ms` : "—"} sub={`P95: ${Math.round(summary?.p95_latency_ms || 0)}ms`} />
        <KPI title="Total Tokens" value={summary ? summary.total_tokens.toLocaleString() : "—"} sub={`Input: ${summary?.total_input_tokens.toLocaleString() || 0}`} />
        <KPI title="Success Rate" value={summary ? `${summary.success_rate_pct.toFixed(1)}%` : "—"} sub={`${summary?.requests_per_minute.toFixed(1) || 0} req/min`} />
      </div>

      {/* Additional KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPI title="Total Cost" value={summary ? `$${summary.total_cost_usd.toFixed(2)}` : "—"} sub={`$${(summary?.cost_per_token || 0).toFixed(6)}/token`} />
        <KPI title="P99 Latency" value={summary ? `${Math.round(summary.p99_latency_ms)} ms` : "—"} sub="99th percentile" />
        <KPI title="Avg Tokens/Request" value={summary ? `${summary.avg_tokens_per_request.toFixed(0)}` : "—"} sub="Token efficiency" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Over Time */}
        <div className="card lg:col-span-1">
          <div className="text-sm text-slate-300 mb-4">Latency Over Time (24h)</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Over Time */}
        <div className="card lg:col-span-1">
          <div className="text-sm text-slate-300 mb-4">Cost Over Time (24h)</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={costTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Model Performance and Status Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Performance */}
        <div className="card lg:col-span-2">
          <div className="text-sm text-slate-300 mb-4">Model Performance</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="avgLatency" fill="#3b82f6" name="Avg Latency (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Success/Failure Distribution */}
        <div className="card">
          <div className="text-sm text-slate-300 mb-4">Request Status</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="text-sm text-slate-300 mb-4">Recent Activity</div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {traces.slice(0, 8).map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div>
                    <div className="font-medium text-sm">{t.model}</div>
                    <div className="text-xs text-slate-400">{t.provider}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{t.latency_ms}ms</div>
                  <div className="text-xs text-slate-400">${t.cost_usd.toFixed(4)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-slate-300 mb-4">Model Summary</div>
          <div className="space-y-3">
            {modelsSummary.slice(0, 4).map(model => (
              <div key={`${model.model}-${model.provider}`} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                <div>
                  <div className="font-medium text-sm">{model.model}</div>
                  <div className="text-xs text-slate-400">{model.provider}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{model.total_requests} requests</div>
                  <div className="text-xs text-slate-400">{model.success_rate_pct.toFixed(1)}% success</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TracesTable data={traces.slice(0, 12)} />
    </div>
  );
}
