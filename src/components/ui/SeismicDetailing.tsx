import React from 'react';
import { SeismicRequirement } from '../../lib/as3600';
import { ShieldCheck, AlertTriangle, Info } from 'lucide-react';

interface SeismicDetailingProps {
  requirements: SeismicRequirement[];
}

export const SeismicDetailing: React.FC<SeismicDetailingProps> = ({ requirements }) => {
  return (
    <div className="space-y-4">
      <header className="flex items-center gap-2 border-b border-[#141414]/10 pb-2">
        <ShieldCheck size={16} />
        <h3 className="text-[10px] font-mono uppercase font-bold tracking-widest">AS 3600 Seismic Detailing (Section 14)</h3>
      </header>
      <div className="space-y-3">
        {requirements.map((req, i) => (
          <div key={i} className={`p-3 border-l-4 ${
            req.status === 'pass' ? 'border-green-500 bg-green-50' : 
            req.status === 'fail' ? 'border-red-500 bg-red-50' : 
            'border-blue-500 bg-blue-50'
          }`}>
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-mono font-bold uppercase opacity-60">Clause {req.clause}</span>
              {req.status === 'pass' ? <ShieldCheck size={14} className="text-green-600" /> : 
               req.status === 'fail' ? <AlertTriangle size={14} className="text-red-600" /> : 
               <Info size={14} className="text-blue-600" />}
            </div>
            <p className="text-xs font-bold mb-1">{req.requirement}</p>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono opacity-50">Requirement:</span>
              <span className="text-[10px] font-mono font-bold">{req.value}</span>
            </div>
            <p className="text-[10px] font-mono opacity-40 mt-2 italic leading-tight">{req.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
