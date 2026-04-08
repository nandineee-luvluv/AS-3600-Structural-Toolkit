import React, { useState, useMemo, useEffect } from 'react';
import { InputGroup, InputField, ResultRow } from '../ui/InputGrid';
import { 
  calculateColumnBiaxial, 
  calculateSeismicDetailing, 
  validateInput, 
  LOAD_COMBINATIONS,
  COLUMN_END_CONDITIONS,
  SECTION_LIBRARY,
  generateColumnInteractionDiagram
} from '../../lib/as3600';
import { Info, AlertTriangle, CheckCircle2, XCircle, ShieldCheck, Layout } from 'lucide-react';
import { MaterialSelector } from '../ui/MaterialSelector';
import { LoadCombinationSelector } from '../ui/LoadCombinationSelector';
import { SeismicDetailing } from '../ui/SeismicDetailing';
import { ExportActions } from '../ui/ExportActions';
import { useHistory } from '../../contexts/HistoryContext';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ColumnCalculator: React.FC = () => {
  const { addToHistory } = useHistory();
  // Section Geometry
  const [b, setB] = useState(400);
  const [h, setH] = useState(400);
  const [L, setL] = useState(4000); // Height in mm
  const [cover, setCover] = useState(40);

  // End Conditions
  const [endConditionId, setEndConditionId] = useState('pinned-pinned');

  // Reinforcement
  const [nBars, setNBars] = useState(8);
  const [barDiam, setBarDiam] = useState(20);
  const [stirrupDiam, setStirrupDiam] = useState(10);
  const [stirrupSpacing, setStirrupSpacing] = useState(200);

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

  const handleSectionSelect = (id: string) => {
    const section = SECTION_LIBRARY.columns.find(s => s.id === id);
    if (section) {
      setB(section.b);
      setH(section.h);
    }
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
  const combo = LOAD_COMBINATIONS.find(c => c.id === selectedComboId)!;
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

  const seismic = useMemo(() => {
    const d_eff = Math.min(b, h) - cover - stirrupDiam - barDiam / 2;
    return calculateSeismicDetailing('column', { b, h, d: d_eff, db: barDiam, ds: stirrupDiam, s: stirrupSpacing, fc });
  }, [b, h, cover, barDiam, stirrupDiam, stirrupSpacing, fc]);

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
    { label: 'Axial Capacity (phiNu)', value: capacity.phiNu.toFixed(0), unit: 'kN', status: isSafe ? 'pass' : 'fail' },
    { label: 'Biaxial Ratio', value: capacity.ratio.toFixed(2), status: isSafe ? 'pass' : 'fail' },
  ];

  const procedure = `
# AS 3600 Column Design Procedure (AS 1170 Loads)
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
    return generateColumnInteractionDiagram(b, h, Ast, { fc, fsy, Es: 200000 });
  }, [b, h, Ast, fc, fsy]);

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
            <InputGroup title="Materials Database">
              <MaterialSelector fc={fc} setFc={setFc} fsy={fsy} setFsy={setFsy} />
            </InputGroup>
            <LoadCombinationSelector selectedId={selectedComboId} onSelect={setSelectedComboId} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputGroup title="Section Library">
              <div className="p-4 bg-gray-50 space-y-4 border-b border-line">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest opacity-40 mb-2">
                  <Layout size={12} /> Select Preset
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SECTION_LIBRARY.columns.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleSectionSelect(s.id)}
                      className={cn(
                        "px-3 py-2 text-[10px] font-mono border transition-all text-left",
                        b === s.b && h === s.h ? "bg-ink text-white border-ink shadow-sm" : "bg-white border-line text-ink/60 hover:border-ink hover:text-ink"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </InputGroup>
            <InputGroup title="Geometry & Support">
              <InputField label="Width (b)" value={b} onChange={setB} unit="mm" />
              <InputField label="Depth (h)" value={h} onChange={setH} unit="mm" />
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
          </div>

          <InputGroup title="Design Loads (AS 1170)">
            <div className="grid grid-cols-1 md:grid-cols-2">
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
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Mx*" value={mxStar} onChange={setMxStar} unit="kNm" />
                <InputField label="My*" value={myStar} onChange={setMyStar} unit="kNm" />
              </div>
            </div>
          </InputGroup>

          {/* Interaction Diagram */}
          <div className="brutal-card p-8 bg-white bg-grid">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] mb-8 opacity-40">Simplified Interaction Diagram (φNu vs φMu)</h3>
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
                    label={{ value: 'Moment (M*)', position: 'bottom', offset: 0, fontSize: 10, fontFamily: 'monospace', opacity: 0.4 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Axial" 
                    unit=" kN" 
                    stroke="#1a1a1a"
                    tick={{ fontSize: 10, fontFamily: 'monospace' }}
                    label={{ value: 'Axial (N*)', angle: -90, position: 'left', offset: 0, fontSize: 10, fontFamily: 'monospace', opacity: 0.4 }}
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
        </div>

        {/* Results */}
        <div className="space-y-8">
          <InputGroup title="Capacity Checks">
            <ResultRow label="Axial Capacity (φNu)" value={capacity.phiNu.toFixed(0)} unit="kN" />
            <ResultRow label="Axial Ratio" value={(nStar / capacity.phiNu).toFixed(2)} />
            <ResultRow label="Biaxial Check" value={isSafe ? 'Safe' : 'Unsafe'} status={isSafe ? 'pass' : 'fail'} />
          </InputGroup>

          <InputGroup title="Slenderness">
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
