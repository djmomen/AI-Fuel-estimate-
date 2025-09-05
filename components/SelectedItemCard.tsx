
import React from 'react';
import type { SelectedItem } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { MinusIcon } from './icons/MinusIcon';
import { PlusIcon } from './icons/PlusIcon';

interface SelectedItemCardProps {
    item: SelectedItem;
    onUpdate: (id: string, field: 'quantity' | 'hours' | 'idleHours', value: number) => void;
    onRemove: (id: string) => void;
}

const SelectedItemCard: React.FC<SelectedItemCardProps> = ({ item, onUpdate, onRemove }) => {
    return (
        <div className="bg-gray-700 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors">
            <div className="flex-grow">
                <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="font-semibold text-white leading-tight">{item.name}</p>
                    <span className="text-xs font-medium bg-gray-600 text-teal-300 px-2 py-0.5 rounded-full whitespace-nowrap">{item.category}</span>
                </div>
                 {item.fuel !== undefined && (
                    <p className="text-sm text-teal-400 font-bold mt-1">
                        Est. {(item.fuel * item.quantity).toFixed(2)} Liters
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Quantity control */}
                <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-400 mr-1">Qty</label>
                    <button onClick={() => onUpdate(item.id, 'quantity', item.quantity - 1)} className="p-1 rounded-full bg-gray-600 hover:bg-gray-500 text-white"><MinusIcon /></button>
                    <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => onUpdate(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-12 text-center bg-gray-800 text-white rounded-md border-gray-600"
                    />
                    <button onClick={() => onUpdate(item.id, 'quantity', item.quantity + 1)} className="p-1 rounded-full bg-gray-600 hover:bg-gray-500 text-white"><PlusIcon /></button>
                </div>
                {/* Hours control */}
                <div className="flex items-center gap-1">
                     <label className="text-xs text-gray-400 mr-1">Active Hrs</label>
                     <input
                        type="number"
                        value={item.hours}
                        onChange={(e) => onUpdate(item.id, 'hours', parseInt(e.target.value) || 0)}
                        className="w-16 text-center bg-gray-800 text-white rounded-md border-gray-600"
                    />
                </div>
                 {/* Idle Hours control */}
                <div className="flex items-center gap-1">
                     <label className="text-xs text-gray-400 mr-1">Idle Hrs</label>
                     <input
                        type="number"
                        value={item.idleHours}
                        onChange={(e) => onUpdate(item.id, 'idleHours', parseInt(e.target.value) || 0)}
                        className="w-16 text-center bg-gray-800 text-white rounded-md border-gray-600"
                    />
                </div>

                <button onClick={() => onRemove(item.id)} className="text-red-400 hover:text-red-300 p-2">
                    <TrashIcon />
                </button>
            </div>
        </div>
    );
};

export default SelectedItemCard;