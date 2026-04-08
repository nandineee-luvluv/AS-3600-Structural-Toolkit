import React, { useState, useMemo, useEffect } from 'react';
import { InputGroup, InputField, ResultRow } from '../ui/InputGrid';
import { 
  calculateFlexuralCapacity, 
  checkSlabDeflection, 
  calculatePunchingShear, 
  validateInput, 
  LOAD_COMBINATIONS,
  BEAM_END_CONDITIONS
} from '../../lib/as3600';
import { Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { MaterialSelector } from '../ui/MaterialSelector';
import { LoadCombinationSelector } from '../ui/LoadCombinationSelector';
import { ExportActions } from '../ui/ExportActions';
import { useHistory } from '../../contexts/HistoryContext';
import { cn } from '../../lib/utils';

const SlabCalculator: React.FC = () => {
  const { addToHistory } = useHistory();
  // Section Geometry
  const [h, setH] = useState(200);
  const [cover, setCover] = useState(25);
  const [Lx, setLx] = useState(4000); // Short span
  const [Ly, setLy] = useState(6000); // Long span
  const [endConditionId, setEndConditionId] = useState('simply-supported');

  // Reinforcement
  const [barDiam, setBarDiam] = useState(12);
  const [barSpacingX, setBarSpacingX] = useState(200);
  const [barSpacingY, setBarSpacingY] = useState(300);

  // Materials
  const [fc, setFc] = useState(32);
  const [fsy, setFsy] = useState(500);

  // Loads
  const [gLoad, setGLoad] = useState(5); // kPa (Dead)
  const [qLoad, setQLoad] = useState(3); // kPa (Live)
  const [wLoad, setWLoad] = useState(0); // kPa (Wind)
  const [eLoad, setELoad] = useState(0); // kPa (Seismic)
  const [vStarPunch, setVStarPunch] = useState(150); // kN (punching shear)
  const [selectedComboId, setSelectedComboId] = useState('1.2G_1.5Q');

  // Validation
  const errors = useMemo(() => {
    return [
      validateInput(h, 100, 500, 'Thickness (h)'),
      validateInput(Lx, 1000, 15000, 'Span Lx'),
      validateInput(fc, 20, 100, "Concrete f'c"),
    ].filter(e => e !== null) as string[];
  }, [h, Lx, fc]);

  // Derived Values
  const combo = LOAD_COMBINATIONS.find(c => c.id === selectedComboId)!;
  const endCondition = BEAM_END_CONDITIONS.find(ec => ec.id === endConditionId)!;
  
  const qStar = gLoad * combo.factors.G + qLoad * combo.factors.Q + wLoad * combo.factors.W + eLoad * combo.factors.E;

  const d = h - cover - barDiam / 2;
  const AstX = (1000 / barSpacingX) * (Math.PI * Math.pow(barDiam, 2)) / 4;
  const AstY = (1000 / barSpacingY) * (Math.PI * Math.pow(barDiam, 2)) / 4;

  const mxStar = endCondition.k_moment * qStar * Math.pow(Lx/1000, 2);

  const flexureX = useMemo(() => {
    return calculateFlexuralCapacity(
      { b: 1000, d, h, Ast: AstX },
      { fc, fsy, Es: 200000 }
    );
  }, [d, h, AstX, fc, fsy]);

  const deflection = useMemo(() => {
    return checkSlabDeflection(Lx, d, endConditionId !== 'simply-supported');
  }, [Lx, d, endConditionId]);

  const punching = useMemo(() => {
    const u = 4 * (500 + d); // Assume 500x500 column
    return calculatePunchingShear(h, d, fc, u, vStarPunch);
  }, [h, d, fc, vStarPunch]);

  const statusX = flexureX.phiMu >= mxStar ? 'pass' : 'fail';
  const statusDeflection = deflection.isSafe ? 'pass' : 'fail';
  const statusPunching = punching.isSafe ? 'pass' : 'fail';
  const flexureStatus = statusX;

  // History Tracking
  useEffect(() => {
    if (errors.length > 0) return;
    const timer = setTimeout(() => {
      addToHistory({
        type: 'Slab Design',
        title: `${h}mm Slab - ${endCondition.label}`,
        inputs: { h, Lx, fc, fsy, qStar, endCondition: endCondition.label },
        results: { phiMu: flexureX.phiMu, deflectionRatio: deflection.ratio, punchingCapacity: punching.phiVuo }
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [h, Lx, fc, fsy, barSpacingX, qStar, endConditionId]);

  const exportInputs = [
    { label: 'Thickness (h)', value: h, unit: 'mm' },
    { label: 'Span (Lx)', value: Lx, unit: 'mm' },
    { label: 'End Condition', value: endCondition.label },
    { label: 'Concrete Grade (fc)', value: fc, unit: 'MPa' },
    { label: 'Design Load (q*)', value: qStar.toFixed(1), unit: 'kPa' },
  ];

  const exportResults = [
    { label: 'Flexural Capacity (phiMu)', value: flexureX.phiMu.toFixed(1), unit: 'kNm/m', status: statusX },
    { label: 'Span/Depth Ratio', value: deflection.ratio.toFixed(1), status: statusDeflection },
    { label: 'Punching Capacity', value: punching.phiVuo.toFixed(0), unit: 'kN', status: statusPunching },
  ];

  const procedure = `
# AS 3600 Slab Design Procedure (AS 1170 Loads)
q_star = g*G + q*Q + w*W + e*E
m_star = k_moment * q_star * Lx^2
d = h - cover - bar_diam / 2
ast = (1000 / spacing) * (3.14159 * bar_diam**2 / 4)
alpha2 = max(0.67, 0.85 - 0.0015 * fc)
gamma = max(0.67, 0.97 - 0.0025 * fc)
ku = (ast * fsy) / (alpha2 * fc * 1000 * gamma * d)
mu = ast * fsy * (d - (gamma * ku * d) / 2) * 1e-6
phi_mu = 0.85 * mu
print(f"Slab Capacity: {phi_mu:.2f} kNm/m")
  `;

  return (
    <div className="space-y-12">
      <header className="flex items-end justify-between border-b border-line pb-8">
        <div>
          <h2 className="text-4xl font-serif font-bold italic tracking-tight text-ink">Slab Design</h2>
          <p className="text-[10px] font-mono opacity-40 uppercase tracking-[0.3em] mt-2">One-Way Reinforced Concrete Slab | Per Meter Width</p>
        </div>
        <div className="flex items-center gap-4">
          <ExportActions 
            title="Slab Design Report" 
            inputs={exportInputs} 
            results={exportResults} 
            procedure={procedure}
            filename={`slab_${h}mm`}
          />
          <div className={cn(
            "px-4 py-2 border border-ink shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]",
            flexureStatus === 'pass' ? 'bg-green-50' : 'bg-red-50'
          )}>
            <div className="text-[8px] font-mono uppercase opacity-40 leading-none mb-1">Flexure</div>
            <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wider">
              {flexureStatus === 'pass' ? <CheckCircle2 size={12} className="text-green-600" /> : <XCircle size={12} className="text-red-600" />}
              {flexureStatus}
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
              <InputField label="Thickness (h)" value={h} onChange={setH} unit="mm" />
              <InputField label="Short Span (Lx)" value={Lx} onChange={setLx} unit="mm" />
              <InputField label="Long Span (Ly)" value={Ly} onChange={setLy} unit="mm" />
              <div className="p-4 bg-gray-50 space-y-2 border-b border-line">
                <label className="text-[10px] font-mono uppercase opacity-40 tracking-widest">End Condition</label>
                <select 
                  value={endConditionId}
                  onChange={(e) => setEndConditionId(e.target.value)}
                  className="w-full bg-white border border-line p-2 text-[10px] font-mono uppercase tracking-wider focus:border-accent outline-none transition-colors"
                >
                  {BEAM_END_CONDITIONS.map(ec => (
                    <option key={ec.id} value={ec.id}>{ec.label}</option>
                  ))}
                </select>
              </div>
              <InputField label="Concrete Cover" value={cover} onChange={setCover} unit="mm" />
            </InputGroup>

            <InputGroup title="Reinforcement">
              <InputField label="Bar Diameter" value={barDiam} onChange={setBarDiam} unit="mm" />
              <InputField label="Spacing X" value={barSpacingX} onChange={setBarSpacingX} unit="mm" />
              <InputField label="Spacing Y" value={barSpacingY} onChange={setBarSpacingY} unit="mm" />
            </InputGroup>
          </div>

          <InputGroup title="Design Loads (AS 1170)">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <InputField label="Dead (G)" value={gLoad} onChange={setGLoad} unit="kPa" />
              <InputField label="Live (Q)" value={qLoad} onChange={setQLoad} unit="kPa" />
              <InputField label="Wind (Wu)" value={wLoad} onChange={setWLoad} unit="kPa" />
              <InputField label="Seismic (Eu)" value={eLoad} onChange={setELoad} unit="kPa" />
              <InputField label="Factored Load (q*)" value={qStar.toFixed(1)} onChange={() => {}} unit="kPa" description="Total factored load" />
              <InputField label="Punching Shear (V*)" value={vStarPunch} onChange={setVStarPunch} unit="kN" />
            </div>
          </InputGroup>

          {/* Visualization */}
          <div className="brutal-card p-12 flex flex-col items-center gap-8 bg-white bg-grid">
            <div 
              className="border-2 border-ink relative bg-white shadow-[8px_8px_0px_0px_rgba(26,26,26,0.05)]"
              style={{ width: 400, height: h/2 }}
            >
              <div className="absolute bottom-4 left-0 right-0 flex justify-around px-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-ink/40" />
                ))}
              </div>
              <div className="absolute -left-16 top-0 bottom-0 flex items-center">
                <span className="text-[10px] font-mono -rotate-90 uppercase tracking-widest opacity-40">{h}mm</span>
              </div>
              <div className="absolute -bottom-10 left-0 right-0 flex justify-center">
                <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">1000mm (Unit Width)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-8">
          <InputGroup title="Flexural Capacity (X-Dir)">
            <ResultRow label="Design Moment (Mx*)" value={mxStar.toFixed(1)} unit="kNm/m" />
            <ResultRow label="Capacity (φMu)" value={flexureX.phiMu.toFixed(1)} unit="kNm/m" status={statusX} />
            <ResultRow label="Steel Area (Ast)" value={AstX.toFixed(0)} unit="mm²/m" />
            {(endConditionId === 'fixed-fixed' || endConditionId === 'propped-cantilever') && (
              <div className="mt-4 p-4 bg-accent/5 border-t border-accent/10 text-[10px] font-mono space-y-2">
                <p className="font-bold uppercase text-accent tracking-widest">Multiple Sections Needed</p>
                <div className="flex justify-between opacity-60">
                  <span>Support Moment:</span>
                  <span className="font-bold">{(mxStar).toFixed(1)} kNm/m</span>
                </div>
                <div className="flex justify-between opacity-60">
                  <span>Midspan Moment:</span>
                  <span className="font-bold">{(endConditionId === 'fixed-fixed' ? mxStar * 0.5 : mxStar * 0.56).toFixed(1)} kNm/m</span>
                </div>
              </div>
            )}
          </InputGroup>

          <InputGroup title="Serviceability & Shear">
            <ResultRow label="Span/Depth Ratio" value={deflection.ratio.toFixed(1)} status={statusDeflection} />
            <ResultRow label="Ratio Limit" value={deflection.limit.toFixed(1)} />
            <ResultRow label="Punching Capacity" value={punching.phiVuo.toFixed(0)} unit="kN" status={statusPunching} />
          </InputGroup>

          <InputGroup title="Reinforcement Limits">
            <ResultRow label="Min Reinforcement" value={AstX >= 0.002 * 1000 * h ? 'Pass' : 'Fail'} status={AstX >= 0.002 * 1000 * h ? 'pass' : 'fail'} />
            <ResultRow label="Max Spacing (3h)" value={barSpacingX <= Math.min(3 * h, 500) ? 'Pass' : 'Fail'} status={barSpacingX <= Math.min(3 * h, 500) ? 'pass' : 'fail'} />
          </InputGroup>

          <div className="p-6 bg-ink text-white rounded-sm space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">
              <Info size={12} />
              <span>Design Notes</span>
            </div>
            <p className="text-[10px] font-mono leading-relaxed opacity-80">
              One-way slab behavior assumed. Deflection check uses simplified span-to-depth ratio (Clause 9.4.4.1).
              Punching shear assumes a critical perimeter at d/2 from column face.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlabCalculator;
