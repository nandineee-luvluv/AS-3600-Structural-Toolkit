import React, { useState, useMemo, useEffect } from 'react';
import { InputGroup, InputField, ResultRow } from '../ui/InputGrid';
import { SectionLibraryManager } from '../SectionLibraryManager';
import { 
  calculateFlexuralCapacity, 
  calculateShearGeneralMethod, 
  calculateRequiredBeamReinforcement, 
  calculateSeismicDetailing, 
  getMinimumReinforcement,
  checkCrackControl,
  calculateDevelopmentLength,
  validateInput, 
  BEAM_END_CONDITIONS,
  SectionShape,
  REINFORCEMENT_TYPES,
  EXPOSURE_CLASSES,
  FIRE_RATINGS,
  getRequiredCover,
  checkNCCCompliance
} from '../../lib/as3600';
import { Info, AlertTriangle, CheckCircle2, XCircle, ShieldCheck, Layout } from 'lucide-react';
import { MaterialSelector } from '../ui/MaterialSelector';
import { LoadCombinationSelector } from '../ui/LoadCombinationSelector';
import { SeismicDetailing } from '../ui/SeismicDetailing';
import { ExportActions } from '../ui/ExportActions';
import { ComplianceInfo } from '../ui/ComplianceInfo';
import { useHistory } from '../../contexts/HistoryContext';
import { useLoadCombinations } from '../../contexts/LoadCombinationContext';
import { useSections } from '../../contexts/SectionContext';
import { useMaterials } from '../../contexts/MaterialContext';
import { cn } from '../../lib/utils';

