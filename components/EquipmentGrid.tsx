import React, { useState, useMemo } from 'react';
import type { Equipment, SelectedItem } from '../types';
import { EQUIPMENT_LIST } from '../constants';
import EquipmentCard from './EquipmentCard';

interface EquipmentGridProps {
    onAddItem: (equipment: Equipment) => void;
    selectedItems: SelectedItem[];
}

const EquipmentGrid: React.FC<EquipmentGridProps> = ({ onAddItem, selectedItems }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const categories = useMemo(() => 
        ['All', ...Array.from(new Set(EQUIPMENT_LIST.map(item => item.category)))].sort()
    , []);

    const filteredEquipment = useMemo(() => {
        return EQUIPMENT_LIST.filter(item => {
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [searchTerm, selectedCategory]);

    const selectedItemNames = useMemo(() => new Set(selectedItems.map(item => item.name)), [selectedItems]);

    return (
        <div className="bg-gray-800 rounded-lg shadow-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-700">
                <input
                    type="text"
                    placeholder="Search equipment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                selectedCategory === category
                                    ? 'bg-teal-500 text-white font-semibold'
                                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>
            <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredEquipment.map(item => (
                        <EquipmentCard
                            key={item.name}
                            equipment={item}
                            onAdd={onAddItem}
                            isSelected={selectedItemNames.has(item.name)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EquipmentGrid;