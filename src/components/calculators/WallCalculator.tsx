import React, { useState, useMemo, useEffect } from 'react';
import { InputGroup, InputField, ResultRow } from '../ui/InputGrid';
import { 
  calculateWallBoundaryElements, 
  calculateSeismicDetailing, 
  validateInput, 
  LOAD_COMBINATIONS,
  COLUMN_END_CONDITIONS
} from '../../lib/as3600';
import { Info, AlertTriangle, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { MaterialSelector } from '../ui/MaterialSelector';
import { LoadCombinationSelector } from '../ui/LoadCombinationSelector';
import { SeismicDetailing } from '../ui/SeismicDetailing';
import { ExportActions } from '../ui/ExportActions';
import { useHistory } from '../../contexts/HistoryContext';
import { cn } from '../../lib/utils';

const WallCalculator: React.FC = () => {
  const { addToHistory } = useHistory();
  // Section Geometry
  const [tw, setTw] = useState(200); // Wall thickness
  const [Lw, setLw] = useState(3000); // Wall length
  const [Hw, setHw] = useState(3000); // Wall height
  const [endConditionId, setEndConditionId] = useState('fixed-fixed');

  // Reinforcement
  const [barDiamV, setBarDiamV] = useState(16);
  const [barSpacingV, setBarSpacingV] = useState(200);
  const [barDiamH, setBarDiamH] = useState(12);
  const [barSpacingH, setBarSpacingH] = useState(200);

  // Materials
  const [fc, setFc] = useState(32);
  const [fsy, setFsy] = useState(500);

  // Loads
  const [gLoad, setGLoad] = useState(1000);
  const [qLoad, setQLoad] = useState(500);
  const [wLoad, setWLoad] = useState(0);
  const [eLoad, setELoad] = useState(0);
  const [mStar, setMStar] = useState(2000); // kNm
  const [vStar, setVStar] = useState(500); // kN
  const [selectedComboId, setSelectedComboId] = useState('1.2G_1.5Q');

  // Validation
  const errors = useMemo(() => {
    return [
      validateInput(tw, 150, 600, 'Thickness (tw)'),
      validateInput(Lw, 1000, 10000, 'Length (Lw)'),
      validateInput(fc, 20, 100, "Concrete f'c"),
    ].filter(e => e !== null) as string[];
  }, [tw, Lw, fc]);

  // Derived Values
  const combo = LOAD_COMBINATIONS.find(c => c.id === selectedComboId)!;
  const endCondition = COLUMN_END_CONDITIONS.find(ec => ec.id === endConditionId)!;
  const nStar = gLoad * combo.factors.G + qLoad * combo.factors.Q + wLoad * combo.factors.W + eLoad * combo.factors.E;
  const He = Hw * endCondition.k_eff;

  // Calculations (Simplified C&T Method)
  const calculations = useMemo(() => {
    const z = 0.8 * Lw; // Lever arm approx
    const T = (mStar * 1e6 / z) - (nStar * 1e3 / 2); // N
    const C = (mStar * 1e6 / z) + (nStar * 1e3 / 2); // N

    const phi = 0.85;
    const Ast_req = T > 0 ? (T / (phi * fsy)) : 0;
    
    // Shear Capacity (Simplified)
    const phiV = 0.75;
    const Vuc = 0.15 * tw * 0.8 * Lw * Math.sqrt(fc) * 1e-3;
    const Vus_req = vStar > phiV * Vuc ? (vStar - phiV * Vuc) / phiV : 0;
    const Ash_req = (Vus_req * 1e3 * barSpacingH) / (fsy * 0.8 * Lw);

    const boundary = calculateWallBoundaryElements(tw, Lw, Hw, nStar, mStar, { fc, fsy, Es: 200000 });

    return {
      T: T * 1e-3,
      C: C * 1e-3,
      Ast_req,
      Ash_req,
      Vuc,
      boundary,
      isSafeShear: vStar <= phiV * (Vuc + (Ash_req * fsy * 0.8 * Lw / barSpacingH) * 1e-3)
    };
  }, [tw, Lw, Hw, mStar, nStar, vStar, fsy, fc, barSpacingH]);

  const seismic = useMemo(() => {
    return calculateSeismicDetailing('wall', { b: tw, h: Hw, d: Lw, db: barDiamV, ds: barDiamH, s: barSpacingV, fc });
  }, [tw, Hw, Lw, barDiamV, barDiamH, barSpacingV, fc]);

  const isSafeTension = ( (1000/barSpacingV) * (Math.PI * barDiamV**2 / 4) * (Lw/10) / 100 ) >= calculations.Ast_req;
  const isSafe = isSafeTension && calculations.isSafeShear;
  const Ast = (1000 / barSpacingV) * (Math.PI * Math.pow(barDiamV, 2)) / 4;

  // History Tracking
  useEffect(() => {
    if (errors.length > 0) return;
    const timer = setTimeout(() => {
      addToHistory({
        type: 'Wall Design',
        title: `${Lw}mm Wall - ${endCondition.label}`,
        inputs: { tw, Lw, fc, fsy, mStar, nStar, endCondition: endCondition.label },
        results: { T: calculations.T, C: calculations.C, needsBoundary: calculations.boundary.needsBoundary }
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [tw, Lw, fc, fsy, mStar, vStar, nStar, endConditionId]);

  const exportInputs = [
    { label: 'Thickness (tw)', value: tw, unit: 'mm' },
    { label: 'Length (Lw)', value: Lw, unit: 'mm' },
    { label: 'End Condition', value: endCondition.label },
    { label: 'Concrete Grade (fc)', value: fc, unit: 'MPa' },
    { label: 'Design Moment (M*)', value: mStar, unit: 'kNm' },
    { label: 'Design Axial (N*)', value: nStar.toFixed(0), unit: 'kN' },
  ];

  const exportResults = [
    { label: 'Tension (T*)', value: calculations.T.toFixed(0), unit: 'kN' },
    { label: 'Compression (C*)', value: calculations.C.toFixed(0), unit: 'kN' },
    { label: 'Boundary Required', value: calculations.boundary.needsBoundary ? 'YES' : 'NO', status: calculations.boundary.needsBoundary ? 'fail' : 'pass' },
  ];

  const procedure = `
# AS 3600 Wall Design (C&T Method with AS 1170 Loads)
n_star = g*G + q*Q + w*W + e*E
z = 0.8 * Lw
T = (m_star * 1e6 / z) - (n_star * 1e3 / 2)
C = (m_star * 1e6 / z) + (n_star * 1e3 / 2)
ast_req = T / (0.85 * fsy) if T > 0 else 0
print(f"Tension: {T*1e-3:.2f} kN, Compression: {C*1e-3:.2f} kN")
  `;

  return (
    <div className="space-y-12">
      <header className="flex items-end justify-between border-b border-line pb-8">
        <div>
          <h2 className="text-4xl font-serif font-bold italic tracking-tight text-ink">Shear Wall Design</h2>
          <p className="text-[10px] font-mono opacity-40 uppercase tracking-[0.3em] mt-2">Compression & Tension (C&T) Method | AS 3600:2018</p>
        </div>
        <div className="flex items-center gap-4">
          <ExportActions 
            title="Wall Design Report" 
            inputs={exportInputs} 
            results={exportResults} 
            procedure={procedure}
            filename={`wall_${Lw}mm`}
          />
          <div className={cn(
            "px-4 py-2 border border-ink shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]",
            isSafe ? 'bg-green-50' : 'bg-red-50'
          )}>
            <div className="text-[8px] font-mono uppercase opacity-40 leading-none mb-1">Status</div>
            <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wider">
              {isSafe ? <CheckCircle2 size={12} className="text-green-600" /> : <XCircle size={12} className="text-red-600" />}
              {isSafe ? 'Safe' : 'Unsafe'}
            </div>
          </div>
        </div>
      </header>

      {errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 space-y-1">
          <p className="text-[10px] font-bold uppercase flex items-center gap-2 mb-2 tracking-widest">
            <AlertTriangle size={14} /> Validation Errors
          </p>
          {errors.map((err, i) => (
            <p key={i} className="text-[10px] font-mono opacity-80">• {err}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputGroup title="Materials Database">
              <MaterialSelector fc={fc} setFc={setFc} fsy={fsy} setFsy={setFsy} />
            </InputGroup>
            <LoadCombinationSelector selectedId={selectedComboId} onSelect={setSelectedComboId} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputGroup title="Geometry & Support">
              <InputField label="Thickness (tw)" value={tw} onChange={setTw} unit="mm" />
              <InputField label="Length (Lw)" value={Lw} onChange={setLw} unit="mm" />
              <InputField label="Height (Hw)" value={Hw} onChange={setHw} unit="mm" />
              <div className="p-4 bg-gray-50 space-y-2 border-b border-line">
                <label className="text-[10px] font-mono uppercase opacity-40 tracking-widest">End Condition</label>
                <select 
                  value={endConditionId}
                  onChange={(e) => setEndConditionId(e.target.value)}
                  className="w-full bg-white border border-line p-2 text-[10px] font-mono uppercase tracking-wider focus:border-accent outline-none transition-colors"
                >
                  {COLUMN_END_CONDITIONS.map(ec => (
                    <option key={ec.id} value={ec.id}>{ec.label}</option>
                  ))}
                </select>
              </div>
            </InputGroup>

            <InputGroup title="Reinforcement">
              <InputField label="Vert. Bar Diam" value={barDiamV} onChange={setBarDiamV} unit="mm" />
              <InputField label="Vert. Spacing" value={barSpacingV} onChange={setBarSpacingV} unit="mm" />
              <InputField label="Horiz. Bar Diam" value={barDiamH} onChange={setBarDiamH} unit="mm" />
              <InputField label="Horiz. Spacing" value={barSpacingH} onChange={setBarSpacingH} unit="mm" />
            </InputGroup>
          </div>

          <InputGroup title="Design Loads (AS 1170)">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <InputField label="Dead (G)" value={gLoad} onChange={setGLoad} unit="kN" />
              <InputField label="Live (Q)" value={qLoad} onChange={setQLoad} unit="kN" />
              <InputField label="Wind (Wu)" value={wLoad} onChange={setWLoad} unit="kN" />
              <InputField label="Seismic (Eu)" value={eLoad} onChange={setELoad} unit="kN" />
              <InputField label="Factored Moment (M*)" value={mStar} onChange={setMStar} unit="kNm" />
              <InputField label="Factored Shear (V*)" value={vStar} onChange={setVStar} unit="kN" />
              <InputField label="Factored Axial (N*)" value={nStar.toFixed(0)} onChange={() => {}} unit="kN" description="Total factored axial load" />
            </div>
          </InputGroup>

          {/* Visualization */}
          <div className="brutal-card p-8 bg-white bg-grid">
            <h4 className="text-[10px] font-mono uppercase opacity-40 mb-8 tracking-[0.2em]">C&T Method Visualization</h4>
            <div className="relative h-56 bg-white border border-line shadow-[8px_8px_0px_0px_rgba(26,26,26,0.05)]">
              <div className="absolute inset-0 flex">
                <div className="flex-1 border-r border-dashed border-line flex flex-col items-center justify-center bg-blue-50/20">
                  <div className="text-[8px] font-mono font-bold text-blue-600 mb-4 tracking-widest uppercase opacity-60">Tension Zone</div>
                  <div className="h-16 w-0.5 bg-blue-500 relative">
                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t border-l border-blue-500 rotate-45" />
                  </div>
                  <div className="text-[10px] font-mono mt-4 font-bold text-blue-700">{calculations.T.toFixed(0)} kN</div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center bg-red-50/20">
                  <div className="text-[8px] font-mono font-bold text-red-600 mb-4 tracking-widest uppercase opacity-60">Compression Zone</div>
                  <div className="h-16 w-0.5 bg-red-500 relative">
                    <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b border-r border-red-500 rotate-45" />
                  </div>
                  <div className="text-[10px] font-mono mt-4 font-bold text-red-700">{calculations.C.toFixed(0)} kN</div>
                </div>
              </div>
              {calculations.boundary.needsBoundary && (
                <>
                  <div className="absolute left-0 top-0 bottom-0 w-12 bg-ink/5 border-r border-line" />
                  <div className="absolute right-0 top-0 bottom-0 w-12 bg-ink/5 border-l border-line" />
                </>
              )}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <div className="w-20 h-4 border-t border-r border-ink rounded-tr-full opacity-20" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">Design Moment M*</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <InputGroup title="C&T Analysis">
            <ResultRow label="Tension (T*)" value={calculations.T.toFixed(0)} unit="kN" />
            <ResultRow label="Compression (C*)" value={calculations.C.toFixed(0)} unit="kN" />
            <ResultRow label="Req. Vertical (Ast)" value={calculations.Ast_req.toFixed(0)} unit="mm²" />
          </InputGroup>

          <InputGroup title="Boundary Elements">
            <ResultRow label="Stress Level" value={calculations.boundary.stress.toFixed(2)} unit="MPa" />
            <ResultRow label="Required?" value={calculations.boundary.needsBoundary ? 'YES' : 'NO'} status={calculations.boundary.needsBoundary ? 'fail' : 'pass'} />
            {calculations.boundary.needsBoundary && (
              <ResultRow label="Min Length" value={calculations.boundary.boundaryLength.toFixed(0)} unit="mm" />
            )}
            <div className="mt-4 p-4 bg-accent/5 border-t border-accent/10 text-[10px] font-mono">
              <span className="opacity-40 uppercase tracking-widest">Effective Height (He):</span>
              <span className="ml-2 font-bold">{He.toFixed(0)} mm</span>
            </div>
          </InputGroup>

          <InputGroup title="Shear Capacity">
            <ResultRow label="Concrete (Vuc)" value={calculations.Vuc.toFixed(0)} unit="kN" />
            <ResultRow label="Req. Horiz. (Ash)" value={calculations.Ash_req.toFixed(0)} unit="mm²/m" />
            <ResultRow label="Shear Status" value={calculations.isSafeShear ? 'Pass' : 'Fail'} status={calculations.isSafeShear ? 'pass' : 'fail'} />
          </InputGroup>

          <SeismicDetailing requirements={seismic} />

          <div className="p-6 bg-ink text-white rounded-sm space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">
              <Info size={12} />
              <span>Design Notes</span>
            </div>
            <p className="text-[10px] font-mono leading-relaxed opacity-80">
              C&T method assumes linear stress distribution. Boundary elements required if extreme fiber stress exceeds 0.15fc (Clause 11.2.2).
              Shear capacity calculated per Clause 11.6.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WallCalculator;
