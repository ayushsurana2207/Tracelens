import { useEffect, useState } from "react";
import { fetchSessions, fetchSessionAnalysis, fetchSessionSpansTree, fetchSessionsSummary, AgentSession, SessionAnalysis, createAlertsWebSocket } from "../lib/api";
import Tree from "../components/Tree";
import MockDataToggle from "../components/MockDataToggle";
import { 
  mockAgentSessions, 
  mockSessionAnalysis, 
  mockAgentSpans,
  mockSessionsSummary
} from "../lib/mockData";

export default function AgentWorkflow() {
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [activeSession, setActiveSession] = useState<AgentSession | null>(null);
  const [sessionAnalysis, setSessionAnalysis] = useState<SessionAnalysis | null>(null);
  const [spansTree, setSpansTree] = useState<any[]>([]);
  const [sessionsSummary, setSessionsSummary] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [useMockData, setUseMockData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (useMockData) {
          // Use mock data
          setSessions(mockAgentSessions);
          setSessionsSummary(mockSessionsSummary);
          
          if (mockAgentSessions.length > 0) {
            setActiveSession(mockAgentSessions[0]);
          }
        } else {
          // Use real API data
          const [sessionsData, summaryData] = await Promise.all([
            fetchSessions({ limit: 50 }),
            fetchSessionsSummary(24)
          ]);
          
          setSessions(sessionsData);
          setSessionsSummary(summaryData);
          
          if (sessionsData.length > 0) {
            setActiveSession(sessionsData[0]);
          }
        }
      } catch (error) {
        console.error("Failed to load agent workflow data:", error);
      }
    };

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
        // Handle new alert notification
        console.log("New alert:", data.data);
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

  useEffect(() => {
    if (activeSession) {
      const loadSessionData = async () => {
        try {
          if (useMockData) {
            // Use mock data
            setSessionAnalysis(mockSessionAnalysis);
            setSpansTree(mockAgentSpans);
          } else {
            // Use real API data
            const [analysisData, treeData] = await Promise.all([
              fetchSessionAnalysis(activeSession.id),
              fetchSessionSpansTree(activeSession.id)
            ]);
            
            setSessionAnalysis(analysisData);
            setSpansTree(treeData);
          }
        } catch (error) {
          console.error("Failed to load session data:", error);
        }
      };

      loadSessionData();
    }
  }, [activeSession?.id, useMockData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-300 border-green-500/20";
      case "failed": return "bg-red-500/20 text-red-300 border-red-500/20";
      case "running": return "bg-blue-500/20 text-blue-300 border-blue-500/20";
      default: return "bg-gray-500/20 text-gray-300 border-gray-500/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold tracking-tight">Agent Workflow Tracking</h2>
        <div className="flex items-center gap-4">
          <MockDataToggle onToggle={setUseMockData} useMockData={useMockData} />
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-slate-400">
              {isConnected ? 'Live Alerts' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Sessions Summary */}
      {sessionsSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="text-sm text-slate-400">Total Sessions</div>
            <div className="text-2xl font-semibold">{sessionsSummary.total_sessions}</div>
          </div>
          <div className="card">
            <div className="text-sm text-slate-400">Success Rate</div>
            <div className="text-2xl font-semibold">{sessionsSummary.success_rate.toFixed(1)}%</div>
          </div>
          <div className="card">
            <div className="text-sm text-slate-400">Avg Latency</div>
            <div className="text-2xl font-semibold">{Math.round(sessionsSummary.avg_latency_ms)}ms</div>
          </div>
          <div className="card">
            <div className="text-sm text-slate-400">Total Cost</div>
            <div className="text-2xl font-semibold">${sessionsSummary.total_cost_usd.toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
        {/* Sessions List */}
        <div className="card">
          <div className="text-sm text-slate-300 mb-4">Agent Sessions</div>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {sessions.map(session => (
              <button 
                key={session.id} 
                onClick={() => setActiveSession(session)} 
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  activeSession?.id === session.id 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm">
                    {session.title || `Session ${session.id}`}
                  </div>
                  <span className={`badge ${getStatusColor(session.status)}`}>
                    {session.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mb-2">
                  {new Date(session.started_at).toLocaleString()}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{Math.round(session.total_latency_ms)}ms</span>
                  <span>${session.total_cost_usd.toFixed(4)}</span>
                  <span>{session.total_tokens} tokens</span>
                </div>
                {session.error_message && (
                  <div className="text-xs text-red-400 mt-2 truncate">
                    Error: {session.error_message}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Session Details */}
        <div className="space-y-6">
          {activeSession ? (
            <>
              {/* Session Overview */}
              <div className="card">
                <div className="text-sm text-slate-300 mb-4">Session Overview</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-slate-400">Session ID</div>
                    <div className="font-medium">{activeSession.id}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Status</div>
                    <span className={`badge ${getStatusColor(activeSession.status)}`}>
                      {activeSession.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Duration</div>
                    <div className="font-medium">
                      {activeSession.ended_at 
                        ? `${Math.round((new Date(activeSession.ended_at).getTime() - new Date(activeSession.started_at).getTime()) / 1000)}s`
                        : 'Running'
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">User</div>
                    <div className="font-medium">{activeSession.user_id || 'Anonymous'}</div>
                  </div>
                </div>
              </div>

              {/* Session Analysis */}
              {sessionAnalysis && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Root Cause Analysis */}
                  {sessionAnalysis.root_causes.length > 0 && (
                    <div className="card">
                      <div className="text-sm text-slate-300 mb-4">Root Cause Analysis</div>
                      <div className="space-y-3">
                        {sessionAnalysis.root_causes.map((cause, index) => (
                          <div key={index} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <div className="font-medium text-red-300">{cause.span_name}</div>
                            <div className="text-xs text-red-400 mt-1">{cause.error}</div>
                            <div className="text-xs text-slate-400 mt-1">
                              {cause.span_type} • {cause.latency_ms}ms
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Performance Bottlenecks */}
                  {sessionAnalysis.bottlenecks.length > 0 && (
                    <div className="card">
                      <div className="text-sm text-slate-300 mb-4">Performance Bottlenecks</div>
                      <div className="space-y-3">
                        {sessionAnalysis.bottlenecks.map((bottleneck, index) => (
                          <div key={index} className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                            <div className="font-medium text-yellow-300">{bottleneck.span_name}</div>
                            <div className="text-xs text-yellow-400 mt-1">
                              {bottleneck.latency_ms}ms ({bottleneck.latency_ratio.toFixed(1)}x avg)
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              {bottleneck.span_type}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Token Analysis */}
                  <div className="card">
                    <div className="text-sm text-slate-300 mb-4">Token Analysis</div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Tokens</span>
                        <span className="font-medium">{sessionAnalysis.token_analysis.total_tokens.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Cost</span>
                        <span className="font-medium">${sessionAnalysis.token_analysis.total_cost.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cost per Token</span>
                        <span className="font-medium">${sessionAnalysis.token_analysis.cost_per_token.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">LLM Calls</span>
                        <span className="font-medium">{sessionAnalysis.token_analysis.llm_calls}</span>
                      </div>
                    </div>
                  </div>

                  {/* Session Metrics */}
                  <div className="card">
                    <div className="text-sm text-slate-300 mb-4">Session Metrics</div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Spans</span>
                        <span className="font-medium">{sessionAnalysis.metrics.total_spans}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Success Rate</span>
                        <span className="font-medium">{sessionAnalysis.metrics.success_rate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Failed Spans</span>
                        <span className="font-medium text-red-400">{sessionAnalysis.metrics.failed_spans}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Latency</span>
                        <span className="font-medium">{Math.round(sessionAnalysis.metrics.avg_latency_ms)}ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Execution Trace */}
              <div className="card">
                <div className="text-sm text-slate-300 mb-4">Execution Trace</div>
                <div className="max-h-96 overflow-y-auto">
                  {spansTree.length > 0 ? (
                    <Tree spans={spansTree} />
                  ) : (
                    <div className="text-slate-400 text-center py-8">No spans available</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card">
              <div className="text-center py-12">
                <div className="text-slate-400">Select a session to view details</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
