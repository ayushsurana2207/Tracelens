import { useEffect, useState } from "react";
import { fetchAlerts, fetchAlertsSummary, fetchAlertThresholds, ackAlert, resolveAlert, createAlertThreshold, updateAlertThreshold, deleteAlertThreshold, checkThresholds, Alert, AlertThreshold, createAlertsWebSocket } from "../lib/api";
import MockDataToggle from "../components/MockDataToggle";
import { 
  mockAlerts, 
  mockAlertsSummary, 
  mockAlertThresholds 
} from "../lib/mockData";

function SevPill({ sev }: { sev: string }) {
  const severityMap: Record<string, string> = {
    LOW: "bg-sky-500/20 text-sky-300 border-sky-500/20",
    MEDIUM: "bg-amber-500/20 text-amber-300 border-amber-500/20",
    HIGH: "bg-orange-500/20 text-orange-300 border-orange-500/20",
    CRITICAL: "bg-rose-600/20 text-rose-300 border-rose-600/20",
  };
  const cls = severityMap[sev] ?? "badge";
  return <span className={`badge ${cls}`}>{sev}</span>;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsSummary, setAlertsSummary] = useState<any>(null);
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<AlertThreshold | null>(null);
  const [newThreshold, setNewThreshold] = useState({
    metric_name: "",
    threshold_value: 0,
    severity: "MEDIUM",
    enabled: true,
    description: ""
  });
  const [useMockData, setUseMockData] = useState(true);

  const loadData = async () => {
    try {
      if (useMockData) {
        // Use mock data
        setAlerts(mockAlerts);
        setAlertsSummary(mockAlertsSummary);
        setThresholds(mockAlertThresholds);
      } else {
        // Use real API data
        const [alertsData, summaryData, thresholdsData] = await Promise.all([
          fetchAlerts({ limit: 100 }),
          fetchAlertsSummary(),
          fetchAlertThresholds()
        ]);
        
        setAlerts(alertsData);
        setAlertsSummary(summaryData);
        setThresholds(thresholdsData);
      }
    } catch (error) {
      console.error("Failed to load alerts data:", error);
    }
  };

  useEffect(() => {
    loadData();

    // Set up WebSocket connection for real-time alerts
    const ws = createAlertsWebSocket();
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log("Connected to alerts WebSocket");
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_alert") {
        // Add new alert to the list
        setAlerts(prev => [data.data, ...prev]);
        // Update summary
        loadData();
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      console.log("Disconnected from alerts WebSocket");
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [useMockData]);

  const handleAckAlert = async (id: number) => {
    try {
      await ackAlert(id, "user@example.com");
      loadData();
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  const handleResolveAlert = async (id: number) => {
    try {
      await resolveAlert(id);
      loadData();
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    }
  };

  const handleCreateThreshold = async () => {
    try {
      await createAlertThreshold(newThreshold);
      setShowThresholdModal(false);
      setNewThreshold({
        metric_name: "",
        threshold_value: 0,
        severity: "MEDIUM",
        enabled: true,
        description: ""
      });
      loadData();
    } catch (error) {
      console.error("Failed to create threshold:", error);
    }
  };

  const handleUpdateThreshold = async () => {
    if (!editingThreshold) return;
    
    try {
      await updateAlertThreshold(editingThreshold.id, {
        metric_name: editingThreshold.metric_name,
        threshold_value: editingThreshold.threshold_value,
        severity: editingThreshold.severity,
        enabled: editingThreshold.enabled,
        description: editingThreshold.description
      });
      setEditingThreshold(null);
      loadData();
    } catch (error) {
      console.error("Failed to update threshold:", error);
    }
  };

  const handleDeleteThreshold = async (id: number) => {
    try {
      await deleteAlertThreshold(id);
      loadData();
    } catch (error) {
      console.error("Failed to delete threshold:", error);
    }
  };

  const handleCheckThresholds = async () => {
    try {
      await checkThresholds();
      loadData();
    } catch (error) {
      console.error("Failed to check thresholds:", error);
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case "latency": return "text-blue-400";
      case "error_rate": return "text-red-400";
      case "cost": return "text-green-400";
      case "token_usage": return "text-purple-400";
      default: return "text-slate-400";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold tracking-tight">Alerts & Monitoring</h2>
        <div className="flex items-center gap-4">
          <MockDataToggle onToggle={setUseMockData} useMockData={useMockData} />
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-slate-400">
              {isConnected ? 'Live Alerts' : 'Disconnected'}
            </span>
          </div>
          <button 
            onClick={() => setShowThresholdModal(true)}
            className="btn"
          >
            Add Threshold
          </button>
          <button 
            onClick={handleCheckThresholds}
            className="btn bg-purple-600 hover:bg-purple-500"
          >
            Check Thresholds
          </button>
        </div>
      </div>

      {/* Alerts Summary */}
      {alertsSummary && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="text-sm text-slate-400">Critical</div>
            <div className="text-3xl font-semibold text-red-400">
              {alertsSummary.by_severity.find((s: any) => s.severity === 'CRITICAL')?.total || 0}
            </div>
            <div className="text-xs text-slate-400">
              {alertsSummary.by_severity.find((s: any) => s.severity === 'CRITICAL')?.unacknowledged || 0} unacknowledged
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-slate-400">High</div>
            <div className="text-3xl font-semibold text-orange-400">
              {alertsSummary.by_severity.find((s: any) => s.severity === 'HIGH')?.total || 0}
            </div>
            <div className="text-xs text-slate-400">
              {alertsSummary.by_severity.find((s: any) => s.severity === 'HIGH')?.unacknowledged || 0} unacknowledged
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-slate-400">Medium</div>
            <div className="text-3xl font-semibold text-amber-400">
              {alertsSummary.by_severity.find((s: any) => s.severity === 'MEDIUM')?.total || 0}
            </div>
            <div className="text-xs text-slate-400">
              {alertsSummary.by_severity.find((s: any) => s.severity === 'MEDIUM')?.unacknowledged || 0} unacknowledged
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-slate-400">Low</div>
            <div className="text-3xl font-semibold text-sky-400">
              {alertsSummary.by_severity.find((s: any) => s.severity === 'LOW')?.total || 0}
            </div>
            <div className="text-xs text-slate-400">
              {alertsSummary.by_severity.find((s: any) => s.severity === 'LOW')?.unacknowledged || 0} unacknowledged
            </div>
          </div>
        </div>
      )}

      {/* Alert Thresholds */}
      <div className="card">
        <div className="text-sm text-slate-300 mb-4">Alert Thresholds</div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Threshold</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {thresholds.map(threshold => (
                <tr key={threshold.id}>
                  <td className="font-medium">{threshold.metric_name}</td>
                  <td>{threshold.threshold_value}</td>
                  <td>
                    <SevPill sev={threshold.severity} />
                  </td>
                  <td>
                    <span className={`badge ${threshold.enabled ? 'status-success' : 'bg-gray-500/20 text-gray-300 border-gray-500/20'}`}>
                      {threshold.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="text-slate-400">{threshold.description || '—'}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setEditingThreshold(threshold)}
                        className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-500"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteThreshold(threshold.id)}
                        className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.map(alert => (
          <div key={alert.id} className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SevPill sev={alert.severity} />
                <div>
                  <div className="font-medium">{alert.title}</div>
                  {alert.description && (
                    <div className="text-sm text-slate-400 mt-1">{alert.description}</div>
                  )}
                  <div className="text-xs text-slate-400 mt-1">
                    <span className={getAlertTypeColor(alert.alert_type)}>{alert.alert_type}</span>
                    {alert.metric_name && ` • ${alert.metric_name}`}
                    {alert.metric && ` • Current: ${alert.metric.toFixed(2)}`}
                    {alert.threshold && ` • Threshold: ${alert.threshold.toFixed(2)}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-slate-400">
                    {new Date(alert.created_at).toLocaleString()}
                  </div>
                  {alert.acknowledged && (
                    <div className="text-xs text-green-400">
                      Acknowledged by {alert.acknowledged_by || 'Unknown'}
                    </div>
                  )}
                  {alert.resolved_at && (
                    <div className="text-xs text-blue-400">
                      Resolved {new Date(alert.resolved_at).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!alert.acknowledged && (
                    <button 
                      onClick={() => handleAckAlert(alert.id)}
                      className="btn bg-blue-600 hover:bg-blue-500"
                    >
                      Acknowledge
                    </button>
                  )}
                  {!alert.resolved_at && (
                    <button 
                      onClick={() => handleResolveAlert(alert.id)}
                      className="btn bg-green-600 hover:bg-green-500"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Threshold Modal */}
      {showThresholdModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <div className="text-lg font-semibold mb-4">Add Alert Threshold</div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Metric Name</label>
                <select 
                  value={newThreshold.metric_name}
                  onChange={(e) => setNewThreshold({...newThreshold, metric_name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                >
                  <option value="">Select metric...</option>
                  <option value="avg_latency_ms">Average Latency (ms)</option>
                  <option value="error_rate_pct">Error Rate (%)</option>
                  <option value="total_cost_usd">Total Cost ($)</option>
                  <option value="requests_per_minute">Requests per Minute</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Threshold Value</label>
                <input 
                  type="number"
                  value={newThreshold.threshold_value}
                  onChange={(e) => setNewThreshold({...newThreshold, threshold_value: Number(e.target.value)})}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Severity</label>
                <select 
                  value={newThreshold.severity}
                  onChange={(e) => setNewThreshold({...newThreshold, severity: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Description</label>
                <input 
                  type="text"
                  value={newThreshold.description}
                  onChange={(e) => setNewThreshold({...newThreshold, description: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                  placeholder="Optional description..."
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button 
                onClick={handleCreateThreshold}
                className="btn flex-1"
              >
                Create Threshold
              </button>
              <button 
                onClick={() => setShowThresholdModal(false)}
                className="btn bg-gray-600 hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Threshold Modal */}
      {editingThreshold && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <div className="text-lg font-semibold mb-4">Edit Alert Threshold</div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Metric Name</label>
                <input 
                  type="text"
                  value={editingThreshold.metric_name}
                  onChange={(e) => setEditingThreshold({...editingThreshold, metric_name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Threshold Value</label>
                <input 
                  type="number"
                  value={editingThreshold.threshold_value}
                  onChange={(e) => setEditingThreshold({...editingThreshold, threshold_value: Number(e.target.value)})}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Severity</label>
                <select 
                  value={editingThreshold.severity}
                  onChange={(e) => setEditingThreshold({...editingThreshold, severity: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Description</label>
                <input 
                  type="text"
                  value={editingThreshold.description || ''}
                  onChange={(e) => setEditingThreshold({...editingThreshold, description: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  checked={editingThreshold.enabled}
                  onChange={(e) => setEditingThreshold({...editingThreshold, enabled: e.target.checked})}
                  className="rounded"
                />
                <label className="text-sm text-slate-300">Enabled</label>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button 
                onClick={handleUpdateThreshold}
                className="btn flex-1"
              >
                Update Threshold
              </button>
              <button 
                onClick={() => setEditingThreshold(null)}
                className="btn bg-gray-600 hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
      </div>
      )}
    </div>
  );
}
