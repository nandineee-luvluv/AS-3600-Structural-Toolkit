import React, { useState, useMemo, useEffect } from 'react';
import { InputGroup, InputField, ResultRow } from '../ui/InputGrid';
import { SectionLibraryManager } from '../SectionLibraryManager';
import { 
  calculateColumnBiaxial, 
  calculateSeismicDetailing, 
  calculateShearCapacity,
  validateInput, 
  COLUMN_END_CONDITIONS,
  SECTION_LIBRARY,
  generateColumnInteractionDiagram,
  SectionShape,
  REINFORCEMENT_TYPES
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
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { useMaterials } from '../../contexts/MaterialContext';
import { cn } from '../../lib/utils';

const ColumnCalculator: React.FC = () => {
  const { addToHistory } = useHistory();
  const { combinations } = useLoadCombinations();
  const { library } = useSections();
  const { customMaterials, addMaterial } = useMaterials();
  
  // Section Geometry
  const [shape, setShape] = useState<SectionShape>('rectangular');
  const [b, setB] = useState(400);
  const [h, setH] = useState(400);
  const [bf, setBf] = useState(600);
  const [tf, setTf] = useState(200);
  const [tw, setTw] = useState(200);
  const [hw, setHw] = useState(400);
  const [l1, setL1] = useState(600);
  const [t1, setT1] = useState(200);
  const [l2, setL2] = useState(400);
  const [t2, setT2] = useState(200);
  const [bf_top, setBfTop] = useState(400);
  const [tf_top, setTfTop] = useState(150);
  const [bf_bot, setBfBot] = useState(400);
  const [tf_bot, setTfBot] = useState(150);
  const [L, setL] = useState(4000); // Height in mm
  const [cover, setCover] = useState(40);

  // End Conditions
  const [endConditionId, setEndConditionId] = useState('pinned-pinned');

  // Reinforcement
  const [nBars, setNBars] = useState(8);
  const [barDiam, setBarDiam] = useState(20);
  const [stirrupDiam, setStirrupDiam] = useState(10);
  const [endLengthI, setEndLengthI] = useState(600);
  const [endLengthJ, setEndLengthJ] = useState(600);
  const [stirrupSpacingI, setStirrupSpacingI] = useState(100);
  const [stirrupSpacingMid, setStirrupSpacingMid] = useState(200);
  const [stirrupSpacingJ, setStirrupSpacingJ] = useState(100);
  const [vStar, setVStar] = useState(100); // Design Shear (kN)

  // Materials
  const [fc, setFc] = useState(32);
  const [fsy, setFsy] = useState(500);

  // Loads
  const [gLoad, setGLoad] = useState(800); // kN
  const [qLoad, setQLoad] = useState(400); // kN
  const [wLoad, setWLoad] = useState(0);   // kN
  const [eLoad, setELoad] = useState(0);   // kN
  
  const [mxStar, setMxStar] = useState(150);
  const [myStar, setMyStar] = useState(50);
  const [selectedComboId, setSelectedComboId] = useState('1.2G_1.5Q');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [useDesignValues, setUseDesignValues] = useState(true);

  const [activeZone, setActiveZone] = useState<'I' | 'Mid' | 'J'>('Mid');

  const handleSectionSelect = (section: any) => {
    setShape(section.shape || 'rectangular');
    if (section.b) setB(section.b);
    if (section.h) setH(section.h);
    if (section.bf) setBf(section.bf);
    if (section.tf) setTf(section.tf);
    if (section.tw) setTw(section.tw);
    if (section.hw) setHw(section.hw);
    if (section.l1) setL1(section.l1);
    if (section.t1) setT1(section.t1);
    if (section.l2) setL2(section.l2);
    if (section.t2) setT2(section.t2);
    if (section.bf_top) setBfTop(section.bf_top);
    if (section.tf_top) setTfTop(section.tf_top);
    if (section.bf_bot) setBfBot(section.bf_bot);
    if (section.tf_bot) setTfBot(section.tf_bot);
    if (section.L) setL(section.L);
    if (section.cover) setCover(section.cover);
  };

  // Validation
  const errors = useMemo(() => {
    return [
      validateInput(b, 200, 1200, 'Width (b)'),
      validateInput(h, 200, 1200, 'Depth (h)'),
      validateInput(L, 1000, 10000, 'Height (L)'),
      validateInput(nBars, 4, 32, 'Total Bars'),
      validateInput(fc, 20, 100, "Concrete f'c"),
    ].filter(e => e !== null) as string[];
  }, [b, h, L, nBars, fc]);

  // Derived Values
  const combo = combinations.find(c => c.id === selectedComboId) || combinations[0];
  const endCondition = COLUMN_END_CONDITIONS.find(ec => ec.id === endConditionId)!;
  
  const nStar = gLoad * combo.factors.G + qLoad * combo.factors.Q + wLoad * combo.factors.W + eLoad * combo.factors.E;
  const Le = (L * endCondition.k_eff);

  const Ast = nBars * (Math.PI * Math.pow(barDiam, 2)) / 4;
  const Ag = b * h;
  const p = (Ast / Ag) * 100;

  const capacity = useMemo(() => {
    return calculateColumnBiaxial(
      b, h, Ast,
      { fc, fsy, Es: 200000 },
      nStar, mxStar, myStar
    );
  }, [b, h, Ast, fc, fsy, nStar, mxStar, myStar]);

  const shearI = useMemo(() => {
    const d_eff = Math.min(b, h) - cover - stirrupDiam - barDiam / 2;
    return calculateShearCapacity({ b, d: d_eff, h: Math.min(b, h), Ast: Ast / 2 }, { fc, fsy, Es: 200000 }, 2 * (Math.PI * Math.pow(stirrupDiam, 2)) / 4, stirrupSpacingI);
  }, [b, h, cover, barDiam, stirrupDiam, stirrupSpacingI, fc, fsy, Ast]);

  const shearMid = useMemo(() => {
    const d_eff = Math.min(b, h) - cover - stirrupDiam - barDiam / 2;
    return calculateShearCapacity({ b, d: d_eff, h: Math.min(b, h), Ast: Ast / 2 }, { fc, fsy, Es: 200000 }, 2 * (Math.PI * Math.pow(stirrupDiam, 2)) / 4, stirrupSpacingMid);
  }, [b, h, cover, barDiam, stirrupDiam, stirrupSpacingMid, fc, fsy, Ast]);

  const shearJ = useMemo(() => {
    const d_eff = Math.min(b, h) - cover - stirrupDiam - barDiam / 2;
    return calculateShearCapacity({ b, d: d_eff, h: Math.min(b, h), Ast: Ast / 2 }, { fc, fsy, Es: 200000 }, 2 * (Math.PI * Math.pow(stirrupDiam, 2)) / 4, stirrupSpacingJ);
  }, [b, h, cover, barDiam, stirrupDiam, stirrupSpacingJ, fc, fsy, Ast]);

  const seismic = useMemo(() => {
    const d_eff = Math.min(b, h) - cover - stirrupDiam - barDiam / 2;
    return calculateSeismicDetailing('column', { b, h, d: d_eff, db: barDiam, ds: stirrupDiam, s: stirrupSpacingMid, fc });
  }, [b, h, cover, barDiam, stirrupDiam, stirrupSpacingMid, fc]);

  const isSafe = capacity.isSafe;

  // History Tracking
  useEffect(() => {
    if (errors.length > 0) return;
    const timer = setTimeout(() => {
      addToHistory({
        type: 'Column Design',
        title: `${b}x${h} Column - ${endCondition.label}`,
        inputs: { b, h, fc, fsy, nStar, endCondition: endCondition.label },
        results: { phiNu: capacity.phiNu, ratio: capacity.ratio }
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [b, h, fc, fsy, nBars, barDiam, nStar, endConditionId]);

  const exportInputs = [
    { label: 'Width (b)', value: b, unit: 'mm' },
    { label: 'Depth (h)', value: h, unit: 'mm' },
    { label: 'Height (L)', value: L, unit: 'mm' },
    { label: 'End Condition', value: endCondition.label },
    { label: 'Concrete Grade (fc)', value: fc, unit: 'MPa' },
    { label: 'Design Axial (N*)', value: nStar.toFixed(1), unit: 'kN' },
  ];

  const exportResults = [
    { 
      label: 'Axial Capacity (phiNu)', 
      value: capacity.phiNu.toFixed(0), 
      unit: 'kN', 
      status: isSafe ? 'pass' : 'fail',
      clause: '10.6.2',
      equation: '\\phi N_{uo} = \\phi [\\alpha_1 f\'_c (A_g - A_{sc}) + f_{sy} A_{sc}]'
    },
    { 
      label: 'Biaxial Ratio', 
      value: capacity.ratio.toFixed(2), 
      status: isSafe ? 'pass' : 'fail',
      clause: '10.6.4',
      equation: `(M_x^* / \\phi M_{ux})^{${capacity.alpha_n.toFixed(2)}} + (M_y^* / \\phi M_{uy})^{${capacity.alpha_n.toFixed(2)}} \\le 1.0`
    },
  ];

  const reinforcementType = REINFORCEMENT_TYPES.find(t => t.fsy === fsy)?.label || `${fsy} MPa Steel`;

  const procedure = `
# AS 3600 Column Design Procedure (AS 1170 Loads)
Reinforcement: ${reinforcementType}
n_star = g*G + q*Q + w*W + e*E
Le = L * k_eff
Ag = b * h
alpha1 = 1.0 - 0.003 * fc
Nuo = (alpha1 * fc * (Ag - Ast) + fsy * Ast) * 1e-3
phiNu_max = 0.6 * 0.8 * Nuo
print(f"Max Axial Capacity: {phiNu_max:.2f} kN")
  `;

  // Improved Interaction Diagram Data
  const interactionData = useMemo(() => {
    return generateColumnInteractionDiagram(b, h, Ast, { fc, fsy, Es: 200000 }, { useDesignValues });
  }, [b, h, Ast, fc, fsy, useDesignValues]);

  return (
    <div className="space-y-12">
      <header className="flex items-end justify-between border-b border-line pb-8">
        <div>
          <h2 className="text-4xl font-serif font-bold italic tracking-tight text-ink">Column Design</h2>
          <p className="text-[10px] font-mono opacity-40 uppercase tracking-[0.3em] mt-2">Braced Rectangular Column Section | AS 3600:2018</p>
        </div>
        <div className="flex items-center gap-4">
          <ExportActions 
            title="Column Design Report" 
            inputs={exportInputs} 
            results={exportResults} 
            procedure={procedure}
            filename={`column_${b}x${h}`}
          />
          <div className={cn(
            "px-4 py-2 border border-ink shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]",
            isSafe ? 'bg-green-50' : 'bg-red-50'
          )}>
            <div className="text-[8px] font-mono uppercase opacity-40 leading-none mb-1">Overall Status</div>
            <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wider">
              {isSafe ? <CheckCircle2 size={12} className="text-green-600" /> : <XCircle size={12} className="text-red-600" />}
              {isSafe ? 'Pass' : 'Fail'}
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
              <SectionLibraryManager type="columns" onSelect={handleSectionSelect} />
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
                  <option value="t-shaped">T-Shaped</option>
                  <option value="l-shaped">L-Shaped</option>
                  <option value="i-shaped">I-Shaped</option>
                </select>
              </div>

              {shape === 'rectangular' && (
                <>
                  <InputField label="Width (b)" value={b} onChange={setB} unit="mm" />
                  <InputField label="Depth (h)" value={h} onChange={setH} unit="mm" />
                </>
              )}
              {shape === 't-shaped' && (
                <>
                  <InputField label="Flange Width (bf)" value={bf} onChange={setBf} unit="mm" />
                  <InputField label="Flange Thickness (tf)" value={tf} onChange={setTf} unit="mm" />
                  <InputField label="Web Thickness (tw)" value={tw} onChange={setTw} unit="mm" />
                  <InputField label="Web Height (hw)" value={hw} onChange={setHw} unit="mm" />
                </>
              )}
              {shape === 'l-shaped' && (
                <>
                  <InputField label="Leg 1 Length (l1)" value={l1} onChange={setL1} unit="mm" />
                  <InputField label="Leg 1 Thickness (t1)" value={t1} onChange={setT1} unit="mm" />
                  <InputField label="Leg 2 Length (l2)" value={l2} onChange={setL2} unit="mm" />
                  <InputField label="Leg 2 Thickness (t2)" value={t2} onChange={setT2} unit="mm" />
                </>
              )}
              {shape === 'i-shaped' && (
                <>
                  <InputField label="Top Flange (bf_top)" value={bf_top} onChange={setBfTop} unit="mm" />
                  <InputField label="Top Thick (tf_top)" value={tf_top} onChange={setTfTop} unit="mm" />
                  <InputField label="Web Thick (tw)" value={tw} onChange={setTw} unit="mm" />
                  <InputField label="Web Height (hw)" value={hw} onChange={setHw} unit="mm" />
                  <InputField label="Bot Flange (bf_bot)" value={bf_bot} onChange={setBfBot} unit="mm" />
                  <InputField label="Bot Thick (tf_bot)" value={tf_bot} onChange={setTfBot} unit="mm" />
                </>
              )}

              <InputField label="Height (L)" value={L} onChange={setL} unit="mm" />
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
              <InputField label="Concrete Cover" value={cover} onChange={setCover} unit="mm" />
            </InputGroup>

            <InputGroup title="Longitudinal Reinforcement">
              <InputField label="Total Bars" value={nBars} onChange={setNBars} unit="qty" />
              <InputField label="Bar Diameter" value={barDiam} onChange={setBarDiam} unit="mm" />
              <InputField 
                label="Ratio (ρ)" 
                value={p.toFixed(2)} 
                onChange={() => {}} 
                unit="%" 
                description="Read-only" 
                tooltip="Reinforcement ratio Ast/Ag. Must be between 0.01 and 0.04."
              />
            </InputGroup>

            <InputGroup title="Shear Reinforcement (Stirrups)">
              <div className="p-4 bg-gray-50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Stirrup Diam" value={stirrupDiam} onChange={setStirrupDiam} unit="mm" />
                  <InputField label="Design Shear V*" value={vStar} onChange={setVStar} unit="kN" />
                </div>
                
                <div className="h-px bg-line opacity-10" />
                
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="I-End Length" value={endLengthI} onChange={setEndLengthI} unit="mm" />
                  <InputField label="J-End Length" value={endLengthJ} onChange={setEndLengthJ} unit="mm" />
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
                      <InputField label="I-End Spacing" value={stirrupSpacingI} onChange={setStirrupSpacingI} unit="mm" />
                    )}
                    {activeZone === 'Mid' && (
                      <InputField label="Middle Spacing" value={stirrupSpacingMid} onChange={setStirrupSpacingMid} unit="mm" />
                    )}
                    {activeZone === 'J' && (
                      <InputField label="J-End Spacing" value={stirrupSpacingJ} onChange={setStirrupSpacingJ} unit="mm" />
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
            <InputField 
              label="Factored Axial (N*)" 
              value={nStar.toFixed(1)} 
              onChange={() => {}} 
              unit="kN" 
              description="Total axial load"
            />
            <InputField label="Mx*" value={mxStar} onChange={setMxStar} unit="kNm" />
            <InputField label="My*" value={myStar} onChange={setMyStar} unit="kNm" />
          </InputGroup>

          {/* Interaction Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="brutal-card p-8 bg-white bg-grid">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40">Interaction Diagram</h3>
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
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a10" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Moment" 
                      unit=" kNm" 
                      stroke="#1a1a1a"
                      tick={{ fontSize: 10, fontFamily: 'monospace' }}
                      label={{ value: useDesignValues ? 'φMu (kNm)' : 'Mu (kNm)', position: 'bottom', offset: 0, fontSize: 10, fontFamily: 'monospace', opacity: 0.4 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Axial" 
                      unit=" kN" 
                      stroke="#1a1a1a"
                      tick={{ fontSize: 10, fontFamily: 'monospace' }}
                      label={{ value: useDesignValues ? 'φNu (kN)' : 'Nu (kN)', angle: -90, position: 'left', offset: 0, fontSize: 10, fontFamily: 'monospace', opacity: 0.4 }}
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter 
                      name="Capacity Envelope" 
                      data={interactionData} 
                      fill="transparent" 
                      stroke="#1a1a1a" 
                      line={{ stroke: '#1a1a1a', strokeWidth: 2 }}
                    />
                    <Scatter 
                      name="Design Point" 
                      data={[{ x: Math.sqrt(mxStar**2 + myStar**2), y: nStar }]} 
                      fill={isSafe ? '#16a34a' : '#dc2626'} 
                      shape="circle"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="brutal-card p-8 bg-white bg-grid flex flex-col items-center justify-center gap-8">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40 self-start">Longitudinal Section</h3>
              <div className="w-24 h-64 relative border-2 border-ink bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,0.1)] overflow-hidden">
                {/* Stirrup Zones */}
                <div className="absolute inset-x-0 bottom-0 bg-accent/5 border-t border-accent/20 flex items-center justify-center" style={{ height: `${(endLengthI / L) * 100}%` }}>
                  <span className="text-[8px] font-mono opacity-30 rotate-90">I-END</span>
                </div>
                <div className="absolute inset-x-0 top-0 bg-accent/5 border-b border-accent/20 flex items-center justify-center" style={{ height: `${(endLengthJ / L) * 100}%` }}>
                  <span className="text-[8px] font-mono opacity-30 rotate-90">J-END</span>
                </div>
                
                {/* Bars */}
                <div className="absolute inset-y-0 left-4 w-1 bg-ink opacity-80" />
                <div className="absolute inset-y-0 right-4 w-1 bg-ink opacity-80" />
                
                {/* Stirrups (Visual representation) */}
                <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="h-px w-full bg-ink/20" />
                  ))}
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono uppercase opacity-40">Height {L}mm</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-8">
          <InputGroup title="Axial & Moment Capacity">
            <div className="p-4 bg-gray-50 border-b border-line space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent">Strength Checks</p>
                <ComplianceInfo 
                  clause="10.6.4" 
                  description="Biaxial bending check using Bresler Load Contour method."
                  equation="(M_x^* / \phi M_{ux})^{\alpha_n} + (M_y^* / \phi M_{uy})^{\alpha_n} \le 1.0"
                />
              </div>
              <div className="text-[9px] font-mono opacity-60 space-y-1">
                <p>Nuo = α1*fc*(Ag-Ast) + fsy*Ast</p>
              </div>
            </div>
            <ResultRow label="Axial Capacity (φNu)" value={capacity.phiNu.toFixed(0)} unit="kN" />
            <ResultRow label="Axial Ratio" value={(nStar / capacity.phiNu).toFixed(2)} status={(nStar / capacity.phiNu) <= 1.0 ? 'pass' : 'fail'} />
            <ResultRow label="Biaxial Ratio" value={capacity.ratio.toFixed(2)} status={capacity.ratio <= 1.0 ? 'pass' : 'fail'} />
            <ResultRow label="Biaxial Check" value={isSafe ? 'Safe' : 'Unsafe'} status={isSafe ? 'pass' : 'fail'} />
          </InputGroup>

          <InputGroup title="Shear Capacity (By Zone)">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border-b border-line">
                <p className="text-[8px] font-mono uppercase opacity-40 mb-2">I-End ({endLengthI}mm)</p>
                <ResultRow label="Capacity φVu" value={shearI.phiVu.toFixed(1)} unit="kN" status={shearI.phiVu >= vStar ? 'pass' : 'fail'} />
              </div>
              <div className="p-4 bg-gray-50 border-b border-line">
                <p className="text-[8px] font-mono uppercase opacity-40 mb-2">Middle ({L - endLengthI - endLengthJ}mm)</p>
                <ResultRow label="Capacity φVu" value={shearMid.phiVu.toFixed(1)} unit="kN" status={shearMid.phiVu >= vStar ? 'pass' : 'fail'} />
              </div>
              <div className="p-4 bg-gray-50">
                <p className="text-[8px] font-mono uppercase opacity-40 mb-2">J-End ({endLengthJ}mm)</p>
                <ResultRow label="Capacity φVu" value={shearJ.phiVu.toFixed(1)} unit="kN" status={shearJ.phiVu >= vStar ? 'pass' : 'fail'} />
              </div>
            </div>
          </InputGroup>

          <InputGroup title="Slenderness">
            <div className="p-4 bg-gray-50 border-b border-line space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent">Buckling Analysis</p>
                <ComplianceInfo 
                  clause="10.2" 
                  description="Effective length and slenderness limits for compression members."
                  equation="\lambda = \frac{L_e}{r} \le 22"
                />
              </div>
              <p className="text-[9px] font-mono opacity-60 leading-relaxed">Le = L * k_eff. Slender if Le/r &gt; 22.</p>
            </div>
            <ResultRow label="Eff. Length (Le)" value={Le.toFixed(0)} unit="mm" />
            <ResultRow label="k Factor" value={endCondition.k_eff.toFixed(2)} status="info" />
            <div className="mt-4 p-4 bg-accent/5 border-t border-accent/10 text-[10px] font-mono space-y-2">
              <p className="font-bold uppercase text-accent tracking-widest">Slenderness Check</p>
              <div className="flex justify-between opacity-60">
                <span>Le/r Ratio:</span>
                <span className="font-bold">{ (Le / (Math.min(b, h) / Math.sqrt(12))).toFixed(1) }</span>
              </div>
              <p className="mt-3 opacity-40 italic leading-relaxed">If Le/r &gt; 22, column is slender and second-order effects must be considered (Clause 10.2).</p>
            </div>
          </InputGroup>

          <SeismicDetailing requirements={seismic} />

          {!isSafe && (
            <div className="p-6 bg-red-50 border border-red-200 text-red-600 flex gap-4">
              <AlertTriangle className="shrink-0 mt-1" />
              <div>
                <p className="font-bold text-[10px] uppercase tracking-widest">Capacity Exceeded</p>
                <p className="text-[10px] font-mono mt-2 opacity-80 leading-relaxed">Applied loads fall outside the calculated capacity envelope. Increase section size or reinforcement.</p>
              </div>
            </div>
          )}

          <div className="p-6 bg-ink text-white rounded-sm space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">
              <Info size={12} />
              <span>Design Notes</span>
            </div>
            <p className="text-[10px] font-mono leading-relaxed opacity-80">
              Biaxial bending check uses Bresler Load Contour method (Clause 10.6.4).
              Axial capacity includes alpha1 factor for high-strength concrete.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnCalculator;
