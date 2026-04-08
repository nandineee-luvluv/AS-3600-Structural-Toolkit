import React, { useState } from 'react';
import { InputGroup, InputField, ResultRow } from './ui/InputGrid';
import { CONCRETE_GRADES, STEEL_GRADES, getConcreteEc } from '../lib/as3600';
import { Save, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface MaterialSettingsProps {
  onSave: (materials: { fc: number; fsy: number; Es: number; Ec: number }) => void;
}

export const MaterialSettings: React.FC<MaterialSettingsProps> = ({ onSave }) => {
  const [fc, setFc] = useState(32);
  const [fsy, setFsy] = useState(500);
  const [Es, setEs] = useState(200000);
  const [Ec, setEc] = useState(getConcreteEc(32));
  const [saved, setSaved] = useState(false);

  // Mix Design State (kg/m3)
  const [cement, setCement] = useState(350);
  const [water, setWater] = useState(175);
  const [sand, setSand] = useState(700);
  const [aggregate, setAggregate] = useState(1100);

  const handleFcChange = (val: number) => {
    setFc(val);
    setEc(getConcreteEc(val));
    // Simple estimation logic
    if (val <= 20) { setCement(300); setWater(180); setSand(800); setAggregate(1100); }
    else if (val <= 32) { setCement(360); setWater(175); setSand(750); setAggregate(1050); }
    else { setCement(420); setWater(170); setSand(700); setAggregate(1000); }
  };

  const handleSave = () => {
    onSave({ fc, fsy, Es, Ec });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-12">
      <header className="border-b border-line pb-8">
        <h2 className="text-4xl font-serif font-bold italic tracking-tight text-ink">Material Properties</h2>
        <p className="text-[10px] font-mono opacity-40 uppercase tracking-[0.3em] mt-2">Configure AS 3600 Material Database</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <InputGroup title="Concrete Properties">
            <div className="p-4 bg-gray-50 flex gap-1 flex-wrap mb-4 border-b border-line">
              {CONCRETE_GRADES.map(g => (
                <button 
                  key={g} 
                  onClick={() => handleFcChange(g)}
                  className={cn(
                    "px-3 py-1 text-[10px] font-mono border transition-all",
                    fc === g ? 'bg-ink text-white border-ink shadow-sm' : 'bg-white border-line text-ink/40 hover:text-ink'
                  )}
                >
                  {g} MPa
                </button>
              ))}
            </div>
            <InputField label="Comp. Strength (f'c)" value={fc} onChange={handleFcChange} unit="MPa" />
            <InputField label="Modulus (Ec)" value={Ec.toFixed(0)} onChange={(v) => setEc(v)} unit="MPa" />
          </InputGroup>

          <InputGroup title="Concrete Mix Design (Indicative per m³)">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border-b border-line">
              <InputField label="Cement" value={cement} onChange={setCement} unit="kg" />
              <InputField label="Water" value={water} onChange={setWater} unit="kg" />
              <InputField label="Fine Agg. (Sand)" value={sand} onChange={setSand} unit="kg" />
              <InputField label="Coarse Agg." value={aggregate} onChange={setAggregate} unit="kg" />
            </div>
            <div className="p-4 text-[10px] font-mono opacity-40 italic">
              W/C Ratio: {(water / cement).toFixed(2)} | Total Density: {(cement + water + sand + aggregate).toFixed(0)} kg/m³
            </div>
          </InputGroup>

          <InputGroup title="Steel Properties">
            <div className="p-4 bg-gray-50 flex gap-1 flex-wrap mb-4 border-b border-line">
              {STEEL_GRADES.map(g => (
                <button 
                  key={g} 
                  onClick={() => setFsy(g)}
                  className={cn(
                    "px-3 py-1 text-[10px] font-mono border transition-all",
                    fsy === g ? 'bg-ink text-white border-ink shadow-sm' : 'bg-white border-line text-ink/40 hover:text-ink'
                  )}
                >
                  {g} MPa
                </button>
              ))}
            </div>
            <InputField label="Yield Strength (fsy)" value={fsy} onChange={setFsy} unit="MPa" />
            <InputField label="Modulus (Es)" value={Es} onChange={setEs} unit="MPa" />
          </InputGroup>

          <button 
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-3 bg-ink text-white py-5 text-xs font-mono uppercase tracking-[0.2em] hover:bg-ink/90 transition-all shadow-xl"
          >
            {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {saved ? 'Properties Saved' : 'Save Material Profile'}
          </button>
        </div>

        <div className="space-y-8">
          <InputGroup title="Property Summary">
            <ResultRow label="Concrete f'c" value={fc} unit="MPa" />
            <ResultRow label="Concrete Ec" value={(Ec/1000).toFixed(1)} unit="GPa" />
            <ResultRow label="Steel fsy" value={fsy} unit="MPa" />
            <ResultRow label="Steel Es" value={(Es/1000).toFixed(0)} unit="GPa" />
            <ResultRow label="Modular Ratio (n)" value={(Es/Ec).toFixed(2)} />
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
                <span className="font-bold text-ink w-12 shrink-0">Ec:</span> 
                <span>Calculated per Clause 3.1.2 based on density and f'c.</span>
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
