import React, { useRef, useEffect } from 'react';
import type { LogEntry } from '../types';

interface LogPanelProps {
    logs: LogEntry[];
    onClearLogs: () => void;
}

const LogPanel: React.FC<LogPanelProps> = ({ logs, onClearLogs }) => {
    const logContainerRef = useRef<HTMLDivElement>(null);

    const getLevelColor = (level: LogEntry['level']) => {
        switch (level) {
            case 'INFO': return 'text-gray-400';
            case 'AI': return 'text-cyan-400';
            case 'SUCCESS': return 'text-green-400';
            case 'ERROR': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="flex flex-col">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                <h2 className="text-xl font-bold text-white">System Log</h2>
                <button 
                    onClick={onClearLogs} 
                    disabled={logs.length === 0} 
                    className="text-sm text-red-400 hover:text-red-300 font-semibold disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    Clear Log
                </button>
            </div>
            <div ref={logContainerRef} className="p-4 space-y-2 text-sm font-mono bg-gray-900/50">
                {logs.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Log is empty. Perform an action to see output.</p>
                ) : (
                    logs.map(log => (
                        <div key={log.id} className="whitespace-pre-wrap leading-relaxed">
                            <span className="text-gray-500 select-none">{new Date(log.timestamp).toLocaleTimeString()} </span>
                            <span className={`${getLevelColor(log.level)} font-bold`}>[{log.level}] </span>
                            <span className="text-gray-300">{log.message}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LogPanel;