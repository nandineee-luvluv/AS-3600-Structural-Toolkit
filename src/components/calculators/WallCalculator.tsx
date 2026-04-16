import React, { useState, useMemo, useEffect } from 'react';
import { InputGroup, InputField, ResultRow } from '../ui/InputGrid';
import { SectionLibraryManager } from '../SectionLibraryManager';
import { 
  calculateWallBoundaryElements, 
  calculateSeismicDetailing, 
  validateInput, 
  COLUMN_END_CONDITIONS,
  SECTION_LIBRARY,
  generateWallInteractionDiagram,
  SectionShape,
  EXPOSURE_CLASSES,
  FIRE_RATINGS,
  getRequiredCover,
  checkNCCCompliance
} from '../../lib/as3600';
import { Info, AlertTriangle, CheckCircle2, XCircle, ShieldCheck, Layout, Building2 } from 'lucide-react';
import { 
  ProfessionalInputGroup, 
  QuickMaterialSelector, 
  DesignComplianceSummary 
} from '../ui/CalculatorWrappers';
import { DesignResultCard } from '../ui/ProfessionalComponents';
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
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ReferenceLine, Cell } from 'recharts';

const WallCalculator: React.FC = () => {
  const { addToHistory } = useHistory();
  const { combinations } = useLoadCombinations();
  const { library } = useSections();
  const { customMaterials, addMaterial } = useMaterials();
  
  // Section Geometry
  const [shape, setShape] = useState<SectionShape>('linear');
  const [tw, setTw] = useState(200); // Wall thickness
  const [Lw, setLw] = useState(3000); // Wall length
  const [Hw, setHw] = useState(3000); // Wall height
  const [bf, setBf] = useState(600);
  const [tf, setTf] = useState(200);
  const [hw, setHw_] = useState(400);
  const [l1, setL1] = useState(600);
  const [t1, setT1] = useState(200);
  const [l2, setL2] = useState(400);
  const [t2, setT2] = useState(200);
  const [bf_top, setBfTop] = useState(400);
  const [tf_top, setTfTop] = useState(150);
  const [bf_bot, setBfBot] = useState(400);
  const [tf_bot, setTfBot] = useState(150);
  const [endConditionId, setEndConditionId] = useState('fixed-fixed');

  // Reinforcement
  const [barDiamV, setBarDiamV] = useState(16);
  const [barSpacingVI, setBarSpacingVI] = useState(150);
  const [barSpacingVMid, setBarSpacingVMid] = useState(200);
  const [barSpacingVJ, setBarSpacingVJ] = useState(150);
  const [barDiamH, setBarDiamH] = useState(12);
  const [endLengthI, setEndLengthI] = useState(600);
  const [endLengthJ, setEndLengthJ] = useState(600);
  const [barSpacingHI, setBarSpacingHI] = useState(150);
  const [barSpacingHMid, setBarSpacingHMid] = useState(300);
  const [barSpacingHJ, setBarSpacingHJ] = useState(150);

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
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [useDesignValues, setUseDesignValues] = useState(true);

  const [activeZone, setActiveZone] = useState<'I' | 'Mid' | 'J'>('Mid');

  // NCC & Durability
  const [exposureClass, setExposureClass] = useState('A1');
  const [fireRating, setFireRating] = useState('60');

  // Validation
  const errors = useMemo(() => {
    return [
      validateInput(tw, 150, 600, 'Thickness (tw)'),
      validateInput(Lw, 1000, 10000, 'Length (Lw)'),
      validateInput(fc, 20, 100, "Concrete f'c"),
    ].filter(e => e !== null) as string[];
  }, [tw, Lw, fc]);

  // Derived Values
  const combo = combinations.find(c => c.id === selectedComboId) || combinations[0];
  const endCondition = COLUMN_END_CONDITIONS.find(ec => ec.id === endConditionId)!;
  const nStar = gLoad * combo.factors.G + qLoad * combo.factors.Q + wLoad * combo.factors.W + eLoad * combo.factors.E;
  const He = Hw * endCondition.k_eff;

  const handleSectionSelect = (section: any) => {
    setShape(section.shape || 'linear');
    if (section.tw) setTw(section.tw);
    if (section.Lw) setLw(section.Lw);
    if (section.Hw) setHw(section.Hw);
    if (section.bf) setBf(section.bf);
    if (section.tf) setTf(section.tf);
    if (section.hw) setHw_(section.hw);
    if (section.l1) setL1(section.l1);
    if (section.t1) setT1(section.t1);
    if (section.l2) setL2(section.l2);
    if (section.t2) setT2(section.t2);
    if (section.bf_top) setBfTop(section.bf_top);
    if (section.tf_top) setTfTop(section.tf_top);
    if (section.bf_bot) setBfBot(section.bf_bot);
    if (section.tf_bot) setTfBot(section.tf_bot);
  };

  const totalLw = useMemo(() => {
    if (shape === 't-shaped') return hw + tf;
    if (shape === 'l-shaped') return l1;
    if (shape === 'i-shaped') return hw + tf_top + tf_bot;
    if (shape === 'c-shaped') return tw; // tw is web length
    return Lw;
  }, [shape, Lw, hw, tf, l1, tf_top, tf_bot, tw]);

  const totalTw = useMemo(() => {
    if (shape === 't-shaped') return tw;
    if (shape === 'l-shaped') return t1;
    if (shape === 'i-shaped') return tw;
    if (shape === 'c-shaped') return hw; // hw is flange length? No, in my diagram hw was web length.
    return tw;
  }, [shape, tw, t1, hw]);

  // Calculations (Simplified C&T Method)
  const calculations = useMemo(() => {
    const z = 0.8 * totalLw; // Lever arm approx
    const T = (mStar * 1e6 / z) - (nStar * 1e3 / 2); // N
    const C = (mStar * 1e6 / z) + (nStar * 1e3 / 2); // N

    const phi = 0.85;
    const Ast_req = T > 0 ? (T / (phi * fsy)) : 0;
    
    // Shear Capacity (Simplified)
    const phiV = 0.75;
    const Vuc = 0.15 * totalTw * 0.8 * totalLw * Math.sqrt(fc) * 1e-3;
    const Vus_req = vStar > phiV * Vuc ? (vStar - phiV * Vuc) / phiV : 0;
    const Ash_req = (Vus_req * 1e3 * barSpacingHMid) / (fsy * 0.8 * totalLw);

    const boundary = calculateWallBoundaryElements(totalTw, totalLw, Hw, nStar, mStar, { fc, fsy, Es: 200000 });

    // Zone-based Shear Capacities
    const AshI = (Math.PI * Math.pow(barDiamH, 2)) / 4;
    const VusI = (AshI * fsy * 0.8 * totalLw) / barSpacingHI * 1e-3;
    const phiVuI = phiV * (Vuc + VusI);

    const AshMid = (Math.PI * Math.pow(barDiamH, 2)) / 4;
    const VusMid = (AshMid * fsy * 0.8 * totalLw) / barSpacingHMid * 1e-3;
    const phiVuMid = phiV * (Vuc + VusMid);

    const AshJ = (Math.PI * Math.pow(barDiamH, 2)) / 4;
    const VusJ = (AshJ * fsy * 0.8 * totalLw) / barSpacingHJ * 1e-3;
    const phiVuJ = phiV * (Vuc + VusJ);

    return {
      T: T * 1e-3,
      C: C * 1e-3,
      Ast_req,
      Ash_req,
      Vuc,
      boundary,
      phiVuI,
      phiVuMid,
      phiVuJ,
      isSafeShear: vStar <= Math.min(phiVuI, phiVuMid, phiVuJ)
    };
  }, [tw, Lw, Hw, mStar, nStar, vStar, fsy, fc, barSpacingHI, barSpacingHMid, barSpacingHJ, barDiamH, totalLw, totalTw]);

  const interactionData = useMemo(() => {
    const Ast = (1000 / barSpacingVMid) * (Math.PI * Math.pow(barDiamV, 2)) / 4 * (Lw / 1000);
    return generateWallInteractionDiagram(tw, Lw, Ast, { fc, fsy, Es: 200000 }, { useDesignValues });
  }, [tw, Lw, fc, fsy, barDiamV, barSpacingVMid, useDesignValues]);

  const seismic = useMemo(() => {
    return calculateSeismicDetailing('wall', { b: tw, h: Hw, d: Lw, db: barDiamV, ds: barDiamH, s: barSpacingVMid, fc });
  }, [tw, Hw, Lw, barDiamV, barDiamH, barSpacingVMid, fc]);

  const isSafeTension = ( (1000 / Math.min(barSpacingVI, barSpacingVMid, barSpacingVJ)) * (Math.PI * Math.pow(barDiamV, 2) / 4) * (Lw / 1000) ) >= calculations.Ast_req;
  const isSafe = isSafeTension && calculations.isSafeShear;

  // NCC Compliance Calculations
  const requiredCover = getRequiredCover(exposureClass, fireRating);
  const isDurable = 40 >= requiredCover; // Walls usually have 40mm
  const minB = FIRE_RATINGS.find(f => f.id === fireRating)?.minB || 0;
  const isFireSafe = tw >= minB;
  const isStructuralSafe = isSafe;
  const isNCCCompliant = checkNCCCompliance({ isStructuralSafe, isFireSafe, isDurable });

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
    { 
      label: 'Tension (T*)', 
      value: calculations.T.toFixed(0), 
      unit: 'kN',
      clause: '11.2',
      equation: 'T = (M^* / z) - (N^* / 2)'
    },
    { 
      label: 'Compression (C*)', 
      value: calculations.C.toFixed(0), 
      unit: 'kN',
      clause: '11.2',
      equation: 'C = (M^* / z) + (N^* / 2)'
    },
    { 
      label: 'Boundary Required', 
      value: calculations.boundary.needsBoundary ? 'YES' : 'NO', 
      status: calculations.boundary.needsBoundary ? 'fail' : 'pass',
      clause: '11.7',
      equation: '\\sigma_{max} \\le 0.15 f\'_c'
    },
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
            <div className="col-span-2">
              <SectionLibraryManager type="walls" onSelect={handleSectionSelect} />
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
                <InputField label="Concrete Cover" value={40} onChange={() => {}} unit="mm" description="Fixed for walls" />
              </div>
            </InputGroup>

            <InputGroup title="Geometry & Support">
              <div className="p-4 bg-gray-50 space-y-2 border-b border-line">
                <label className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Section Shape</label>
                <select 
                  value={shape}
                  onChange={(e) => setShape(e.target.value as SectionShape)}
                  className="w-full bg-white border border-line p-2 text-[10px] font-mono uppercase tracking-wider focus:border-accent outline-none transition-colors"
                >
                  <option value="linear">Linear</option>
                  <option value="t-shaped">T-Shaped</option>
                  <option value="l-shaped">L-Shaped</option>
                  <option value="i-shaped">I-Shaped</option>
                  <option value="c-shaped">C-Shaped</option>
                </select>
              </div>

              {shape === 'linear' && (
                <>
                  <InputField label="Thickness (tw)" value={tw} onChange={setTw} unit="mm" />
                  <InputField label="Length (Lw)" value={Lw} onChange={setLw} unit="mm" />
                </>
              )}
              {shape === 't-shaped' && (
                <>
                  <InputField label="Flange Length (bf)" value={bf} onChange={setBf} unit="mm" />
                  <InputField label="Flange Thick (tf)" value={tf} onChange={setTf} unit="mm" />
                  <InputField label="Web Thick (tw)" value={tw} onChange={setTw} unit="mm" />
                  <InputField label="Web Length (hw)" value={hw} onChange={setHw_} unit="mm" />
                </>
              )}
              {shape === 'l-shaped' && (
                <>
                  <InputField label="Leg 1 Length (l1)" value={l1} onChange={setL1} unit="mm" />
                  <InputField label="Leg 1 Thick (t1)" value={t1} onChange={setT1} unit="mm" />
                  <InputField label="Leg 2 Length (l2)" value={l2} onChange={setL2} unit="mm" />
                  <InputField label="Leg 2 Thick (t2)" value={t2} onChange={setT2} unit="mm" />
                </>
              )}
              {shape === 'i-shaped' && (
                <>
                  <InputField label="Top Flange (bf_top)" value={bf_top} onChange={setBfTop} unit="mm" />
                  <InputField label="Top Thick (tf_top)" value={tf_top} onChange={setTfTop} unit="mm" />
                  <InputField label="Web Thick (tw)" value={tw} onChange={setTw} unit="mm" />
                  <InputField label="Web Length (hw)" value={hw} onChange={setHw_} unit="mm" />
                  <InputField label="Bot Flange (bf_bot)" value={bf_bot} onChange={setBfBot} unit="mm" />
                  <InputField label="Bot Thick (tf_bot)" value={tf_bot} onChange={setTfBot} unit="mm" />
                </>
              )}
              {shape === 'c-shaped' && (
                <>
                  <InputField label="Web Length (hw)" value={hw} onChange={setHw_} unit="mm" />
                  <InputField label="Web Thick (tw)" value={tw} onChange={setTw} unit="mm" />
                  <InputField label="Flange Length (bf)" value={bf} onChange={setBf} unit="mm" />
                  <InputField label="Flange Thick (tf)" value={tf} onChange={setTf} unit="mm" />
                </>
              )}

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
              <div className="p-4 bg-gray-50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Vert. Bar Diam" value={barDiamV} onChange={setBarDiamV} unit="mm" />
                </div>
                
                <div className="h-px bg-line opacity-10" />
                
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Horiz. Bar Diam" value={barDiamH} onChange={setBarDiamH} unit="mm" />
                  <div className="grid grid-cols-2 gap-2">
                    <InputField label="I-End Len" value={endLengthI} onChange={setEndLengthI} unit="mm" />
                    <InputField label="J-End Len" value={endLengthJ} onChange={setEndLengthJ} unit="mm" />
                  </div>
                </div>

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
                        <InputField label="Horiz. Spacing" value={barSpacingHI} onChange={setBarSpacingHI} unit="mm" />
                        <InputField label="Vert. Spacing" value={barSpacingVI} onChange={setBarSpacingVI} unit="mm" />
                      </>
                    )}
                    {activeZone === 'Mid' && (
                      <>
                        <InputField label="Horiz. Spacing" value={barSpacingHMid} onChange={setBarSpacingHMid} unit="mm" />
                        <InputField label="Vert. Spacing" value={barSpacingVMid} onChange={setBarSpacingVMid} unit="mm" />
                      </>
                    )}
                    {activeZone === 'J' && (
                      <>
                        <InputField label="Horiz. Spacing" value={barSpacingHJ} onChange={setBarSpacingHJ} unit="mm" />
                        <InputField label="Vert. Spacing" value={barSpacingVJ} onChange={setBarSpacingVJ} unit="mm" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </InputGroup>
          </div>

          <InputGroup title="Design Loads (AS 1170)">
            <InputField label="Dead (G)" value={gLoad} onChange={setGLoad} unit="kN" />
            <InputField label="Live (Q)" value={qLoad} onChange={setQLoad} unit="kN" />
            <InputField label="Wind (Wu)" value={wLoad} onChange={setWLoad} unit="kN" />
            <InputField label="Seismic (Eu)" value={eLoad} onChange={setELoad} unit="kN" />
            <InputField label="Factored Moment (M*)" value={mStar} onChange={setMStar} unit="kNm" />
            <InputField label="Factored Shear (V*)" value={vStar} onChange={setVStar} unit="kN" />
            <InputField label="Factored Axial (N*)" value={nStar.toFixed(0)} onChange={() => {}} unit="kN" description="Total factored axial load" />
          </InputGroup>

          {/* Interaction Diagram & Visualization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="brutal-card p-8 bg-white bg-grid">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-[10px] font-mono uppercase opacity-40 tracking-[0.2em]">Interaction Diagram</h4>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setUseDesignValues(true)}
                    className={cn(
                      "px-2 py-1 text-[8px] font-mono border transition-all",
                      useDesignValues ? "bg-ink text-white border-ink" : "bg-white border-line text-ink/40"
                    )}
                  >
                    DESIGN
                  </button>
                  <button 
                    onClick={() => setUseDesignValues(false)}
                    className={cn(
                      "px-2 py-1 text-[8px] font-mono border transition-all",
                      !useDesignValues ? "bg-ink text-white border-ink" : "bg-white border-line text-ink/40"
                    )}
                  >
                    NOMINAL
                  </button>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#14141410" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Moment" 
                      unit=" kNm" 
                      stroke="#141414" 
                      fontSize={10} 
                      fontFamily="monospace"
                      label={{ value: useDesignValues ? 'φMu (kNm)' : 'Mu (kNm)', position: 'bottom', offset: 0, fontSize: 10, fontFamily: 'monospace' }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Axial" 
                      unit=" kN" 
                      stroke="#141414" 
                      fontSize={10} 
                      fontFamily="monospace"
                      label={{ value: useDesignValues ? 'φNu (kN)' : 'Nu (kN)', angle: -90, position: 'left', fontSize: 10, fontFamily: 'monospace' }}
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }} 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #141414', borderRadius: 0, fontSize: 10, fontFamily: 'monospace' }}
                    />
                    <Scatter name="Capacity Curve" data={interactionData} fill="#141414" line shape="circle" />
                    <Scatter name="Design Point" data={[{ x: mStar, y: nStar }]} fill="#ff4d4d" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="brutal-card p-8 bg-white bg-grid flex flex-col items-center justify-center gap-8">
              <h4 className="text-[10px] font-mono uppercase opacity-40 self-start tracking-[0.2em]">Wall Elevation</h4>
              <div className="w-48 h-64 relative border-2 border-ink bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,0.1)] overflow-hidden">
                {/* Horizontal Bar Zones */}
                <div className="absolute inset-x-0 bottom-0 bg-accent/5 border-t border-accent/20 flex items-center justify-center" style={{ height: `${(endLengthI / Hw) * 100}%` }}>
                  <span className="text-[8px] font-mono opacity-30">I-END</span>
                </div>
                <div className="absolute inset-x-0 top-0 bg-accent/5 border-b border-accent/20 flex items-center justify-center" style={{ height: `${(endLengthJ / Hw) * 100}%` }}>
                  <span className="text-[8px] font-mono opacity-30">J-END</span>
                </div>
                
                {/* Vertical Bars */}
                <div className="absolute inset-y-0 left-4 right-4 flex justify-between px-2 pointer-events-none">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="w-px h-full bg-ink opacity-20" />
                  ))}
                </div>
                
                {/* Horizontal Bars (Visual) */}
                <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="h-px w-full bg-ink/40" />
                  ))}
                </div>

                {/* Boundary Elements */}
                {calculations.boundary.needsBoundary && (
                  <>
                    <div className="absolute left-0 inset-y-0 w-4 bg-ink/10 border-r border-ink/20" />
                    <div className="absolute right-0 inset-y-0 w-4 bg-ink/10 border-l border-ink/20" />
                  </>
                )}
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono uppercase opacity-40">Height {Hw}mm | Length {Lw}mm</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
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
                  tooltip={`Min thickness for ${fireRating}min FRP is ${minB}mm`}
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

          <div className="space-y-8 p-8 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-2xl font-bold text-slate-900">Professional Design Results</h3>
              <p className="text-[10px] font-mono opacity-60 uppercase tracking-[0.3em] mt-2">Compression & Tension Method with Zone-based Shear Verification</p>
            </div>

            {/* C&T Results */}
            <ProfessionalInputGroup title="Axial Force Distribution (ULS) - AS 3600 Clause 11.2" description="Compression & Tension method for combined bending and axial load">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DesignResultCard
                  title="Design Tension (T*)"
                  value={calculations.T.toFixed(0)}
                  unit="kN"
                  status={calculations.T > 0 ? 'fail' : 'pass'}
                  reference="C&T Method: z = 0.8Lw"
                  details={`For Lw = ${Lw}mm, z = ${(0.8 * Lw).toFixed(0)}mm`}
                />
                <DesignResultCard
                  title="Design Compression (C*)"
                  value={calculations.C.toFixed(0)}
                  unit="kN"
                  status="pass"
                  reference="C&T Method: C = M*/z + N*/2"
                  details={`Load combination: ${combo.label}`}
                />
              </div>
            </ProfessionalInputGroup>

            {/* Vertical Reinforcement Check */}
            <ProfessionalInputGroup title="Vertical Reinforcement (Tension Check)" description="Assess provided steel capacity against required tension">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DesignResultCard
                  title="Required Steel (Ast)"
                  value={calculations.Ast_req.toFixed(0)}
                  unit="mm²"
                  status={isSafeTension ? 'pass' : 'fail'}
                  reference="φ = 0.85, Ast = T / (0.85 × fsy)"
                  details={`Spacing min = ${Math.min(barSpacingVI, barSpacingVMid, barSpacingVJ)}mm`}
                />
                <DesignResultCard
                  title="Provided Steel (Ast)"
                  value={((1000 / Math.min(barSpacingVI, barSpacingVMid, barSpacingVJ)) * (Math.PI * Math.pow(barDiamV, 2)) / 4 * (Lw / 1000)).toFixed(0)}
                  unit="mm²"
                  status={isSafeTension ? 'pass' : 'fail'}
                  reference={`${barDiamV}mm @ ${Math.min(barSpacingVI, barSpacingVMid, barSpacingVJ)}mm`}
                  details={`Capacity ratio: ${(((1000 / Math.min(barSpacingVI, barSpacingVMid, barSpacingVJ)) * (Math.PI * Math.pow(barDiamV, 2)) / 4 * (Lw / 1000)) / Math.max(calculations.Ast_req, 1)).toFixed(2)}`}
                />
              </div>
            </ProfessionalInputGroup>

            {/* Boundary Elements */}
            <ProfessionalInputGroup title="Boundary Element Requirement - AS 3600 Clause 11.7" description="Special detailing for high compression zones">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DesignResultCard
                  title="Max Extreme Fiber Stress"
                  value={calculations.boundary.stress.toFixed(2)}
                  unit="MPa"
                  status={calculations.boundary.needsBoundary ? 'fail' : 'pass'}
                  reference="σ = N*/Ag + M*/Z"
                  details={`Limit: 0.15fc = ${(0.15 * fc).toFixed(1)}MPa`}
                />
                <DesignResultCard
                  title={calculations.boundary.needsBoundary ? 'Boundary Elements Required' : 'Boundary Elements Not Required'}
                  value={calculations.boundary.needsBoundary ? `${calculations.boundary.boundaryLength.toFixed(0)}` : '—'}
                  unit={calculations.boundary.needsBoundary ? 'mm' : ''}
                  status={calculations.boundary.needsBoundary ? 'fail' : 'pass'}
                  reference="Clause 11.7.1"
                  details={`Applied stress ${calculations.boundary.needsBoundary ? '>' : '<'} limit`}
                />
              </div>
            </ProfessionalInputGroup>

            {/* Shear Capacity by Zone */}
            <ProfessionalInputGroup title="Shear Capacity by Zone (ULS) - AS 3600 Clause 11.6" description="General method with zone-based strength verification">
              <div className="space-y-4">
                {['I', 'Mid', 'J'].map(zone => {
                  const phiVu = zone === 'I' ? calculations.phiVuI : zone === 'Mid' ? calculations.phiVuMid : calculations.phiVuJ;
                  const barSpacing = zone === 'I' ? barSpacingHI : zone === 'Mid' ? barSpacingHMid : barSpacingHJ;
                  const isSafe = vStar <= phiVu;
                  return (
                    <div key={zone} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <DesignResultCard
                        title={`Design Shear V* (${zone}-Zone)`}
                        value={vStar.toFixed(0)}
                        unit="kN"
                        status={isSafe ? 'pass' : 'fail'}
                        reference="Load combination factored"
                        details={`Zone ${zone === 'Mid' ? 'midspan' : zone === 'I' ? 'near I-end' : 'near J-end'}`}
                      />
                      <DesignResultCard
                        title={`Shear Capacity φVu (${zone}-Zone)`}
                        value={phiVu.toFixed(1)}
                        unit="kN"
                        status={isSafe ? 'pass' : 'fail'}
                        reference={`${barDiamH}mm @ ${barSpacing}mm; φ = 0.75`}
                        details={`Vuc = ${calculations.Vuc.toFixed(1)}kN + steel contribution`}
                      />
                    </div>
                  );
                })}
              </div>
            </ProfessionalInputGroup>

            {/* Overall Status */}
            <div className={cn(
              "p-6 border-2 rounded-lg",
              isSafe
                ? "bg-green-50 border-green-300"
                : "bg-red-50 border-red-300"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">
                    Structural Adequacy Check
                  </h4>
                  <p className="text-[10px] font-mono opacity-60">All design checks evaluated at ULS with appropriate safety factors</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold font-mono uppercase tracking-widest">
                    {isSafe ? '✓ PASS' : '✗ FAIL'}
                  </p>
                  <p className="text-[10px] font-mono opacity-40 mt-2">
                    {isSafeTension && calculations.isSafeShear ? 'All checks satisfied' : 'Review failed check above'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <InputGroup title="C&T Analysis">
            <div className="p-4 bg-gray-50 border-b border-line flex items-center justify-between">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent">Compression & Tension</p>
              <ComplianceInfo 
                clause="11.2.1" 
                description="Simplified C&T method for shear walls under combined axial and flexure."
                equation="\phi N_u = \phi (C - T)"
              />
            </div>
            <div className="p-4 bg-gray-50 border-b border-line space-y-2">
              <div className="text-[9px] font-mono opacity-60 space-y-1">
                <p>z = 0.8 * Lw</p>
                <p>T = (M* / z) - (N* / 2)</p>
                <p>C = (M* / z) + (N* / 2)</p>
              </div>
            </div>
            <ResultRow label="Tension (T*)" value={calculations.T.toFixed(0)} unit="kN" />
            <ResultRow label="Compression (C*)" value={calculations.C.toFixed(0)} unit="kN" />
            <ResultRow label="Req. Vertical (Ast)" value={calculations.Ast_req.toFixed(0)} unit="mm²" />
          </InputGroup>

          <InputGroup title="Boundary Elements">
            <div className="p-4 bg-gray-50 border-b border-line flex items-center justify-between">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent">Detailing</p>
              <ComplianceInfo 
                clause="11.7" 
                description="Check for boundary elements based on extreme fiber stress."
                equation="\sigma_{max} = \frac{N^*}{A_g} + \frac{M^*}{Z} \le 0.15 f'_c"
              />
            </div>
            <div className="p-4 bg-gray-50 border-b border-line space-y-2">
              <p className="text-[9px] font-mono opacity-60 leading-relaxed">Boundary elements required if stress σ &gt; 0.15fc</p>
            </div>
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

          <InputGroup title="Shear Capacity (By Zone)">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border-b border-line">
                <p className="text-[8px] font-mono uppercase opacity-40 mb-2">I-End ({endLengthI}mm)</p>
                <ResultRow label="Capacity φVu" value={calculations.phiVuI.toFixed(1)} unit="kN" status={calculations.phiVuI >= vStar ? 'pass' : 'fail'} />
              </div>
              <div className="p-4 bg-gray-50 border-b border-line">
                <p className="text-[8px] font-mono uppercase opacity-40 mb-2">Middle ({Hw - endLengthI - endLengthJ}mm)</p>
                <ResultRow label="Capacity φVu" value={calculations.phiVuMid.toFixed(1)} unit="kN" status={calculations.phiVuMid >= vStar ? 'pass' : 'fail'} />
              </div>
              <div className="p-4 bg-gray-50">
                <p className="text-[8px] font-mono uppercase opacity-40 mb-2">J-End ({endLengthJ}mm)</p>
                <ResultRow label="Capacity φVu" value={calculations.phiVuJ.toFixed(1)} unit="kN" status={calculations.phiVuJ >= vStar ? 'pass' : 'fail'} />
              </div>
            </div>
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
