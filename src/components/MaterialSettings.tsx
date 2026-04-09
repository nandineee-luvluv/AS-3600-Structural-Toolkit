import React, { useState } from 'react';
import { InputGroup, InputField, ResultRow } from './ui/InputGrid';
import { CONCRETE_GRADES, REINFORCEMENT_TYPES, getConcreteEc } from '../lib/as3600';
import { Save, RefreshCcw, CheckCircle2, Trash2, Plus } from 'lucide-react';
import { useMaterials } from '../contexts/MaterialContext';
import { cn } from '../lib/utils';

interface MaterialSettingsProps {
  onSave: (materials: { fc: number; fsy: number; Es: number; Ec: number }) => void;
}

export const MaterialSettings: React.FC<MaterialSettingsProps> = ({ onSave }) => {
  const { customMaterials, addMaterial, removeMaterial } = useMaterials();
  const [fc, setFc] = useState(32);
  const [fsy, setFsy] = useState(500);
  const [Es, setEs] = useState(200000);
  const [Ec, setEc] = useState(getConcreteEc(32));
  const [saved, setSaved] = useState(false);

  const [newCustom, setNewCustom] = useState({ label: '', fc: 32, fsy: 500, type: 'concrete' as 'concrete' | 'steel' });

  const handleFcChange = (val: number) => {
    setFc(val);
    setEc(getConcreteEc(val));
  };

  const handleAddCustom = () => {
    if (!newCustom.label) return;
    addMaterial(newCustom);
    setNewCustom({ label: '', fc: 32, fsy: 500, type: 'concrete' });
  };

  const handleSave = () => {
    onSave({ fc, fsy, Es, Ec });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-12">
      <header className="border-b border-line pb-8">
        <h2 className="text-4xl font-serif font-bold italic tracking-tight text-ink">Material Database</h2>
        <p className="text-[10px] font-mono opacity-40 uppercase tracking-[0.3em] mt-2">Manage AS 3600 & Custom Material Properties</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <InputGroup title="Add Custom Material">
            <div className="p-6 bg-gray-50 space-y-4 border-b border-line">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[8px] font-mono uppercase opacity-40 mb-1">Material Label</label>
                  <input 
                    type="text"
                    placeholder="e.g. High Strength Mix A"
                    value={newCustom.label}
                    onChange={(e) => setNewCustom({ ...newCustom, label: e.target.value })}
                    className="w-full bg-white border border-line p-2 text-[10px] font-mono outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-mono uppercase opacity-40 mb-1">Type</label>
                  <select 
                    value={newCustom.type}
                    onChange={(e) => setNewCustom({ ...newCustom, type: e.target.value as any })}
                    className="w-full bg-white border border-line p-2 text-[10px] font-mono outline-none focus:border-accent"
                  >
                    <option value="concrete">Concrete</option>
                    <option value="steel">Steel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-mono uppercase opacity-40 mb-1">{newCustom.type === 'concrete' ? "f'c (MPa)" : "fsy (MPa)"}</label>
                  <input 
                    type="number"
                    value={newCustom.type === 'concrete' ? newCustom.fc : newCustom.fsy}
                    onChange={(e) => setNewCustom({ ...newCustom, [newCustom.type === 'concrete' ? 'fc' : 'fsy']: parseInt(e.target.value) })}
                    className="w-full bg-white border border-line p-2 text-[10px] font-mono outline-none focus:border-accent"
                  />
                </div>
              </div>
              <button 
                onClick={handleAddCustom}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white p-3 text-[10px] font-mono uppercase tracking-widest hover:bg-blue-700 transition-colors"
              >
                <Plus size={14} /> Add to Database
              </button>
            </div>
          </InputGroup>

          <InputGroup title="Custom Materials List">
            <div className="divide-y divide-line">
              {customMaterials.length === 0 ? (
                <div className="p-8 text-center text-[10px] font-mono opacity-40 italic">No custom materials added yet.</div>
              ) : (
                customMaterials.map(m => (
                  <div key={m.id} className="p-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-[10px] font-mono font-bold uppercase">{m.label}</p>
                      <p className="text-[8px] font-mono opacity-40 uppercase">{m.type} | {m.type === 'concrete' ? `${m.fc} MPa` : `${m.fsy} MPa`}</p>
                    </div>
                    <button 
                      onClick={() => removeMaterial(m.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-sm transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </InputGroup>
        </div>

        <div className="space-y-8">
          <InputGroup title="Standard AS 3600 Grades">
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[10px] font-mono uppercase opacity-40 mb-3">Concrete Grades</label>
                <div className="flex flex-wrap gap-2">
                  {CONCRETE_GRADES.map(g => (
                    <span key={g} className="px-3 py-1 bg-gray-100 border border-line text-[10px] font-mono">{g} MPa</span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase opacity-40 mb-3">Reinforcement Types</label>
                <div className="grid grid-cols-1 gap-2">
                  {REINFORCEMENT_TYPES.map(t => (
                    <div key={t.id} className="p-2 border border-line bg-gray-50 flex justify-between items-center">
                      <span className="text-[10px] font-mono">{t.label}</span>
                      <span className="text-[10px] font-mono font-bold">{t.fsy} MPa</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </InputGroup>

          <div className="p-8 brutal-card bg-white">
            <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40 mb-6 flex items-center gap-2">
              <RefreshCcw size={12} /> Typical AS 3600 Values
            </h4>
            <ul className="space-y-4 text-[10px] font-mono leading-relaxed opacity-60">
              <li className="flex gap-4">
                <span className="font-bold text-ink w-12 shrink-0">f'c:</span> 
                <span>20, 25, 32, 40, 50, 65, 80, 100 MPa</span>
              </li>
              <li className="flex gap-4">
                <span className="font-bold text-ink w-12 shrink-0">fsy:</span> 
                <span>500 MPa (Class N), 250 MPa (Class L)</span>
              </li>
              <li className="flex gap-4">
                <span className="font-bold text-ink w-12 shrink-0">Es:</span> 
                <span>200,000 MPa (Clause 3.2.2)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
