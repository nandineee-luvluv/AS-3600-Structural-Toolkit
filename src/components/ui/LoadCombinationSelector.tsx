import React, { useState } from 'react';
import { useLoadCombinations } from '../../contexts/LoadCombinationContext';
import { Plus, X, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoadCombinationSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export const LoadCombinationSelector: React.FC<LoadCombinationSelectorProps> = ({ selectedId, onSelect }) => {
  const { combinations, addCombination, removeCombination } = useLoadCombinations();
  const [isAdding, setIsAdding] = useState(false);
  const [newCombo, setNewCombo] = useState({
    label: '',
    factors: { G: 1.2, Q: 1.5, W: 0, E: 0 }
  });

  const handleAdd = () => {
    if (!newCombo.label) return;
    addCombination(newCombo);
    setIsAdding(false);
    setNewCombo({ label: '', factors: { G: 1.2, Q: 1.5, W: 0, E: 0 } });
  };

  const selectedCombo = combinations.find(c => c.id === selectedId);

  return (
    <div className="p-6 bg-white border border-line shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
      <div className="flex items-center justify-between mb-4">
        <label className="text-[10px] font-mono uppercase tracking-widest text-ink/40">Load Combinations (AS 1170)</label>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-accent hover:underline"
        >
          {isAdding ? <X size={12} /> : <Plus size={12} />}
          {isAdding ? 'Cancel' : 'Add Custom'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {combinations.map((combo) => (
          <div key={combo.id} className="relative group">
            <button
              onClick={() => onSelect(combo.id)}
              className={cn(
                "px-3 py-1.5 text-[10px] font-mono border transition-all",
                selectedId === combo.id
                  ? "bg-ink text-white border-ink shadow-md"
                  : "bg-white text-ink border-line hover:border-ink"
              )}
            >
              {combo.label}
            </button>
            {combo.type === 'USER' && (
              <button 
                onClick={(e) => { e.stopPropagation(); removeCombination(combo.id); }}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={8} />
              </button>
            )}
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="p-4 bg-gray-50 border border-line space-y-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[8px] font-mono uppercase opacity-40 mb-1">Label</label>
              <input 
                type="text" 
                value={newCombo.label}
                onChange={(e) => setNewCombo({ ...newCombo, label: e.target.value })}
                placeholder="e.g. 1.1G + 1.2Q"
                className="w-full bg-white border border-line p-2 text-[10px] font-mono outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[8px] font-mono uppercase opacity-40 mb-1">G (Dead)</label>
              <input 
                type="number" 
                step="0.1"
                value={newCombo.factors.G}
                onChange={(e) => setNewCombo({ ...newCombo, factors: { ...newCombo.factors, G: parseFloat(e.target.value) } })}
                className="w-full bg-white border border-line p-2 text-[10px] font-mono outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[8px] font-mono uppercase opacity-40 mb-1">Q (Live)</label>
              <input 
                type="number" 
                step="0.1"
                value={newCombo.factors.Q}
                onChange={(e) => setNewCombo({ ...newCombo, factors: { ...newCombo.factors, Q: parseFloat(e.target.value) } })}
                className="w-full bg-white border border-line p-2 text-[10px] font-mono outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[8px] font-mono uppercase opacity-40 mb-1">W (Wind)</label>
              <input 
                type="number" 
                step="0.1"
                value={newCombo.factors.W}
                onChange={(e) => setNewCombo({ ...newCombo, factors: { ...newCombo.factors, W: parseFloat(e.target.value) } })}
                className="w-full bg-white border border-line p-2 text-[10px] font-mono outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[8px] font-mono uppercase opacity-40 mb-1">E (Earthquake)</label>
              <input 
                type="number" 
                step="0.1"
                value={newCombo.factors.E}
                onChange={(e) => setNewCombo({ ...newCombo, factors: { ...newCombo.factors, E: parseFloat(e.target.value) } })}
                className="w-full bg-white border border-line p-2 text-[10px] font-mono outline-none focus:border-accent"
              />
            </div>
          </div>
          <button 
            onClick={handleAdd}
            className="w-full bg-accent text-white py-2 text-[10px] font-mono uppercase tracking-widest hover:bg-accent/90 transition-colors"
          >
            Save Combination
          </button>
        </div>
      )}

      {selectedCombo && (
        <div className="flex items-start gap-2 p-3 bg-blue-50/50 border border-blue-100 text-[10px] font-mono leading-relaxed">
          <Info size={12} className="shrink-0 mt-0.5 text-blue-500" />
          <div>
            <span className="font-bold uppercase tracking-wider text-blue-700">{selectedCombo.type}: </span>
            <span className="opacity-60">{selectedCombo.description || 'Custom user-defined combination.'}</span>
            <div className="mt-1 flex gap-3 opacity-40">
              <span>G: {selectedCombo.factors.G}</span>
              <span>Q: {selectedCombo.factors.Q}</span>
              <span>W: {selectedCombo.factors.W}</span>
              <span>E: {selectedCombo.factors.E}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
