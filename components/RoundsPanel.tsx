
import React, { useState } from 'react';
import type { Round } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';

interface RoundsPanelProps {
    rounds: Round[];
    totalFuel: number;
    onExportXlsx: () => void;
    onExportHtml: () => void;
    onDeleteRound: (roundId: string) => void;
}

const RoundsPanel: React.FC<RoundsPanelProps> = ({ rounds, totalFuel, onExportXlsx, onExportHtml, onDeleteRound }) => {
    const [expandedRoundId, setExpandedRoundId] = useState<string | null>(null);
    
    const toggleExpand = (roundId: string) => {
        setExpandedRoundId(prevId => (prevId === roundId ? null : roundId));
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                <h2 className="text-xl font-bold text-white">Recorded Rounds</h2>
                <div className="text-lg font-bold text-teal-400">Total: {totalFuel.toFixed(2)} L</div>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-grow">
                {rounds.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No rounds recorded yet.</p>
                ) : (
                    rounds.map(round => (
                        <div key={round.id} className="bg-gray-700 rounded-lg">
                            <div className="p-3 flex justify-between items-start cursor-pointer hover:bg-gray-600/50" onClick={() => toggleExpand(round.id)}>
                                <div className="flex-grow">
                                    <p className="font-semibold text-white">{round.name}</p>
                                    <p className="text-xs text-gray-400">{round.id} &bull; {round.items.length} item types</p>
                                    <p className="text-xs text-gray-400">Period: {round.period.from} to {round.period.to}</p>
                                </div>
                                <div className="flex items-center gap-2 pl-2">
                                     <p className="font-bold text-teal-400 whitespace-nowrap">{round.totalFuel.toFixed(2)} L</p>
                                     <button onClick={(e) => { e.stopPropagation(); onDeleteRound(round.id) }} className="text-red-500 hover:text-red-400 p-1 rounded-full hover:bg-red-500/10 transition-colors">
                                        <TrashIcon />
                                    </button>
                                    <span className="text-gray-500">
                                        {expandedRoundId === round.id ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                    </span>
                                </div>
                            </div>
                             {expandedRoundId === round.id && (
                                <div className="border-t border-gray-600 p-3">
                                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Details for round: {round.name}</h4>
                                     <table className="w-full text-xs text-left">
                                        <thead className="text-gray-400">
                                            <tr>
                                                <th className="py-1 pr-2">Equipment</th>
                                                <th className="py-1 px-2 text-center">Qty</th>
                                                <th className="py-1 px-2 text-center">Active Hrs</th>
                                                <th className="py-1 px-2 text-center">Idle Hrs</th>
                                                <th className="py-1 pl-2 text-right">Fuel (L)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-200">
                                            {round.items.map(item => (
                                                <tr key={item.id} className="border-t border-gray-600/50">
                                                    <td className="py-1 pr-2">{item.name}</td>
                                                    <td className="py-1 px-2 text-center">{item.quantity}</td>
                                                    <td className="py-1 px-2 text-center">{item.hours}</td>
                                                    <td className="py-1 px-2 text-center">{item.idleHours}</td>
                                                    <td className="py-1 pl-2 text-right font-semibold">{(item.fuel || 0).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
            <div className="p-4 border-t border-gray-700 flex gap-4 mt-auto flex-shrink-0">
                <button
                    onClick={onExportXlsx}
                    disabled={rounds.length === 0}
                    className="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Export XLSX
                </button>
                <button
                    onClick={onExportHtml}
                    disabled={rounds.length === 0}
                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Export HTML
                </button>
            </div>
        </div>
    );
};

export default RoundsPanel;
