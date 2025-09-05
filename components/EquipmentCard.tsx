
import React from 'react';
import type { Equipment } from '../types';
import { PlusIcon } from './icons/PlusIcon';

interface EquipmentCardProps {
    equipment: Equipment;
    onAdd: (equipment: Equipment) => void;
    isSelected: boolean;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({ equipment, onAdd, isSelected }) => {
    return (
        <div
            onClick={() => onAdd(equipment)}
            className={`
                bg-gray-700 rounded-lg p-3 flex flex-col justify-between cursor-pointer 
                transition-all duration-200 ease-in-out transform hover:-translate-y-1
                shadow-md hover:shadow-lg
                ${isSelected ? 'ring-2 ring-teal-500' : 'hover:ring-2 hover:ring-teal-600'}
            `}
        >
            <div>
                <h3 className="font-semibold text-sm text-gray-100">{equipment.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{equipment.category}</p>
            </div>
            <div className="flex justify-end mt-2">
                 <button 
                    className="bg-teal-500 text-white rounded-full p-1 w-7 h-7 flex items-center justify-center hover:bg-teal-400 transition-colors"
                    aria-label={`Add ${equipment.name}`}
                 >
                    <PlusIcon />
                </button>
            </div>
        </div>
    );
};

export default EquipmentCard;
