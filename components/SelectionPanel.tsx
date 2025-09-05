import React from 'react';
import type { SelectedItem } from '../types';
import SelectedItemCard from './SelectedItemCard';

interface SelectionPanelProps {
    items: SelectedItem[];
    period: { from: string; to: string };
    roundName: string;
    onUpdateItem: (id: string, field: 'quantity' | 'hours' | 'idleHours', value: number) => void;
    onRemoveItem: (id:string) => void;
    onClear: () => void;
    onSetPeriod: (period: { from: string; to: string }) => void;
    onSetRoundName: (name: string) => void;
    onCalculate: () => void;
    onRecordRound: () => void;
    isLoading: boolean;
    error: string | null;
    isCalculationDone: boolean;
    aiJustification: string | null;
}

const SelectionPanel: React.FC<SelectionPanelProps> = ({
    items, period, roundName, onUpdateItem, onRemoveItem, onClear, onSetPeriod, onSetRoundName, onCalculate, onRecordRound, isLoading, error, isCalculationDone, aiJustification
}) => {
    const subtotal = items.reduce((acc, item) => acc + (item.fuel || 0) * item.quantity, 0);
    const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="flex flex-col">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                <div className="flex items-baseline gap-3">
                    <h2 className="text-xl font-bold text-white">Current Selection</h2>
                    {totalQuantity > 0 && (
                        <span className="font-semibold text-gray-400">
                           {totalQuantity} total units
                        </span>
                    )}
                </div>
                <button onClick={onClear} className="text-sm text-red-400 hover:text-red-300 font-semibold">Clear All</button>
            </div>
            <div className="p-4 space-y-3">
                {items.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">Select equipment from the list to begin.</p>
                ) : (
                    items.map(item => (
                        <SelectedItemCard key={item.id} item={item} onUpdate={onUpdateItem} onRemove={onRemoveItem} />
                    ))
                )}
            </div>
            <div className="p-4 border-t border-gray-700 bg-gray-800 space-y-4 mt-auto">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Round Name</label>
                    <input 
                        type="text" 
                        value={roundName}
                        onChange={e => onSetRoundName(e.target.value)}
                        placeholder="e.g., Site A - Week 4"
                        className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">From</label>
                        <input type="date" value={period.from} onChange={e => onSetPeriod({ ...period, from: e.target.value })} className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">To</label>
                        <input type="date" value={period.to} onChange={e => onSetPeriod({ ...period, to: e.target.value })} className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                </div>
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={onCalculate}
                        disabled={isLoading || items.length === 0}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {isLoading ? (
                            <>
                               <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Calculating...
                            </>
                        ) : "Calculate Fuel Consumption"}
                    </button>
                    {isCalculationDone && (
                        <div className="text-center bg-gray-700/50 p-3 rounded-md space-y-2">
                            <div>
                                <span className="text-lg font-bold text-teal-400">Total: {subtotal.toFixed(2)} Liters</span>
                            </div>
                            {aiJustification && (
                                <div>
                                    <p className="text-xs text-gray-400 italic text-left">
                                        <span className="font-bold not-italic text-cyan-400">AI Reasoning:</span> {aiJustification}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={onRecordRound}
                        disabled={!isCalculationDone || isLoading}
                        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        Record Round
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectionPanel;