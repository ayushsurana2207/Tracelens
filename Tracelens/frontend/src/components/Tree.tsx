import { AgentSpan } from "../lib/api";
import { useState } from "react";

type Node = AgentSpan & { children: Node[] };

function buildTree(spans: AgentSpan[]): Node[] {
  const map = new Map<number, Node>();
  spans.forEach(s => map.set(s.id, { ...s, children: [] }));
  const roots: Node[] = [];
  spans.forEach(s => {
    const node = map.get(s.id)!;
    if (s.parent_id && map.has(s.parent_id)) {
      map.get(s.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function getSpanTypeIcon(type: string) {
  switch (type) {
    case "agent": return "🤖";
    case "tool": return "🔧";
    case "reasoning": return "🧠";
    case "llm_call": return "💬";
    default: return "📦";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "success": return "text-green-400";
    case "failure": return "text-red-400";
    case "running": return "text-blue-400";
    default: return "text-slate-400";
  }
}

function Row({ node, depth, isExpanded, onToggle }: { 
  node: Node; 
  depth: number; 
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const indentWidth = depth * 20;

  return (
    <div className="flex items-start gap-3 py-2">
      <div style={{ width: indentWidth }} />
      <div className="flex-1">
        <div className="card hover:bg-white/10 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {hasChildren && (
                <button 
                  onClick={onToggle}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {isExpanded ? "▼" : "▶"}
                </button>
              )}
              {!hasChildren && <div className="w-4" />}
              
              <span className="text-lg">{getSpanTypeIcon(node.span_type)}</span>
              
              <div className="flex items-center gap-2">
                <span className="badge bg-blue-500/20 text-blue-300 border-blue-500/20">
                  {node.span_type}
                </span>
                <span className="font-medium">{node.name}</span>
                <span className={`badge ${node.status === "success" ? "status-success" : "status-failure"}`}>
                  {node.status}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-slate-400">
              {node.latency_ms > 0 && (
                <span className={getStatusColor(node.status)}>
                  {node.latency_ms}ms
                </span>
              )}
              {node.tokens_used > 0 && (
                <span>{node.tokens_used} tokens</span>
              )}
              {node.cost_usd > 0 && (
                <span>${node.cost_usd.toFixed(4)}</span>
              )}
              {node.model_used && (
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                  {node.model_used}
                </span>
              )}
            </div>
          </div>
          
          {/* Additional Details */}
          <div className="mt-3 space-y-2">
            {node.prompt && (
              <div className="text-xs text-slate-400">
                <span className="font-medium">Prompt:</span> 
                <div className="mt-1 p-2 bg-slate-800/50 rounded text-slate-300 max-h-20 overflow-y-auto">
                  {node.prompt.length > 200 ? `${node.prompt.substring(0, 200)}...` : node.prompt}
                </div>
              </div>
            )}
            
            {node.output && (
              <div className="text-xs text-slate-400">
                <span className="font-medium">Output:</span>
                <div className="mt-1 p-2 bg-slate-800/50 rounded text-slate-300 max-h-20 overflow-y-auto">
                  {node.output.length > 200 ? `${node.output.substring(0, 200)}...` : node.output}
                </div>
              </div>
            )}
            
            {node.error && (
              <div className="text-xs text-red-400">
                <span className="font-medium">Error:</span>
                <div className="mt-1 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-300">
                  {node.error}
                </div>
              </div>
            )}
            
            {node.tool_calls && (
              <div className="text-xs text-slate-400">
                <span className="font-medium">Tool Calls:</span>
                <div className="mt-1 p-2 bg-slate-800/50 rounded text-slate-300">
                  <pre className="text-xs">{JSON.stringify(node.tool_calls, null, 2)}</pre>
                </div>
              </div>
            )}
            
            {node.reasoning_steps && (
              <div className="text-xs text-slate-400">
                <span className="font-medium">Reasoning Steps:</span>
                <div className="mt-1 p-2 bg-slate-800/50 rounded text-slate-300">
                  <pre className="text-xs">{JSON.stringify(node.reasoning_steps, null, 2)}</pre>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>Started: {new Date(node.created_at).toLocaleTimeString()}</span>
              {node.started_at && (
                <span>Duration: {node.ended_at ? 
                  `${Math.round((new Date(node.ended_at).getTime() - new Date(node.started_at).getTime()) / 1000)}s` : 
                  'Running'
                }</span>
              )}
              {node.trace_id && (
                <span>Trace: {node.trace_id}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TreeNode({ node, depth, expandedNodes, onToggle }: { 
  node: Node; 
  depth: number;
  expandedNodes: Set<number>;
  onToggle: (id: number) => void;
}) {
  const isExpanded = expandedNodes.has(node.id);
  
  return (
    <>
      <Row 
        node={node} 
        depth={depth} 
        isExpanded={isExpanded}
        onToggle={() => onToggle(node.id)}
      />
      {isExpanded && node.children.map(child => (
        <TreeNode 
          key={child.id} 
          node={child} 
          depth={depth + 1}
          expandedNodes={expandedNodes}
          onToggle={onToggle}
        />
      ))}
    </>
  );
}

export default function Tree({ spans }: { spans: AgentSpan[] }) {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  
  const roots = buildTree(spans);
  
  const toggleNode = (id: number) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (roots.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No spans available for this session
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {roots.map(root => (
        <TreeNode 
          key={root.id} 
          node={root} 
          depth={0}
          expandedNodes={expandedNodes}
          onToggle={toggleNode}
        />
      ))}
    </div>
  );
}
