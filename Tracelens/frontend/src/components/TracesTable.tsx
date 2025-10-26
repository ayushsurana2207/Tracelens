import { Trace } from "../lib/api";
import { useState } from "react";

export default function TracesTable({ data }: { data: Trace[] }) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "text-green-400";
      case "failure": return "text-red-400";
      default: return "text-slate-400";
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "openai": return "text-green-400";
      case "anthropic": return "text-blue-400";
      case "google": return "text-yellow-400";
      default: return "text-slate-400";
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="text-sm text-slate-300 mb-4">Recent Traces</div>
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Model</th>
              <th>Provider</th>
              <th>Latency</th>
              <th>Tokens</th>
              <th>Cost</th>
              <th>Status</th>
              <th>Time</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((trace) => {
              const isExpanded = expandedRows.has(trace.id);
              return (
                <>
                  <tr key={trace.id} className="hover:bg-white/5 transition-colors">
                    <td className="font-medium">{trace.model}</td>
                    <td className={getProviderColor(trace.provider)}>{trace.provider}</td>
                    <td className={getStatusColor(trace.status)}>{trace.latency_ms} ms</td>
                    <td>{trace.tokens.toLocaleString()}</td>
                    <td>${trace.cost_usd.toFixed(4)}</td>
                    <td>
                      <span className={`badge ${trace.status === "success" ? "status-success" : "status-failure"}`}>
                        {trace.status}
                      </span>
                    </td>
                    <td className="text-slate-400 text-sm">
                      {new Date(trace.created_at).toLocaleTimeString()}
                    </td>
                    <td>
                      <button 
                        onClick={() => toggleRow(trace.id)}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {isExpanded ? "▼" : "▶"}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Row Details */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={8} className="p-0">
                        <div className="bg-slate-800/30 border-t border-white/5">
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {trace.input_tokens && (
                                <div>
                                  <div className="text-slate-400">Input Tokens</div>
                                  <div className="font-medium">{trace.input_tokens.toLocaleString()}</div>
                                </div>
                              )}
                              {trace.output_tokens && (
                                <div>
                                  <div className="text-slate-400">Output Tokens</div>
                                  <div className="font-medium">{trace.output_tokens.toLocaleString()}</div>
                                </div>
                              )}
                              {trace.prompt_tokens && (
                                <div>
                                  <div className="text-slate-400">Prompt Tokens</div>
                                  <div className="font-medium">{trace.prompt_tokens.toLocaleString()}</div>
                                </div>
                              )}
                              {trace.completion_tokens && (
                                <div>
                                  <div className="text-slate-400">Completion Tokens</div>
                                  <div className="font-medium">{trace.completion_tokens.toLocaleString()}</div>
                                </div>
                              )}
                              {trace.temperature && (
                                <div>
                                  <div className="text-slate-400">Temperature</div>
                                  <div className="font-medium">{trace.temperature}</div>
                                </div>
                              )}
                              {trace.max_tokens && (
                                <div>
                                  <div className="text-slate-400">Max Tokens</div>
                                  <div className="font-medium">{trace.max_tokens}</div>
                                </div>
                              )}
                              {trace.user_id && (
                                <div>
                                  <div className="text-slate-400">User ID</div>
                                  <div className="font-medium">{trace.user_id}</div>
                                </div>
                              )}
                              {trace.request_id && (
                                <div>
                                  <div className="text-slate-400">Request ID</div>
                                  <div className="font-medium text-xs">{trace.request_id}</div>
                                </div>
                              )}
                            </div>
                            
                            {trace.error_message && (
                              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                                <div className="text-red-400 font-medium text-sm">Error Message</div>
                                <div className="text-red-300 text-sm mt-1">{trace.error_message}</div>
                              </div>
                            )}
                            
                            {trace.endpoint && (
                              <div className="text-sm">
                                <div className="text-slate-400">Endpoint</div>
                                <div className="font-medium">{trace.endpoint}</div>
                              </div>
                            )}
                            
                            {trace.metadata && (
                              <div className="text-sm">
                                <div className="text-slate-400">Metadata</div>
                                <div className="mt-1 p-2 bg-slate-800/50 rounded">
                                  <pre className="text-xs text-slate-300">{JSON.stringify(trace.metadata, null, 2)}</pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
