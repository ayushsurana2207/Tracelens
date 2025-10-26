import { useEffect, useState } from "react";
import { fetchTraces, fetchModelsSummary, fetchTimeSeries, Trace, ModelSummary } from "../lib/api";
import TracesTable from "../components/TracesTable";
import MockDataToggle from "../components/MockDataToggle";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { 
  mockTraces, 
  mockModelsSummary, 
  mockTimeSeriesData 
} from "../lib/mockData";

export default function LLMTracking() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [modelsSummary, setModelsSummary] = useState<ModelSummary[]>([]);
  const [latencyTimeSeries, setLatencyTimeSeries] = useState<any[]>([]);
  const [tokenTimeSeries, setTokenTimeSeries] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<number>(24);
  const [useMockData, setUseMockData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (useMockData) {
          // Use mock data
          setTraces(mockTraces);
          setModelsSummary(mockModelsSummary);
          
          // Format mock time series data
          setLatencyTimeSeries(mockTimeSeriesData.latency_ms.map(dp => ({
            name: new Date(dp.timestamp).toLocaleTimeString(),
            latency: dp.value
          })));
          
          setTokenTimeSeries(mockTimeSeriesData.tokens.map(dp => ({
            name: new Date(dp.timestamp).toLocaleTimeString(),
            tokens: dp.value
          })));
        } else {
          // Use real API data
          const [tracesData, modelsData, latencyData, tokenData] = await Promise.all([
            fetchTraces({ limit: 100 }),
            fetchModelsSummary(),
            fetchTimeSeries("latency_ms", timeRange, "avg"),
            fetchTimeSeries("tokens", timeRange, "sum")
          ]);
          
          setTraces(tracesData);
          setModelsSummary(modelsData);
          
          // Format time series data
          setLatencyTimeSeries(latencyData.data_points.map(dp => ({
            name: new Date(dp.timestamp).toLocaleTimeString(),
            latency: dp.value
          })));
          
          setTokenTimeSeries(tokenData.data_points.map(dp => ({
            name: new Date(dp.timestamp).toLocaleTimeString(),
            tokens: dp.value
          })));
        }
      } catch (error) {
        console.error("Failed to load LLM tracking data:", error);
      }
    };

    loadData();
  }, [timeRange, useMockData]);

  // Filter traces based on selected filters
  const filteredTraces = traces.filter(trace => {
    const modelMatch = selectedModel === "all" || trace.model === selectedModel;
    const providerMatch = selectedProvider === "all" || trace.provider === selectedProvider;
    return modelMatch && providerMatch;
  });

  // Prepare data for charts
  const byModel = modelsSummary.map(model => ({
    name: model.model,
    requests: model.total_requests,
    avgLatency: model.avg_latency_ms,
    totalTokens: model.total_tokens,
    totalCost: model.total_cost_usd,
    successRate: model.success_rate_pct,
    provider: model.provider
  }));

  const byProvider = modelsSummary.reduce((acc: any, model) => {
    const key = model.provider;
    if (!acc[key]) {
      acc[key] = {
        name: key,
        requests: 0,
        totalCost: 0,
        totalTokens: 0,
        avgLatency: 0,
        successRate: 0,
        count: 0
      };
    }
    acc[key].requests += model.total_requests;
    acc[key].totalCost += model.total_cost_usd;
    acc[key].totalTokens += model.total_tokens;
    acc[key].avgLatency += model.avg_latency_ms;
    acc[key].successRate += model.success_rate_pct;
    acc[key].count += 1;
    return acc;
  }, {});

  const providerData = Object.values(byProvider).map((provider: any) => ({
    ...provider,
    avgLatency: provider.avgLatency / provider.count,
    successRate: provider.successRate / provider.count
  }));

  // Cost distribution by model
  const costData = modelsSummary.map(model => ({
    name: model.model,
    value: model.total_cost_usd,
    color: model.provider === 'openai' ? '#10b981' : model.provider === 'anthropic' ? '#3b82f6' : '#f59e0b'
  }));

  // Get unique models and providers for filters
  const uniqueModels = Array.from(new Set(traces.map(t => t.model)));
  const uniqueProviders = Array.from(new Set(traces.map(t => t.provider)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold tracking-tight">LLM Tracking</h2>
        
        {/* Filters */}
        <div className="flex items-center gap-4">
          <MockDataToggle onToggle={setUseMockData} useMockData={useMockData} />
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
          >
            <option value={1}>Last Hour</option>
            <option value={24}>Last 24 Hours</option>
            <option value={168}>Last Week</option>
          </select>
          
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
          >
            <option value="all">All Models</option>
            {uniqueModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
          
          <select 
            value={selectedProvider} 
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
          >
            <option value="all">All Providers</option>
            {uniqueProviders.map(provider => (
              <option key={provider} value={provider}>{provider}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-slate-400">Total Requests</div>
          <div className="text-2xl font-semibold">{filteredTraces.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-400">Avg Latency</div>
          <div className="text-2xl font-semibold">
            {filteredTraces.length > 0 ? Math.round(filteredTraces.reduce((sum, t) => sum + t.latency_ms, 0) / filteredTraces.length) : 0}ms
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-400">Total Tokens</div>
          <div className="text-2xl font-semibold">
            {filteredTraces.reduce((sum, t) => sum + t.tokens, 0).toLocaleString()}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-400">Total Cost</div>
          <div className="text-2xl font-semibold">
            ${filteredTraces.reduce((sum, t) => sum + t.cost_usd, 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Time Series Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="text-sm text-slate-300 mb-4">Latency Over Time</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyTimeSeries}>
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
                <Area 
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#3b82f6" 
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-slate-300 mb-4">Token Usage Over Time</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tokenTimeSeries}>
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
                <Area 
                  type="monotone" 
                  dataKey="tokens" 
                  stroke="#10b981" 
                  fill="#10b981"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Model and Provider Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Performance */}
        <div className="card lg:col-span-2">
          <div className="text-sm text-slate-300 mb-4">Model Performance Comparison</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byModel}>
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

        {/* Cost Distribution */}
        <div className="card">
          <div className="text-sm text-slate-300 mb-4">Cost Distribution</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {costData.map((entry, index) => (
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

      {/* Provider Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="text-sm text-slate-300 mb-4">Provider Performance</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={providerData}>
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
                <Bar dataKey="requests" fill="#8b5cf6" name="Total Requests" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-slate-300 mb-4">Provider Cost Analysis</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={providerData}>
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
                <Bar dataKey="totalCost" fill="#f59e0b" name="Total Cost ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Model Summary Table */}
      <div className="card">
        <div className="text-sm text-slate-300 mb-4">Model Summary</div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Model</th>
                <th>Provider</th>
                <th>Requests</th>
                <th>Avg Latency</th>
                <th>Total Tokens</th>
                <th>Total Cost</th>
                <th>Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {modelsSummary.map(model => (
                <tr key={`${model.model}-${model.provider}`}>
                  <td className="font-medium">{model.model}</td>
                  <td className="text-slate-400">{model.provider}</td>
                  <td>{model.total_requests}</td>
                  <td>{Math.round(model.avg_latency_ms)}ms</td>
                  <td>{model.total_tokens.toLocaleString()}</td>
                  <td>${model.total_cost_usd.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${model.success_rate_pct >= 95 ? 'status-success' : model.success_rate_pct >= 90 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20' : 'status-failure'}`}>
                      {model.success_rate_pct.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TracesTable data={filteredTraces.slice(0, 20)} />
    </div>
  );
}