const BeamCalculator: React.FC = () => {
  const { addToHistory } = useHistory();
  const { combinations } = useLoadCombinations();
  const { library } = useSections();
  const { customMaterials, addMaterial } = useMaterials();
  
  // Section Geometry
  const [shape, setShape] = useState<SectionShape>('rectangular');
  const [b, setB] = useState(300);
  const [h, setH] = useState(600);
  const [bf, setBf] = useState(600);
  const [tf, setTf] = useState(150);
  const [tw, setTw] = useState(200);
  const [b_top, setBTop] = useState(400);
  const [b_bottom, setBBottom] = useState(200);
  const [L, setL] = useState(6000); // Span in mm
  const [cover, setCover] = useState(40);
  const [barDiam, setBarDiam] = useState(20);
  const [compBarDiam, setCompBarDiam] = useState(16);

  // Reinforcement
  const [nBarsI, setNBarsI] = useState(3);
  const [nBarsMid, setNBarsMid] = useState(3);
  const [nBarsJ, setNBarsJ] = useState(3);
  const [nCompBarsI, setNCompBarsI] = useState(0);
  const [nCompBarsMid, setNCompBarsMid] = useState(0);
  const [nCompBarsJ, setNCompBarsJ] = useState(0);
  const [nShearLegs, setNShearLegs] = useState(2);
  const [shearBarDiam, setShearBarDiam] = useState(10);
  const [shearSpacingI, setShearSpacingI] = useState(150);
  const [shearSpacingMid, setShearSpacingMid] = useState(300);
  const [shearSpacingJ, setShearSpacingJ] = useState(150);
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
  const [selectedSectionId, setSelectedSectionId] = useState('');

  const [mStarI, setMStarI] = useState(0);
  const [mStarMid, setMStarMid] = useState(0);
  const [mStarJ, setMStarJ] = useState(0);
  const [vStarEnd, setVStarEnd] = useState(0);
  const [vStarMid, setVStarMid] = useState(0);

  const [activeZone, setActiveZone] = useState<'I' | 'Mid' | 'J'>('Mid');

  // NCC & Durability
  const [exposureClass, setExposureClass] = useState('A1');
  const [fireRating, setFireRating] = useState('60');

  // Auto-calculate loads when inputs change
  useEffect(() => {
    const combo = combinations.find(c => c.id === selectedComboId) || combinations[0];
    const wStar = gLoad * combo.factors.G + qLoad * combo.factors.Q + wLoad * combo.factors.W + eLoad * combo.factors.E;
    const endCondition = BEAM_END_CONDITIONS.find(ec => ec.id === endConditionId)!;
    
    const mid = endCondition.k_moment * wStar * Math.pow(L / 1000, 2);
    const end = endConditionId === 'simply-supported' ? 0 : -mid * 1.5;
    const vEnd = endCondition.k_shear * wStar * (L / 1000);
    
    setMStarMid(mid);
    setMStarI(end);
    setMStarJ(end);
    setVStarEnd(vEnd);
    setVStarMid(vEnd * 0.3);
  }, [gLoad, qLoad, wLoad, eLoad, selectedComboId, endConditionId, L, combinations]);

  const handleSectionSelect = (section: any) => {
    setShape(section.shape || 'rectangular');
    if (section.b) setB(section.b);
    if (section.h) setH(section.h);
    if (section.bf) setBf(section.bf);
    if (section.tf) setTf(section.tf);
    if (section.tw) setTw(section.tw);
    if (section.b_top) setBTop(section.b_top);
    if (section.b_bottom) setBBottom(section.b_bottom);
    if (section.L) setL(section.L);
    if (section.cover) setCover(section.cover);
  };

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
  const combo = combinations.find(c => c.id === selectedComboId) || combinations[0];
  const endCondition = BEAM_END_CONDITIONS.find(ec => ec.id === endConditionId)!;
  
  const wStar = gLoad * combo.factors.G + qLoad * combo.factors.Q + wLoad * combo.factors.W + eLoad * combo.factors.E;
  
  const d = h - cover - shearBarDiam - barDiam / 2;
  const dc = cover + shearBarDiam + compBarDiam / 2;
  
  const AstI = nBarsI * (Math.PI * Math.pow(barDiam, 2)) / 4;
  const AstMid = nBarsMid * (Math.PI * Math.pow(barDiam, 2)) / 4;
  const AstJ = nBarsJ * (Math.PI * Math.pow(barDiam, 2)) / 4;
  
  const AscI = nCompBarsI * (Math.PI * Math.pow(compBarDiam, 2)) / 4;
  const AscMid = nCompBarsMid * (Math.PI * Math.pow(compBarDiam, 2)) / 4;
  const AscJ = nCompBarsJ * (Math.PI * Math.pow(compBarDiam, 2)) / 4;
  const Asv = nShearLegs * (Math.PI * Math.pow(shearBarDiam, 2)) / 4;

  const effectiveB = useMemo(() => {
    if (shape === 't-beam' || shape === 'l-beam') return tw;
    if (shape === 'trapezoidal') return (b_top + b_bottom) / 2;
    return b;
  }, [shape, b, tw, b_top, b_bottom]);

  const flexureI = useMemo(() => {
    return calculateFlexuralCapacity(
      { shape, b, bf, tf, tw, b_top, b_bottom, d, h, Ast: AstI, Asc: AscI, dc },
      { fc, fsy, Es: 200000 }
    );
  }, [shape, b, bf, tf, tw, b_top, b_bottom, d, h, AstI, AscI, dc, fc, fsy]);

  const flexureMid = useMemo(() => {
    return calculateFlexuralCapacity(
      { shape, b, bf, tf, tw, b_top, b_bottom, d, h, Ast: AstMid, Asc: AscMid, dc },
      { fc, fsy, Es: 200000 }
    );
  }, [shape, b, bf, tf, tw, b_top, b_bottom, d, h, AstMid, AscMid, dc, fc, fsy]);

  const flexureJ = useMemo(() => {
    return calculateFlexuralCapacity(
      { shape, b, bf, tf, tw, b_top, b_bottom, d, h, Ast: AstJ, Asc: AscJ, dc },
      { fc, fsy, Es: 200000 }
    );
  }, [shape, b, bf, tf, tw, b_top, b_bottom, d, h, AstJ, AscJ, dc, fc, fsy]);

  const shearI = useMemo(() => {
    return calculateShearGeneralMethod(
      { shape, b, bf, tf, tw, b_top, b_bottom, d, h, Ast: AstI }, 
      { fc, fsy, Es: 200000 }, 
      { M_star: mStarI, V_star: vStarEnd },
      Asv, 
      shearSpacingI
    );
  }, [shape, b, bf, tf, tw, b_top, b_bottom, d, h, AstI, fc, fsy, mStarI, vStarEnd, Asv, shearSpacingI]);

  const shearMid = useMemo(() => {
    return calculateShearGeneralMethod(
      { shape, b, bf, tf, tw, b_top, b_bottom, d, h, Ast: AstMid }, 
      { fc, fsy, Es: 200000 }, 
      { M_star: mStarMid, V_star: vStarMid },
      Asv, 
      shearSpacingMid
    );
  }, [shape, b, bf, tf, tw, b_top, b_bottom, d, h, AstMid, fc, fsy, mStarMid, vStarMid, Asv, shearSpacingMid]);

  const shearJ = useMemo(() => {
    return calculateShearGeneralMethod(
      { shape, b, bf, tf, tw, b_top, b_bottom, d, h, Ast: AstJ }, 
      { fc, fsy, Es: 200000 }, 
      { M_star: mStarJ, V_star: vStarEnd },
      Asv, 
      shearSpacingJ
    );
  }, [shape, b, bf, tf, tw, b_top, b_bottom, d, h, AstJ, fc, fsy, mStarJ, vStarEnd, Asv, shearSpacingJ]);

  // Refined Checks
  const minAst = getMinimumReinforcement(effectiveB, h, fc, fsy);
  const isMinAstPass = AstMid >= minAst;

  const crackControl = useMemo(() => {
    // Simplified steel stress calculation (sigma_s = M* / (Ast * z))
    const z = 0.9 * d;
    const sigma_s = (Math.abs(mStarMid) * 1e6) / (AstMid * z);
    return checkCrackControl(barDiam, 1000 / nBarsMid, sigma_s, exposureClass);
  }, [mStarMid, AstMid, d, barDiam, nBarsMid, exposureClass]);

  const devLength = calculateDevelopmentLength(barDiam, fsy, fc);

  const flexureStatusI = flexureI.phiMu >= Math.abs(mStarI) ? 'pass' : 'fail';
  const flexureStatusMid = flexureMid.phiMu >= Math.abs(mStarMid) ? 'pass' : 'fail';
  const flexureStatusJ = flexureJ.phiMu >= Math.abs(mStarJ) ? 'pass' : 'fail';

  const shearStatusI = shearI.phiVu >= vStarEnd ? 'pass' : 'fail';
  const shearStatusMid = shearMid.phiVu >= vStarMid ? 'pass' : 'fail';
  const shearStatusJ = shearJ.phiVu >= vStarEnd ? 'pass' : 'fail';

  // NCC Compliance Calculations
  const requiredCover = getRequiredCover(exposureClass, fireRating);
  const isDurable = cover >= requiredCover;
  const minB = FIRE_RATINGS.find(f => f.id === fireRating)?.minB || 0;
  const isFireSafe = b >= minB;
  const isStructuralSafe = flexureStatusI === 'pass' && flexureStatusMid === 'pass' && flexureStatusJ === 'pass' && 
                           shearStatusI === 'pass' && shearStatusMid === 'pass' && shearStatusJ === 'pass';
  const isNCCCompliant = checkNCCCompliance({ isStructuralSafe, isFireSafe, isDurable });

  // Lock compression bars to 0 if singly reinforced
  useEffect(() => {
    if (reinforcementMode === 'singly') {
      setNCompBarsI(0);
      setNCompBarsMid(0);
      setNCompBarsJ(0);
    }
  }, [reinforcementMode]);

  const modeWarning = reinforcementMode === 'singly' && flexureMid.ku > 0.36 
    ? "Singly reinforced section insufficient. Double reinforcement recommended."
    : null;

  // History Tracking
  useEffect(() => {
    if (errors.length > 0) return;
    const timer = setTimeout(() => {
      addToHistory({
        type: 'Beam Design',
        title: `${b}x${h} Beam - ${endCondition.label}`,
        inputs: { b, h, fc, fsy, mStarMid, endCondition: endCondition.label },
        results: { phiMu: flexureMid.phiMu, ku: flexureMid.ku, phiVu: shearMid.phiVu }
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [b, h, fc, fsy, nBarsMid, barDiam, mStarMid, endConditionId, addToHistory, errors, endCondition.label, flexureMid.phiMu, flexureMid.ku, shearMid.phiVu]);

  const exportInputs = [
    { label: 'Width (b)', value: b, unit: 'mm' },
    { label: 'Height (h)', value: h, unit: 'mm' },
    { label: 'Span (L)', value: L, unit: 'mm' },
    { label: 'End Condition', value: endCondition.label },
    { label: 'Concrete Grade (fc)', value: fc, unit: 'MPa' },
    { label: 'Design Moment Mid (M*)', value: mStarMid.toFixed(1), unit: 'kNm' },
  ];

  const exportResults = [
    { 
      label: 'Capacity Mid (phiMu)', 
      value: flexureMid.phiMu.toFixed(1), 
      unit: 'kNm', 
      status: flexureStatusMid,
      clause: '8.1.3',
      equation: `\\phi M_u = ${flexureMid.phi.toFixed(2)} \\cdot A_{st} f_{sy} (d - \\gamma k_u d / 2)`
    },
    {
      label: 'Min Reinforcement',
      value: minAst.toFixed(0),
      unit: 'mm2',
      status: isMinAstPass ? 'pass' : 'fail',
      clause: '8.1.6.1',
      equation: 'A_{st,min} = 0.2 (h/d)^2 (f\'_{ct.f}/f_{sy}) b d'
    },
    {
      label: 'Crack Control',
      value: crackControl.isSafe ? 'PASS' : 'FAIL',
      status: crackControl.isSafe ? 'pass' : 'fail',
      clause: '8.6.2',
      description: `Max spacing: ${crackControl.maxSpacing}mm, Max bar: ${crackControl.maxBarDiam}mm`
    },
    {
      label: 'Dev. Length (Lsy.t)',
      value: devLength.toFixed(0),
      unit: 'mm',
      status: 'info',
      clause: '13.1.2'
    },
    { 
      label: 'Neutral Axis Mid (ku)', 
      value: flexureMid.ku.toFixed(3), 
      status: flexureMid.ku <= 0.36 ? 'pass' : 'fail',
      clause: '8.1.5',
      equation: 'k_u = (A_{st} f_{sy}) / (\\alpha_2 f\'_c b \\gamma d)'
    },
    { 
      label: 'Shear Capacity Mid (phiVu)', 
      value: shearMid.phiVu.toFixed(1), 
      unit: 'kN', 
      status: shearStatusMid,
      clause: '8.2.3',
      equation: '\\phi V_u = \\phi (V_{uc} + V_{us})'
    },
  ];

  const reinforcementType = REINFORCEMENT_TYPES.find(t => t.fsy === fsy)?.label || `${fsy} MPa Steel`;

  const procedure = `
# AS 3600 Beam Design Procedure (AS 1170 Loads)
Reinforcement: ${reinforcementType}
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
              flexureStatusMid === 'pass' ? 'bg-green-50' : 'bg-red-50'
            )}>
              <div className="text-[8px] font-mono uppercase opacity-40 leading-none mb-1">Flexure</div>
              <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wider">
                {flexureStatusMid === 'pass' ? <CheckCircle2 size={12} className="text-green-600" /> : <XCircle size={12} className="text-red-600" />}
                {flexureStatusMid}
              </div>
            </div>
            <div className={cn(
              "px-4 py-2 border border-ink shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]",
              flexureMid.ku <= 0.36 ? 'bg-green-50' : 'bg-red-50'
            )}>
              <div className="text-[8px] font-mono uppercase opacity-40 leading-none mb-1">Ductility</div>
              <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wider">
                {flexureMid.ku <= 0.36 ? <ShieldCheck size={12} className="text-green-600" /> : <AlertTriangle size={12} className="text-yellow-600" />}
                {flexureMid.ku <= 0.36 ? 'pass' : 'fail'}
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
            <div className="col-span-2">
              <SectionLibraryManager type="beams" onSelect={handleSectionSelect} />
            </div>
            <InputGroup title="Materials Database">
              <MaterialSelector 
                fc={fc} 
                setFc={setFc} 
                fsy={fsy} 
                setFsy={setFsy} 
                customMaterials={customMaterials}
                onAddCustomMaterial={(m) => addMaterial({ ...m, type: m.fc > 100 ? 'steel' : 'concrete' })}
              />
            </InputGroup>
            <LoadCombinationSelector selectedId={selectedComboId} onSelect={setSelectedComboId} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputGroup title="Geometry & Support">
              <div className="p-4 bg-gray-50 space-y-2 border-b border-line">
                <label className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Section Shape</label>
                <select 
                  value={shape}
                  onChange={(e) => setShape(e.target.value as SectionShape)}
                  className="w-full bg-white border border-line p-2 text-[10px] font-mono uppercase tracking-wider focus:border-accent outline-none transition-colors"
                >
                  <option value="rectangular">Rectangular</option>
                  <option value="t-beam">T-Beam</option>
                  <option value="l-beam">L-Beam</option>
                  <option value="trapezoidal">Trapezoidal</option>
                </select>
              </div>

              {shape === 'rectangular' && (
                <InputField label="Width (b)" value={b} onChange={setB} unit="mm" />
              )}
              {(shape === 't-beam' || shape === 'l-beam') && (
                <>
                  <InputField label="Flange Width (bf)" value={bf} onChange={setBf} unit="mm" />
                  <InputField label="Slab Thickness (tf)" value={tf} onChange={setTf} unit="mm" />
                  <InputField label="Web Width (tw)" value={tw} onChange={setTw} unit="mm" />
                </>
              )}
              {shape === 'trapezoidal' && (
                <>
                  <InputField label="Top Width (b_top)" value={b_top} onChange={setBTop} unit="mm" />
                  <InputField label="Bottom Width (b_bottom)" value={b_bottom} onChange={setBBottom} unit="mm" />
                </>
              )}

              <InputField label="Total Height (h)" value={h} onChange={setH} unit="mm" />
              <InputField label="Span (L)" value={L} onChange={setL} unit="mm" />
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
            </InputGroup>

            <InputGroup title="Design Parameters (NCC/AS)">
              <div className="p-4 bg-gray-50 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Exposure Classification</label>
                  <select 
                    value={exposureClass}
                    onChange={(e) => setExposureClass(e.target.value)}
                    className="w-full bg-white border border-line p-2 text-[10px] font-mono uppercase tracking-wider focus:border-accent outline-none transition-colors"
                  >
                    {EXPOSURE_CLASSES.map(ec => (
                      <option key={ec.id} value={ec.id}>{ec.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Fire Resistance Period (FRP)</label>
                  <select 
                    value={fireRating}
                    onChange={(e) => setFireRating(e.target.value)}
                    className="w-full bg-white border border-line p-2 text-[10px] font-mono uppercase tracking-wider focus:border-accent outline-none transition-colors"
                  >
                    {FIRE_RATINGS.map(fr => (
                      <option key={fr.id} value={fr.id}>{fr.label}</option>
                    ))}
                  </select>
                </div>
                <InputField label="Concrete Cover" value={cover} onChange={setCover} unit="mm" />
              </div>
            </InputGroup>

            <InputGroup title="Reinforcement Details">
              <div className="p-4 bg-gray-50 space-y-6">
                <div className="flex border border-ink bg-white">
                  {(['singly', 'doubly'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setReinforcementMode(mode)}
                      className={cn(
                        "flex-1 py-3 text-[10px] font-mono uppercase tracking-widest transition-all border-r border-line last:border-r-0",
                        reinforcementMode === mode ? "bg-ink text-white" : "text-ink/40 hover:bg-gray-50"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Bar Diam (db)" value={barDiam} onChange={setBarDiam} unit="mm" />
                    <InputField label="Stirrup Diam (ds)" value={shearBarDiam} onChange={setShearBarDiam} unit="mm" />
                    <InputField label="Comp. Diam" value={compBarDiam} onChange={setCompBarDiam} unit="mm" disabled={reinforcementMode === 'singly'} />
                  </div>

                  <div className="h-px bg-line opacity-10" />

                  <div className="space-y-0">
                    <div className="flex border border-ink bg-white">
                      {(['I', 'Mid', 'J'] as const).map(zone => (
                        <button
                          key={zone}
                          onClick={() => setActiveZone(zone)}
                          className={cn(
                            "flex-1 py-3 text-[10px] font-mono uppercase tracking-widest transition-all border-r border-line last:border-r-0",
                            activeZone === zone ? "bg-ink text-white" : "text-ink/40 hover:bg-gray-50"
                          )}
                        >
                          {zone === 'I' ? 'I-End' : zone === 'Mid' ? 'Middle' : 'J-End'}
                        </button>
                      ))}
                    </div>

                    <div className="bg-white border-x border-b border-line divide-y divide-line">
                      {activeZone === 'I' && (
                        <>
                          <InputField label="Tensile Bars" value={nBarsI} onChange={setNBarsI} unit="qty" />
                          <InputField label="Comp. Bars" value={nCompBarsI} onChange={setNCompBarsI} unit="qty" disabled={reinforcementMode === 'singly'} />
                          <InputField label="Stirrup Spacing" value={shearSpacingI} onChange={setShearSpacingI} unit="mm" />
                        </>
                      )}
                      {activeZone === 'Mid' && (
                        <>
                          <InputField label="Tensile Bars" value={nBarsMid} onChange={setNBarsMid} unit="qty" />
                          <InputField label="Comp. Bars" value={nCompBarsMid} onChange={setNCompBarsMid} unit="qty" disabled={reinforcementMode === 'singly'} />
                          <InputField label="Stirrup Spacing" value={shearSpacingMid} onChange={setShearSpacingMid} unit="mm" />
                        </>
                      )}
                      {activeZone === 'J' && (
                        <>
                          <InputField label="Tensile Bars" value={nBarsJ} onChange={setNBarsJ} unit="qty" />
                          <InputField label="Comp. Bars" value={nCompBarsJ} onChange={setNCompBarsJ} unit="qty" disabled={reinforcementMode === 'singly'} />
                          <InputField label="Stirrup Spacing" value={shearSpacingJ} onChange={setShearSpacingJ} unit="mm" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </InputGroup>
          </div>

          <InputGroup title="Design Loads (AS 1170)">
            <InputField label="Dead (G)" value={gLoad} onChange={setGLoad} unit="kN/m" />
            <InputField label="Live (Q)" value={qLoad} onChange={setQLoad} unit="kN/m" />
            <InputField label="Wind (Wu)" value={wLoad} onChange={setWLoad} unit="kN/m" />
            <InputField label="Seismic (Eu)" value={eLoad} onChange={setELoad} unit="kN/m" />
            <InputField label="Factored Load (w*)" value={wStar.toFixed(2)} onChange={() => {}} unit="kN/m" description="Factored distributed load" />
            <div className="grid grid-cols-3 gap-2 p-4 bg-gray-50 border-b border-line">
              <div className="space-y-1">
                <label className="text-[8px] font-mono uppercase opacity-40">M* I-End</label>
                <input type="number" value={mStarI.toFixed(1)} onChange={(e) => setMStarI(Number(e.target.value))} className="w-full bg-white border border-line p-1 text-[10px] font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-mono uppercase opacity-40">M* Middle</label>
                <input type="number" value={mStarMid.toFixed(1)} onChange={(e) => setMStarMid(Number(e.target.value))} className="w-full bg-white border border-line p-1 text-[10px] font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-mono uppercase opacity-40">M* J-End</label>
                <input type="number" value={mStarJ.toFixed(1)} onChange={(e) => setMStarJ(Number(e.target.value))} className="w-full bg-white border border-line p-1 text-[10px] font-mono" />
              </div>
            </div>
          </InputGroup>

          {/* Visualization */}
          <div className="brutal-card p-8 bg-white bg-grid space-y-8">
            <div className="flex flex-col items-center gap-8">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40 self-start">Longitudinal Section</h3>
              <div className="w-full h-32 relative border-2 border-ink bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,0.1)] overflow-hidden">
                {/* Zones */}
                <div className="absolute inset-0 flex">
                  <div className={cn("flex-1 border-r border-line border-dashed flex flex-col items-center justify-end pb-2", activeZone === 'I' && "bg-accent/5")}>
                    <span className="text-[8px] font-mono opacity-30">I-END</span>
                  </div>
                  <div className={cn("flex-1 border-r border-line border-dashed flex flex-col items-center justify-end pb-2", activeZone === 'Mid' && "bg-accent/5")}>
                    <span className="text-[8px] font-mono opacity-30">MIDDLE</span>
                  </div>
                  <div className={cn("flex-1 flex flex-col items-center justify-end pb-2", activeZone === 'J' && "bg-accent/5")}>
                    <span className="text-[8px] font-mono opacity-30">J-END</span>
                  </div>
                </div>
                
                {/* Main Bars */}
                <div className="absolute bottom-4 left-2 right-2 h-1 bg-ink opacity-80" />
                {/* Stirrups */}
                <div className="absolute inset-x-2 top-2 bottom-2 flex justify-between pointer-events-none">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="w-px h-full bg-ink/10" />
                  ))}
                </div>
                {/* Zone Indicators */}
                <div className="absolute top-0 left-0 bottom-0 w-1/3 border-r-2 border-accent/20 pointer-events-none" />
                <div className="absolute top-0 right-0 bottom-0 w-1/3 border-l-2 border-accent/20 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-8">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40 self-start">Cross Section</h3>
              <div 
                className="border-2 border-ink relative bg-white shadow-[8px_8px_0px_0px_rgba(26,26,26,0.05)]"
                style={{ width: b/2, height: h/2 }}
              >
                <div className="absolute bottom-4 left-0 right-0 flex justify-around px-2">
                  {Array.from({ length: activeZone === 'I' ? nBarsI : activeZone === 'Mid' ? nBarsMid : nBarsJ }).map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-ink shadow-sm" />
                  ))}
                </div>
                {(activeZone === 'I' ? nCompBarsI : activeZone === 'Mid' ? nCompBarsMid : nCompBarsJ) > 0 && (
                  <div className="absolute top-4 left-0 right-0 flex justify-around px-2">
                    {Array.from({ length: activeZone === 'I' ? nCompBarsI : activeZone === 'Mid' ? nCompBarsMid : nCompBarsJ }).map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-ink/30" />
                    ))}
                  </div>
                )}
                <div className="absolute inset-2 border border-ink/10 rounded-sm pointer-events-none" />
              </div>
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

          <InputGroup title="NCC Compliance & Durability">
            <div className="p-4 bg-white space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-line">
                <div className="flex items-center gap-3">
                  <ShieldCheck className={cn("w-5 h-5", isNCCCompliant ? "text-green-600" : "text-red-600")} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest">NCC Compliance Status</p>
                    <p className="text-[8px] font-mono opacity-40">Performance Requirements B1.1 & B1.2</p>
                  </div>
                </div>
                <span className={cn(
                  "px-3 py-1 text-[10px] font-bold font-mono uppercase border-2",
                  isNCCCompliant ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                )}>
                  {isNCCCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                </span>
              </div>

              <div className="space-y-2">
                <ResultRow 
                  label="Structural Safety" 
                  value={isStructuralSafe ? 'PASS' : 'FAIL'} 
                  status={isStructuralSafe ? 'pass' : 'fail'} 
                  tooltip="AS 1170 & AS 3600 Strength Requirements"
                />
                <ResultRow 
                  label="Fire Resistance" 
                  value={isFireSafe ? 'PASS' : 'FAIL'} 
                  status={isFireSafe ? 'pass' : 'fail'} 
                  tooltip={`Min width for ${fireRating}min FRP is ${minB}mm`}
                />
                <ResultRow 
                  label="Durability (Cover)" 
                  value={isDurable ? 'PASS' : 'FAIL'} 
                  status={isDurable ? 'pass' : 'fail'} 
                  tooltip={`Required cover for ${exposureClass} is ${requiredCover}mm`}
                />
              </div>
            </div>
          </InputGroup>

          <InputGroup title="Refined Design Checks">
            <div className="p-4 bg-white space-y-4">
              <ResultRow 
                label="Min Reinforcement" 
                value={`${AstMid.toFixed(0)} / ${minAst.toFixed(0)}`} 
                unit="mm2" 
                status={isMinAstPass ? 'pass' : 'fail'} 
                tooltip="Clause 8.1.6.1: Minimum tensile reinforcement to prevent brittle failure."
              />
              <ResultRow 
                label="Crack Control" 
                value={crackControl.isSafe ? 'PASS' : 'FAIL'} 
                status={crackControl.isSafe ? 'pass' : 'fail'} 
                tooltip={`Clause 8.6.2: Max spacing ${crackControl.maxSpacing}mm, Max bar ${crackControl.maxBarDiam}mm`}
              />
              <ResultRow 
                label="Development Length" 
                value={devLength.toFixed(0)} 
                unit="mm" 
                status="info" 
                tooltip="Clause 13.1.2: Minimum length to develop full yield strength of rebar."
              />
            </div>
          </InputGroup>

          <InputGroup title="Design Summary (By Zone)">
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 border-b border-line">
                <p className="text-[8px] font-mono uppercase opacity-40 mb-2">I-End (L/3)</p>
                <ResultRow label="Moment M*" value={Math.abs(mStarI).toFixed(1)} unit="kNm" />
                <ResultRow label="Capacity φMu" value={flexureI.phiMu.toFixed(1)} unit="kNm" status={flexureStatusI} />
                <ResultRow label="Shear V*" value={vStarEnd.toFixed(1)} unit="kN" />
                <ResultRow label="Capacity φVu" value={shearI.phiVu.toFixed(1)} unit="kN" status={shearStatusI} />
                <div className="mt-2 grid grid-cols-3 gap-1 text-[8px] font-mono opacity-40">
                  <span>kv: {shearI.kv.toFixed(3)}</span>
                  <span>θ: {shearI.theta.toFixed(1)}°</span>
                  <span>εx: {(shearI.epsilon_x * 1000).toFixed(3)}e-3</span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 border-b border-line">
                <p className="text-[8px] font-mono uppercase opacity-40 mb-2">Middle (L/3)</p>
                <ResultRow label="Moment M*" value={Math.abs(mStarMid).toFixed(1)} unit="kNm" />
                <ResultRow label="Capacity φMu" value={flexureMid.phiMu.toFixed(1)} unit="kNm" status={flexureStatusMid} />
                <ResultRow label="Shear V*" value={vStarMid.toFixed(1)} unit="kN" />
                <ResultRow label="Capacity φVu" value={shearMid.phiVu.toFixed(1)} unit="kN" status={shearStatusMid} />
                <div className="mt-2 grid grid-cols-3 gap-1 text-[8px] font-mono opacity-40">
                  <span>kv: {shearMid.kv.toFixed(3)}</span>
                  <span>θ: {shearMid.theta.toFixed(1)}°</span>
                  <span>εx: {(shearMid.epsilon_x * 1000).toFixed(3)}e-3</span>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <p className="text-[8px] font-mono uppercase opacity-40 mb-2">J-End (L/3)</p>
                <ResultRow label="Moment M*" value={Math.abs(mStarJ).toFixed(1)} unit="kNm" />
                <ResultRow label="Capacity φMu" value={flexureJ.phiMu.toFixed(1)} unit="kNm" status={flexureStatusJ} />
                <ResultRow label="Shear V*" value={vStarEnd.toFixed(1)} unit="kN" />
                <ResultRow label="Capacity φVu" value={shearJ.phiVu.toFixed(1)} unit="kN" status={shearStatusJ} />
                <div className="mt-2 grid grid-cols-3 gap-1 text-[8px] font-mono opacity-40">
                  <span>kv: {shearJ.kv.toFixed(3)}</span>
                  <span>θ: {shearJ.theta.toFixed(1)}°</span>
                  <span>εx: {(shearJ.epsilon_x * 1000).toFixed(3)}e-3</span>
                </div>
              </div>
            </div>
          </InputGroup>

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
