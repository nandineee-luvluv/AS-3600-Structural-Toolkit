import React from 'react';
import { CONCRETE_GRADES, STEEL_GRADES, getConcreteEc } from '../../lib/as3600';

interface MaterialSelectorProps {
  fc: number;
  setFc: (val: number) => void;
  fsy: number;
  setFsy: (val: number) => void;
}

export const MaterialSelector: React.FC<MaterialSelectorProps> = ({ fc, setFc, fsy, setFsy }) => {
  const Ec = getConcreteEc(fc);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#141414]/5">
      <div>
        <label className="block text-[10px] font-mono uppercase opacity-50 mb-1">Concrete Grade (f'c)</label>
        <select 
          value={fc} 
          onChange={(e) => setFc(parseInt(e.target.value))}
          className="w-full bg-white border border-[#141414]/20 p-2 text-sm font-mono outline-none focus:border-[#141414]"
        >
          {CONCRETE_GRADES.map(g => <option key={g} value={g}>{g} MPa</option>)}
        </select>
        <div className="mt-1 text-[10px] font-mono opacity-40 italic">Ec ≈ {(Ec/1000).toFixed(1)} GPa</div>
      </div>
      <div>
        <label className="block text-[10px] font-mono uppercase opacity-50 mb-1">Steel Grade (fsy)</label>
        <select 
          value={fsy} 
          onChange={(e) => setFsy(parseInt(e.target.value))}
          className="w-full bg-white border border-[#141414]/20 p-2 text-sm font-mono outline-none focus:border-[#141414]"
        >
          {STEEL_GRADES.map(g => <option key={g} value={g}>{g} MPa</option>)}
        </select>
        <div className="mt-1 text-[10px] font-mono opacity-40 italic">Es = 200 GPa</div>
      </div>
    </div>
  );
};
