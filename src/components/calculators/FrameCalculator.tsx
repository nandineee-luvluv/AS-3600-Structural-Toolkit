import React, { useState, useMemo } from 'react';
import { InputGroup, InputField, ResultRow } from '../ui/InputGrid';
import { Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

const FrameCalculator: React.FC = () => {
  // Geometry
  const [L, setL] = useState(6000); // Span length
  const [H, setH] = useState(3500); // Column height

  // Loads
  const [G, setG] = useState(15); // Dead load (kN/m)
  const [Q, setQ] = useState(10); // Live load (kN/m)

  // Calculations
  const calculations = useMemo(() => {
    const w_star = 1.2 * G + 1.5 * Q;
    
    // Simple Frame Coefficients (Approximate for a single portal frame)
    // M_span = wL^2 / 10
    // M_support = wL^2 / 8
    // V_max = wL / 2
    
    const M_span = (w_star * Math.pow(L / 1000, 2)) / 10;
    const M_support = (w_star * Math.pow(L / 1000, 2)) / 8;
    const V_max = (w_star * (L / 1000)) / 2;

    return {
      w_star,
      M_span,
      M_support,
      V_max
    };
  }, [L, G, Q]);

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between border-b-2 border-[#141414] pb-4">
        <div>
          <h2 className="text-3xl font-bold font-serif italic tracking-tight">Frame Analysis</h2>
          <p className="text-xs font-mono opacity-50 uppercase tracking-widest mt-1">Simplified Portal Frame / Continuous Segment</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup title="Geometry">
              <InputField label="Span Length (L)" value={L} onChange={setL} unit="mm" />
              <InputField label="Column Height (H)" value={H} onChange={setH} unit="mm" />
            </InputGroup>

            <InputGroup title="Loading (Unfactored)">
              <InputField label="Dead Load (G)" value={G} onChange={setG} unit="kN/m" />
              <InputField label="Live Load (Q)" value={Q} onChange={setQ} unit="kN/m" />
            </InputGroup>
          </div>

          {/* Frame Diagram */}
          <div className="border border-[#141414] bg-white p-12 flex justify-center shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="relative" style={{ width: L/20, height: H/20 }}>
              {/* Beam */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-[#141414]" />
              {/* Columns */}
              <div className="absolute top-0 left-0 bottom-0 w-2 bg-[#141414]" />
              {/* Right column */}
              <div className="absolute top-0 right-0 bottom-0 w-2 bg-[#141414]" />
              
              {/* Load Arrows */}
              <div className="absolute -top-8 left-0 right-0 flex justify-around">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-0.5 h-6 bg-[#141414]" />
                    <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[6px] border-t-[#141414]" />
                  </div>
                ))}
              </div>

              {/* Moment Diagram (Approx) */}
              <svg className="absolute inset-0 overflow-visible pointer-events-none opacity-20">
                <path 
                  d={`M 0 0 Q ${L/40} 40 ${L/20} 0`} 
                  fill="none" 
                  stroke="#141414" 
                  strokeWidth="4" 
                  strokeDasharray="4 4"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <InputGroup title="Factored Loads">
            <ResultRow label="Design Load (w*)" value={calculations.w_star.toFixed(1)} unit="kN/m" />
            <ResultRow label="Span Moment (M*)" value={calculations.M_span.toFixed(1)} unit="kNm" />
            <ResultRow label="Support Moment (M*)" value={calculations.M_support.toFixed(1)} unit="kNm" />
            <ResultRow label="Max Shear (V*)" value={calculations.V_max.toFixed(1)} unit="kN" />
          </InputGroup>

          <div className="p-4 bg-[#141414]/5 text-[10px] font-mono leading-relaxed">
            <div className="flex items-center gap-2 mb-1">
              <Info size={12} />
              <span className="uppercase font-bold">Analysis Method</span>
            </div>
            <p>Simplified analysis using AS 3600 Table 6.10.1 coefficients for continuous beams. For complex frames, use a structural analysis software.</p>
          </div>
          
          <div className="p-4 bg-blue-50 border-2 border-blue-600 text-blue-600 flex gap-3">
            <Info className="shrink-0" />
            <div>
              <p className="font-bold text-sm uppercase">Next Step</p>
              <p className="text-xs mt-1">Use these design moments and shears in the Beam Design module to size the section and reinforcement.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrameCalculator;
