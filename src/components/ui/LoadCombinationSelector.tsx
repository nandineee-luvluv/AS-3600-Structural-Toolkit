import React from 'react';
import { LOAD_COMBINATIONS } from '../../lib/as3600';

interface LoadCombinationSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export const LoadCombinationSelector: React.FC<LoadCombinationSelectorProps> = ({ selectedId, onSelect }) => {
  return (
    <div className="p-4 bg-[#141414]/5 border-b border-[#141414]/10">
      <label className="block text-[10px] font-mono uppercase opacity-50 mb-2">AS 3600 Load Combination</label>
      <div className="flex flex-wrap gap-2">
        {LOAD_COMBINATIONS.map((combo) => (
          <button
            key={combo.id}
            onClick={() => onSelect(combo.id)}
            className={`px-3 py-1 text-[10px] font-mono border transition-all ${
              selectedId === combo.id
                ? 'bg-[#141414] text-white border-[#141414]'
                : 'bg-white text-[#141414] border-[#141414]/20 hover:border-[#141414]'
            }`}
          >
            {combo.label}
          </button>
        ))}
      </div>
    </div>
  );
};
