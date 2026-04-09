import React, { useState } from 'react';
import { CONCRETE_GRADES, REINFORCEMENT_TYPES, getConcreteEc } from '../../lib/as3600';
import { cn } from '../../lib/utils';
import { Beaker } from 'lucide-react';

interface MaterialSelectorProps {
  fc: number;
  setFc: (val: number) => void;
  fsy: number;
  setFsy: (val: number) => void;
  customMaterials?: any[];
  onAddCustomMaterial?: (m: any) => void;
}

export const MaterialSelector: React.FC<MaterialSelectorProps> = ({ 
  fc, setFc, fsy, setFsy, customMaterials = [], onAddCustomMaterial 
}) => {
  const [showMixDesign, setShowMixDesign] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ label: '', fc: 32, fsy: 500 });
  
  const [mix, setMix] = useState({
    cement: 350,
    water: 180,
    sand: 800,
    aggregate: 1100
  });

  const Ec = getConcreteEc(fc);

  const handleAddCustom = () => {
    if (!newMaterial.label) return;
    onAddCustomMaterial?.(newMaterial);
    setShowCustomForm(false);
    setNewMaterial({ label: '', fc: 32, fsy: 500 });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#141414]/5 border border-line">
        <div>
          <label className="block text-[10px] font-mono uppercase opacity-50 mb-1">Concrete Grade (f'c)</label>
          <select 
            value={fc} 
            onChange={(e) => setFc(parseInt(e.target.value))}
            className="w-full bg-white border border-[#141414]/20 p-2 text-sm font-mono outline-none focus:border-[#141414]"
          >
            {CONCRETE_GRADES.map(g => <option key={g} value={g}>{g} MPa</option>)}
            {customMaterials.filter(m => m.type === 'concrete').map(m => (
              <option key={m.id} value={m.fc}>{m.label} ({m.fc} MPa)</option>
            ))}
          </select>
          <div className="mt-1 text-[10px] font-mono opacity-40 italic">Ec ≈ {(Ec/1000).toFixed(1)} GPa</div>
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase opacity-50 mb-1">Reinforcement Type</label>
          <select 
            value={fsy} 
            onChange={(e) => setFsy(parseInt(e.target.value))}
            className="w-full bg-white border border-[#141414]/20 p-2 text-sm font-mono outline-none focus:border-[#141414]"
          >
            {REINFORCEMENT_TYPES.map(t => <option key={t.id} value={t.fsy}>{t.label}</option>)}
            {customMaterials.filter(m => m.type === 'steel').map(m => (
              <option key={m.id} value={m.fsy}>{m.label} ({m.fsy} MPa)</option>
            ))}
          </select>
          <div className="mt-1 text-[10px] font-mono opacity-40 italic">fsy = {fsy} MPa | Es = 200 GPa</div>
        </div>
      </div>

      <div className="border border-line overflow-hidden">
        <div className="flex border-b border-line">
          <button 
            onClick={() => { setShowMixDesign(!showMixDesign); setShowCustomForm(false); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 p-3 text-[10px] font-mono uppercase tracking-widest transition-colors",
              showMixDesign ? "bg-gray-100 font-bold" : "bg-white hover:bg-gray-50"
            )}
          >
            <Beaker size={14} className="text-accent" />
            <span>Mix Design</span>
          </button>
          <button 
            onClick={() => { setShowCustomForm(!showCustomForm); setShowMixDesign(false); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 p-3 text-[10px] font-mono uppercase tracking-widest transition-colors border-l border-line",
              showCustomForm ? "bg-gray-100 font-bold" : "bg-white hover:bg-gray-50"
            )}
          >
            <Beaker size={14} className="text-blue-500" />
            <span>Custom Material</span>
          </button>
        </div>
        
        {showMixDesign && (
          <div className="p-4 bg-gray-50 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
            {Object.entries(mix).map(([key, value]) => (
              <div key={key}>
                <label className="block text-[8px] font-mono uppercase opacity-40 mb-1">{key} (kg/m³)</label>
                <input 
                  type="number"
                  value={value}
                  onChange={(e) => setMix({ ...mix, [key]: parseFloat(e.target.value) })}
                  className="w-full bg-white border border-line p-1 text-[10px] font-mono outline-none focus:border-accent"
                />
              </div>
            ))}
            <div className="col-span-2 pt-2 border-t border-line/10">
              <div className="flex justify-between text-[8px] font-mono uppercase opacity-40">
                <span>W/C Ratio:</span>
                <span className="font-bold">{(mix.water / mix.cement).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {showCustomForm && (
          <div className="p-4 bg-gray-50 space-y-4 animate-in fade-in slide-in-from-top-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[8px] font-mono uppercase opacity-40 mb-1">Material Label</label>
                <input 
                  type="text"
                  placeholder="e.g. High Strength Mix A"
                  value={newMaterial.label}
                  onChange={(e) => setNewMaterial({ ...newMaterial, label: e.target.value })}
                  className="w-full bg-white border border-line p-2 text-[10px] font-mono outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-[8px] font-mono uppercase opacity-40 mb-1">f'c (MPa)</label>
                <input 
                  type="number"
                  value={newMaterial.fc}
                  onChange={(e) => setNewMaterial({ ...newMaterial, fc: parseInt(e.target.value) })}
                  className="w-full bg-white border border-line p-2 text-[10px] font-mono outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-[8px] font-mono uppercase opacity-40 mb-1">fsy (MPa)</label>
                <input 
                  type="number"
                  value={newMaterial.fsy}
                  onChange={(e) => setNewMaterial({ ...newMaterial, fsy: parseInt(e.target.value) })}
                  className="w-full bg-white border border-line p-2 text-[10px] font-mono outline-none focus:border-accent"
                />
              </div>
            </div>
            <button 
              onClick={handleAddCustom}
              className="w-full bg-ink text-white p-2 text-[10px] font-mono uppercase tracking-widest hover:bg-ink/90 transition-colors"
            >
              Add to Database
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
