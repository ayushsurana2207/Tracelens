import { useState } from 'react';
import { Database, Zap } from 'lucide-react';

interface MockDataToggleProps {
  onToggle: (useMockData: boolean) => void;
  useMockData: boolean;
}

export default function MockDataToggle({ onToggle, useMockData }: MockDataToggleProps) {
  return (
    <button
      onClick={() => onToggle(!useMockData)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        useMockData 
          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20 hover:bg-blue-500/30' 
          : 'bg-gray-500/20 text-gray-300 border border-gray-500/20 hover:bg-gray-500/30'
      }`}
      title={useMockData ? 'Switch to Real API Data' : 'Switch to Mock Data'}
    >
      {useMockData ? (
        <>
          <Database className="w-4 h-4" />
          Mock Data
        </>
      ) : (
        <>
          <Zap className="w-4 h-4" />
          Live Data
        </>
      )}
    </button>
  );
}
