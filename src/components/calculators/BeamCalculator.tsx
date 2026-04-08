import React, { useState, useMemo, useEffect } from 'react';
import { InputGroup, InputField, ResultRow } from '../ui/InputGrid';
import { 
  calculateFlexuralCapacity, 
  calculateShearCapacity, 
  calculateRequiredBeamReinforcement, 
  calculateSeismicDetailing, 
  validateInput, 
  LOAD_COMBINATIONS,
  BEAM_END_CONDITIONS
} from '../../lib/as3600';
import { Info, AlertTriangle, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { MaterialSelector } from '../ui/MaterialSelector';
import { LoadCombinationSelector } from '../ui/LoadCombinationSelector';
import { SeismicDetailing } from '../ui/SeismicDetailing';
import { ExportActions } from '../ui/ExportActions';
import { useHistory } from '../../contexts/HistoryContext';
import { cn } from '../../lib/utils';

const BeamCalculator: React.FC = () => {
  const { addToHistory } = useHistory();
  // Section Geometry
  const [b, setB] = useState(300);
  const [h, setH] = useState(600);
  const [L, setL] = useState(6000); // Span in mm
  const [cover, setCover] = useState(40);
  const [barDiam, setBarDiam] = useState(20);
  const [compBarDiam, setCompBarDiam] = useState(16);

  // Reinforcement
  const [nBars, setNBars] = useState(3);
  const [nCompBars, setNCompBars] = useState(0);
  const [nShearLegs, setNShearLegs] = useState(2);
  const [shearBarDiam, setShearBarDiam] = useState(10);
  const [shearSpacing, setShearSpacing] = useState(200);
  const [reinforcementMode, setReinforcementMode] = useState<'singly' | 'doubly'>('singly');

  // End Conditions
  const [endConditionId, setEndConditionId] = useState('simply-supported');

  // Materials
  const [fc, setFc] = useState(32);
  const [fsy, setFsy] = useState(500);

  // Loads
  const [gLoad, setGLoad] = useState(20); // Dead load (kN/m)
  const [qLoad, setQLoad] = useState(10); // Live load (kN/m)
  const [wLoad, setWLoad] = useState(0); // Wind load (kN/m)
  const [eLoad, setELoad] = useState(0); // Seismic load (kN/m)
  const [selectedComboId, setSelectedComboId] = useState('1.2G_1.5Q');

  // Validation
  const errors = useMemo(() => {
    return [
      validateInput(b, 200, 1000, 'Width (b)'),
      validateInput(h, 300, 2000, 'Height (h)'),
      validateInput(L, 1000, 20000, 'Span (L)'),
      validateInput(cover, 20, 100, 'Cover'),
      validateInput(fc, 20, 100, "Concrete f'c"),
      validateInput(fsy, 250, 500, 'Steel fsy'),
    ].filter(e => e !== null) as string[];
  }, [b, h, L, cover, fc, fsy]);

  // Derived Values
  const combo = LOAD_COMBINATIONS.find(c => c.id === selectedComboId)!;
  const endCondition = BEAM_END_CONDITIONS.find(ec => ec.id === endConditionId)!;
  
  const wStar = gLoad * combo.factors.G + qLoad * combo.factors.Q + wLoad * combo.factors.W + eLoad * combo.factors.E;
  const mStar = endCondition.k_moment * wStar * Math.pow(L / 1000, 2);
  const vStar = endCondition.k_shear * wStar * (L / 1000);

  const d = h - cover - shearBarDiam - barDiam / 2;
  const dc = cover + shearBarDiam + compBarDiam / 2;
  const Ast = nBars * (Math.PI * Math.pow(barDiam, 2)) / 4;
  const Asc = nCompBars * (Math.PI * Math.pow(compBarDiam, 2)) / 4;
  const Asv = nShearLegs * (Math.PI * Math.pow(shearBarDiam, 2)) / 4;

  const flexure = useMemo(() => {
    return calculateFlexuralCapacity(
      { b, d, h, Ast, Asc, dc },
      { fc, fsy, Es: 200000 }
    );
  }, [b, d, h, Ast, Asc, dc, fc, fsy]);

  const required = useMemo(() => {
    const req = calculateRequiredBeamReinforcement(b, d, mStar, { fc, fsy, Es: 200000 });
    if (reinforcementMode === 'singly') return { ...req, Asc_req: 0, isDoublyRequired: false };
    if (reinforcementMode === 'doubly') return { ...req, isDoublyRequired: true };
    return req;
  }, [b, d, mStar, fc, fsy, reinforcementMode]);

  const shear = useMemo(() => {
    return calculateShearCapacity(
      { b, d, h, Ast },
      { fc, fsy, Es: 200000 },
      Asv,
      shearSpacing
    );
  }, [b, d, h, Ast, fc, fsy, Asv, shearSpacing]);

  const seismic = useMemo(() => {
    return calculateSeismicDetailing('beam', { b, h, d, db: barDiam, ds: shearBarDiam, s: shearSpacing, fc });
  }, [b, h, d, barDiam, shearBarDiam, shearSpacing, fc]);

  const flexureStatus = flexure.phiMu >= mStar ? 'pass' : 'fail';
  const shearStatus = shear.phiVu >= vStar ? 'pass' : 'fail';
  const ductilityStatus = flexure.isDuctile ? 'pass' : 'fail';

  // Lock compression bars to 0 if singly reinforced
  useEffect(() => {
    if (reinforcementMode === 'singly') {
      setNCompBars(0);
    }
  }, [reinforcementMode]);

  const modeWarning = reinforcementMode === 'singly' && required.isDoublyRequired 
    ? "Singly reinforced section insufficient. Double reinforcement recommended."
    : null;

  // History Tracking
  useEffect(() => {
    if (errors.length > 0) return;
    const timer = setTimeout(() => {
      addToHistory({
        type: 'Beam Design',
        title: `${b}x${h} Beam - ${endCondition.label}`,
        inputs: { b, h, fc, fsy, mStar, endCondition: endCondition.label },
        results: { phiMu: flexure.phiMu, ku: flexure.ku, phiVu: shear.phiVu }
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [b, h, fc, fsy, nBars, barDiam, mStar, endConditionId]);

  const exportInputs = [
    { label: 'Width (b)', value: b, unit: 'mm' },
    { label: 'Height (h)', value: h, unit: 'mm' },
    { label: 'Span (L)', value: L, unit: 'mm' },
    { label: 'End Condition', value: endCondition.label },
    { label: 'Concrete Grade (fc)', value: fc, unit: 'MPa' },
    { label: 'Design Moment (M*)', value: mStar.toFixed(1), unit: 'kNm' },
  ];

  const exportResults = [
    { label: 'Capacity (phiMu)', value: flexure.phiMu.toFixed(1), unit: 'kNm', status: flexureStatus },
    { label: 'Neutral Axis (ku)', value: flexure.ku.toFixed(3), status: ductilityStatus },
    { label: 'Shear Capacity (phiVu)', value: shear.phiVu.toFixed(1), unit: 'kN', status: shearStatus },
  ];

  const procedure = `
# AS 3600 Beam Design Procedure (AS 1170 Loads)
w_star = g*G + q*Q + w*W + e*E
m_star = k_moment * w_star * L^2
v_star = k_shear * w_star * L
alpha2 = max(0.67, 0.85 - 0.0015 * fc)
gamma = max(0.67, 0.97 - 0.0025 * fc)
ku = (ast * fsy) / (alpha2 * fc * b * gamma * d)
mu = ast * fsy * (d - (gamma * ku * d) / 2) * 1e-6
phi_mu = 0.85 * mu
print(f"Design Moment: {m_star:.2f} kNm, Capacity: {phi_mu:.2f} kNm")
  `;

  return (
    <div className="space-y-12">
      <header className="flex items-end justify-between border-b border-line pb-8">
        <div>
          <h2 className="text-4xl font-serif font-bold italic tracking-tight text-ink">Beam Design</h2>
          <p className="text-[10px] font-mono opacity-40 uppercase tracking-[0.3em] mt-2">Rectangular Reinforced Concrete Section | AS 3600:2018</p>
        </div>
        <div className="flex items-center gap-4">
          <ExportActions 
            title="Beam Design Report" 
            inputs={exportInputs} 
            results={exportResults} 
            procedure={procedure}
            filename={`beam_${b}x${h}`}
          />
          <div className="flex gap-2">
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
            <div className={cn(
              "px-4 py-2 border border-ink shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]",
              ductilityStatus === 'pass' ? 'bg-green-50' : 'bg-red-50'
            )}>
              <div className="text-[8px] font-mono uppercase opacity-40 leading-none mb-1">Ductility</div>
              <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wider">
                {ductilityStatus === 'pass' ? <ShieldCheck size={12} className="text-green-600" /> : <AlertTriangle size={12} className="text-yellow-600" />}
                {ductilityStatus}
              </div>
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
        {/* Inputs */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputGroup title="Materials Database">
              <MaterialSelector fc={fc} setFc={setFc} fsy={fsy} setFsy={setFsy} />
            </InputGroup>
            <LoadCombinationSelector selectedId={selectedComboId} onSelect={setSelectedComboId} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputGroup title="Geometry & Support">
              <InputField label="Width (b)" value={b} onChange={setB} unit="mm" tooltip="Width of the rectangular beam section." />
              <InputField label="Height (h)" value={h} onChange={setH} unit="mm" tooltip="Overall depth of the beam section." />
              <InputField label="Span (L)" value={L} onChange={setL} unit="mm" tooltip="Clear span length of the beam." />
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
              <InputField label="Concrete Cover" value={cover} onChange={setCover} unit="mm" tooltip="Clear cover to reinforcement." />
            </InputGroup>

            <InputGroup title="Reinforcement Mode">
              <div className="p-4 bg-gray-50 space-y-4">
                <div className="flex gap-1">
                  {(['singly', 'doubly'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setReinforcementMode(mode)}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-mono uppercase tracking-widest border border-line transition-all",
                        reinforcementMode === mode ? "bg-ink text-white border-ink shadow-md" : "bg-white text-ink/40 hover:bg-ink/5"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Tensile Bars" value={nBars} onChange={setNBars} unit="qty" />
                  <InputField label="Bar Diam" value={barDiam} onChange={setBarDiam} unit="mm" />
                  <InputField label="Comp. Bars" value={nCompBars} onChange={setNCompBars} unit="qty" disabled={reinforcementMode === 'singly'} />
                  <InputField label="Comp. Diam" value={compBarDiam} onChange={setCompBarDiam} unit="mm" disabled={reinforcementMode === 'singly'} />
                </div>
              </div>
            </InputGroup>
          </div>

          <InputGroup title="Design Loads (AS 1170)">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <InputField label="Dead (G)" value={gLoad} onChange={setGLoad} unit="kN/m" />
              <InputField label="Live (Q)" value={qLoad} onChange={setQLoad} unit="kN/m" />
              <InputField label="Wind (Wu)" value={wLoad} onChange={setWLoad} unit="kN/m" />
              <InputField label="Seismic (Eu)" value={eLoad} onChange={setELoad} unit="kN/m" />
              <InputField label="Factored Load (w*)" value={wStar.toFixed(2)} onChange={() => {}} unit="kN/m" description="Factored distributed load" />
              <InputField label="Factored Moment (M*)" value={mStar.toFixed(1)} onChange={() => {}} unit="kNm" description="At critical section" />
            </div>
          </InputGroup>

          {/* Visualization */}
          <div className="brutal-card p-12 flex flex-col items-center gap-12 bg-white bg-grid">
            <div className="flex items-center gap-4 w-full max-w-md">
              <div className="h-4 w-4 bg-ink rounded-full shrink-0 shadow-lg" />
              <div className="h-1 bg-ink flex-1 relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-mono uppercase tracking-[0.2em] bg-white px-2 border border-line">Span {L}mm</div>
                {endConditionId === 'fixed-fixed' && (
                  <div className="absolute -bottom-8 left-0 right-0 flex justify-between text-[8px] font-mono opacity-30 tracking-widest">
                    <span>FIXED</span>
                    <span>FIXED</span>
                  </div>
                )}
              </div>
              <div className="h-4 w-4 bg-ink rounded-full shrink-0 shadow-lg" />
            </div>
            
            <div 
              className="border-2 border-ink relative bg-white shadow-[8px_8px_0px_0px_rgba(26,26,26,0.05)]"
              style={{ width: b/2, height: h/2 }}
            >
              <div className="absolute bottom-4 left-0 right-0 flex justify-around px-2">
                {Array.from({ length: nBars }).map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-ink shadow-sm" />
                ))}
              </div>
              {nCompBars > 0 && (
                <div className="absolute top-4 left-0 right-0 flex justify-around px-2">
                  {Array.from({ length: nCompBars }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-ink/30" />
                  ))}
                </div>
              )}
              <div className="absolute inset-2 border border-ink/10 rounded-sm pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-8">
          {modeWarning && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 text-[10px] font-mono flex gap-3 leading-relaxed">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              {modeWarning}
            </div>
          )}

          <InputGroup title="Required Steel">
            <ResultRow label="Req. Tensile (Ast)" value={required.Ast_req.toFixed(0)} unit="mm²" />
            <ResultRow label="Req. Comp. (Asc)" value={required.Asc_req.toFixed(0)} unit="mm²" />
          </InputGroup>

          <InputGroup title="Flexural Capacity">
            <ResultRow label="Capacity (φMu)" value={flexure.phiMu.toFixed(1)} unit="kNm" status={flexureStatus} />
            <ResultRow label="Neutral Axis (ku)" value={flexure.ku.toFixed(3)} status={ductilityStatus} />
            {(endConditionId === 'fixed-fixed' || endConditionId === 'propped-cantilever') && (
              <div className="mt-4 p-4 bg-accent/5 border-t border-accent/10 text-[10px] font-mono space-y-2">
                <p className="font-bold uppercase text-accent tracking-widest">Multiple Sections Needed</p>
                <div className="flex justify-between opacity-60">
                  <span>Support Moment:</span>
                  <span className="font-bold">{(mStar).toFixed(1)} kNm</span>
                </div>
                <div className="flex justify-between opacity-60">
                  <span>Midspan Moment:</span>
                  <span className="font-bold">{(endConditionId === 'fixed-fixed' ? mStar * 0.5 : mStar * 0.56).toFixed(1)} kNm</span>
                </div>
                <p className="mt-3 opacity-40 italic leading-relaxed">Design reinforcement for both support (top) and midspan (bottom) critical sections.</p>
              </div>
            )}
          </InputGroup>

          <InputGroup title="Shear Capacity">
            <InputField label="Factored Shear (V*)" value={vStar.toFixed(1)} onChange={() => {}} unit="kN" />
            <ResultRow label="Capacity (φVu)" value={shear.phiVu.toFixed(1)} unit="kN" status={shearStatus} />
          </InputGroup>

          <SeismicDetailing requirements={seismic} />

          <div className="p-6 bg-ink text-white rounded-sm space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">
              <Info size={12} />
              <span>Design Notes</span>
            </div>
            <p className="text-[10px] font-mono leading-relaxed opacity-80">
              Flexural capacity calculated using rectangular stress block (Clause 8.1.3). 
              Ductility check ensures ku ≤ 0.36 for under-reinforced behavior.
              Shear capacity includes concrete and steel contributions (Clause 8.2).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeamCalculator;
