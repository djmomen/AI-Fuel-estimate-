
import React, { useMemo } from 'react';
import type { Round } from '../types';
import { LightbulbIcon } from './icons/LightbulbIcon';

interface DashboardPanelProps {
    rounds: Round[];
    onGetAiInsights: () => void;
    insights: string | null;
    isInsightsLoading: boolean;
}

const BarChart = ({ data }: { data: { label: string; value: number }[] }) => {
    if (!data.length) return null;
    const maxValue = Math.max(...data.map(d => d.value));
    const chartHeight = 150;
    const barWidth = 30;
    const gap = 10;
    const width = data.length * (barWidth + gap);

    return (
        <svg width="100%" height={chartHeight + 40} viewBox={`0 0 ${width} ${chartHeight + 40}`}>
            {data.map((d, i) => {
                const barHeight = maxValue > 0 ? (d.value / maxValue) * chartHeight : 0;
                const x = i * (barWidth + gap);
                return (
                    <g key={d.label}>
                        <rect
                            x={x}
                            y={chartHeight - barHeight}
                            width={barWidth}
                            height={barHeight}
                            fill="#2dd4bf"
                        />
                        <text
                            x={x + barWidth / 2}
                            y={chartHeight - barHeight - 5}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#e5e7eb"
                        >
                            {d.value.toFixed(0)}L
                        </text>
                        <text
                            x={x + barWidth / 2}
                            y={chartHeight + 15}
                            textAnchor="middle"
                            fontSize="9"
                            fill="#9ca3af"
                        >
                            {d.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};

const LineChart = ({ data }: { data: { label: string; value: number }[] }) => {
     if (data.length < 2) return null;
    const maxValue = Math.max(...data.map(d => d.value));
    const chartHeight = 150;
    const chartWidth = 300;
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * chartWidth;
        const y = chartHeight - (maxValue > 0 ? (d.value / maxValue) * chartHeight : 0);
        return { x, y, value: d.value };
    });

    const pathData = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

    return (
        <svg width="100%" height={chartHeight + 40} viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}>
            <path d={pathData} fill="none" stroke="#2dd4bf" strokeWidth="2" />
            {points.map((p, i) => (
                <g key={i}>
                    <circle cx={p.x} cy={p.y} r="3" fill="#2dd4bf" />
                     <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="10" fill="#e5e7eb">{p.value.toFixed(0)}L</text>
                </g>
            ))}
        </svg>
    );
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({ rounds, onGetAiInsights, insights, isInsightsLoading }) => {
    
    const fuelByCategory = useMemo(() => {
        const categoryMap = new Map<string, number>();
        rounds.forEach(round => {
            round.items.forEach(item => {
                const totalFuel = (item.fuel || 0) * item.quantity;
                categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + totalFuel);
            });
        });
        return Array.from(categoryMap.entries())
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value);
    }, [rounds]);

    const fuelOverTime = useMemo(() => {
        return rounds
            .map(round => ({
                label: new Date(round.timestamp).toLocaleDateString(),
                value: round.totalFuel
            }))
            .reverse(); // Show oldest to newest
    }, [rounds]);
    
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-bold text-white">Dashboard & Analytics</h2>
            </div>
            {rounds.length === 0 ? (
                 <p className="text-gray-400 text-center py-8 px-4">Record at least one round to see analytics.</p>
            ) : (
                <div className="p-4 space-y-6 overflow-y-auto flex-grow">
                    {/* Charts */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-200 mb-2">Fuel by Category</h3>
                        <div className="bg-gray-700/50 p-3 rounded-lg">
                           {fuelByCategory.length > 0 ? <BarChart data={fuelByCategory} /> : <p className="text-sm text-gray-500 text-center">No data available.</p>}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold text-gray-200 mb-2">Fuel Over Time</h3>
                        <div className="bg-gray-700/50 p-3 rounded-lg">
                           {fuelOverTime.length > 1 ? <LineChart data={fuelOverTime} /> : <p className="text-sm text-gray-500 text-center">Need at least two rounds to show a trend.</p>}
                        </div>
                    </div>
                     {/* AI Insights */}
                    <div className="space-y-3">
                         <h3 className="text-lg font-semibold text-gray-200">AI-Powered Insights</h3>
                        <button
                            onClick={onGetAiInsights}
                            disabled={isInsightsLoading}
                            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                           {isInsightsLoading ? (
                                <>
                                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Analyzing...
                                </>
                            ) : (
                                <>
                                    <LightbulbIcon />
                                    Generate Strategic Insights
                                </>
                            )}
                        </button>
                        {insights && (
                             <div className="bg-gray-900/50 p-4 rounded-lg prose prose-invert prose-sm max-w-none prose-p:text-gray-300 prose-headings:text-teal-400">
                                <p dangerouslySetInnerHTML={{ __html: insights.replace(/\n/g, '<br />') }} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPanel;
