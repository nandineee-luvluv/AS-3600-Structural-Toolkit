import React, { useState, useMemo, useEffect } from 'react';
import { InputGroup, InputField, ResultRow } from '../ui/InputGrid';
import { 
  calculateFlexuralCapacity, 
  checkSlabDeflection, 
  calculatePunchingShear, 
  calculateTwoWaySlabMoments,
  calculateBearingPressure,
  calculateFootingOneWayShear,
  calculateFlatPlateMoments,
  checkCrackControl,
  getMinimumReinforcement,
  validateInput, 
  BEAM_END_CONDITIONS,
  REINFORCEMENT_TYPES,
  EXPOSURE_CLASSES,
  FIRE_RATINGS,
  getRequiredCover,
  checkNCCCompliance
} from '../../lib/as3600';
import { Info, AlertTriangle, CheckCircle2, Grid3x3, XCircle, Layout, ShieldCheck } from 'lucide-react';
import { 
  ProfessionalInputGroup, 
  QuickMaterialSelector, 
  DesignComplianceSummary 
} from '../ui/CalculatorWrappers';
import { DesignResultCard } from '../ui/ProfessionalComponents';
import { MaterialSelector } from '../ui/MaterialSelector';
import { LoadCombinationSelector } from '../ui/LoadCombinationSelector';
import { ExportActions } from '../ui/ExportActions';
import { ComplianceInfo } from '../ui/ComplianceInfo';
import { SectionLibraryManager } from '../SectionLibraryManager';
import { useHistory } from '../../contexts/HistoryContext';
import { useLoadCombinations } from '../../contexts/LoadCombinationContext';
import { useSections } from '../../contexts/SectionContext';
import { useMaterials } from '../../contexts/MaterialContext';
import { cn } from '../../lib/utils';

const SlabDiagram: React.FC<{ type: string; data: any }> = ({ type, data }) => {
  const { h, Lx, Ly, ribSpacing, ribWidth, toppingThickness } = data;
  
  if (type === 'waffle') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M 0 20 L 100 20 L 100 35 L 85 35 L 85 80 L 65 80 L 65 35 L 35 35 L 35 80 L 15 80 L 15 35 L 0 35 Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <text x="50" y="15" fontSize="6" textAnchor="middle" className="fill-current opacity-40">h={h}mm</text>
        <text x="50" y="30" fontSize="4" textAnchor="middle" className="fill-current opacity-20">tf={toppingThickness}mm</text>
        <text x="75" y="88" fontSize="4" textAnchor="middle" className="fill-current opacity-20">bw={ribWidth}mm</text>
      </svg>
    );
  }
  
  if (type === 'footing') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="10" y="30" width="80" height="30" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="40" y="10" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M 10 60 L 10 80 M 30 60 L 30 80 M 50 60 L 50 80 M 70 60 L 70 80 M 90 60 L 90 80" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="opacity-40" />
        <text x="50" y="5" fontSize="6" textAnchor="middle" className="fill-current opacity-40">Footing</text>
        <text x="95" y="45" fontSize="6" textAnchor="middle" transform="rotate(90 95 45)" className="fill-current opacity-40">h={h}</text>
      </svg>
    );
  }

  if (type === 'flat-plate') {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="10" y="30" width="80" height="40" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="30" y1="30" x2="30" y2="70" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 1" opacity="0.4" />
        <line x1="70" y1="30" x2="70" y2="70" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 1" opacity="0.4" />
        <text x="50" y="25" fontSize="4" textAnchor="middle" className="fill-current opacity-40">Flat Plate (Strips)</text>
        <text x="20" y="45" fontSize="3" textAnchor="middle" className="fill-current opacity-30">Col Strip</text>
        <text x="50" y="45" fontSize="3" textAnchor="middle" className="fill-current opacity-30">Mid Strip</text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect x="5" y="40" width="90" height="20" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M 10 55 L 90 55" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="opacity-40" />
      <text x="50" y="35" fontSize="6" textAnchor="middle" className="fill-current opacity-40">h={h}mm</text>
      <text x="50" y="68" fontSize="6" textAnchor="middle" className="fill-current opacity-40">Lx={Lx}mm</text>
    </svg>
  );
};

const SlabCalculator: React.FC = () => {
  const { addToHistory } = useHistory();
  const { combinations } = useLoadCombinations();
  const { library } = useSections();
  const { customMaterials, addMaterial } = useMaterials();
  
  // Slab Type
  const [slabType, setSlabType] = useState<'one-way' | 'two-way' | 'waffle' | 'footing' | 'flat-plate'>('one-way');

  // Section Geometry
  const [h, setH] = useState(200);
  const [cover, setCover] = useState(25);
  const [Lx, setLx] = useState(4000); // Short span
  const [Ly, setLy] = useState(6000); // Long span
  const [endConditionId, setEndConditionId] = useState('simply-supported');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  // NCC & Durability
  const [exposureClass, setExposureClass] = useState('A1');
  const [fireRating, setFireRating] = useState('60');

  // Waffle Specific
  const [ribSpacing, setRibSpacing] = useState(600);
  const [ribWidth, setRibWidth] = useState(150);
  const [toppingThickness, setToppingThickness] = useState(75);

  // Footing Specific
  const [footingWidth, setFootingWidth] = useState(2000);
  const [footingLength, setFootingLength] = useState(2000);
  const [allowableBearing, setAllowableBearing] = useState(150); // kPa
  const [nStarFooting, setNStarFooting] = useState(1000); // kN
  const [mxStarFooting, setMxStarFooting] = useState(50); // kNm
  const [myStarFooting, setMyStarFooting] = useState(50); // kNm

  const handleSectionSelect = (section: any) => {
    setSlabType(section.shape || 'one-way');
    setH(section.h || 200);
    setLx(section.Lx || 4000);
    setLy(section.Ly || 6000);
    setCover(section.cover || 25);
  };

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
  const combo = combinations.find(c => c.id === selectedComboId) || combinations[0] || { factors: { G: 1.2, Q: 1.5, W: 0, E: 0 } };
  const endCondition = BEAM_END_CONDITIONS.find(ec => ec.id === endConditionId) || BEAM_END_CONDITIONS[0];
  
  const qStar = gLoad * combo.factors.G + qLoad * combo.factors.Q + wLoad * combo.factors.W + eLoad * combo.factors.E;

  const d = h - cover - barDiam / 2;
  const AstX = (1000 / barSpacingX) * (Math.PI * Math.pow(barDiam, 2)) / 4;
  const AstY = (1000 / barSpacingY) * (Math.PI * Math.pow(barDiam, 2)) / 4;

  const twoWayMoments = useMemo(() => {
    if (slabType !== 'two-way') return { mxStar: 0, myStar: 0 };
    return calculateTwoWaySlabMoments(Lx, Ly, qStar, endConditionId !== 'simply-supported');
  }, [slabType, Lx, Ly, qStar, endConditionId]);

  const stripMoments = useMemo(() => {
    if (slabType !== 'flat-plate') return null;
    return calculateFlatPlateMoments(Lx, Ly, qStar);
  }, [slabType, Lx, Ly, qStar]);

  const mxStar = useMemo(() => {
    if (slabType === 'two-way') return twoWayMoments.mxStar;
    if (slabType === 'flat-plate') return stripMoments?.columnStrip.neg || 0;
    if (slabType === 'footing') return mxStarFooting;
    return endCondition.k_moment * qStar * Math.pow(Lx/1000, 2);
  }, [slabType, twoWayMoments, stripMoments, mxStarFooting, endCondition, qStar, Lx]);

  const myStar = useMemo(() => {
    if (slabType === 'two-way') return twoWayMoments.myStar;
    if (slabType === 'footing') return myStarFooting;
    return 0;
  }, [slabType, twoWayMoments, myStarFooting]);

  const flexureX = useMemo(() => {
    const b = slabType === 'waffle' ? ribSpacing : 1000;
    const effectiveH = slabType === 'waffle' ? h : h;
    const effectiveAst = slabType === 'waffle' ? (AstX * ribSpacing / 1000) : AstX;
    
    return calculateFlexuralCapacity(
      { 
        shape: slabType === 'waffle' ? 't-beam' : 'rectangular',
        b: b,
        bf: slabType === 'waffle' ? ribSpacing : undefined,
        tf: slabType === 'waffle' ? toppingThickness : undefined,
        tw: slabType === 'waffle' ? ribWidth : undefined,
        d, 
        h: effectiveH, 
        Ast: effectiveAst 
      },
      { fc, fsy, Es: 200000 }
    );
  }, [slabType, ribSpacing, ribWidth, toppingThickness, h, d, AstX, fc, fsy]);

  const flexureY = useMemo(() => {
    if (slabType !== 'two-way' && slabType !== 'footing') return null;
    return calculateFlexuralCapacity(
      { b: 1000, d: d - barDiam, h, Ast: AstY },
      { fc, fsy, Es: 200000 }
    );
  }, [slabType, d, h, AstY, fc, fsy, barDiam]);

  const bearing = useMemo(() => {
    if (slabType !== 'footing') return null;
    return calculateBearingPressure(nStarFooting, mxStarFooting, myStarFooting, footingWidth, footingLength);
  }, [slabType, nStarFooting, mxStarFooting, myStarFooting, footingWidth, footingLength]);

  const deflection = useMemo(() => {
    if (slabType === 'footing') return { isSafe: true, ratio: 0, limit: 100 };
    return checkSlabDeflection(Lx, d, endConditionId !== 'simply-supported');
  }, [Lx, d, endConditionId, slabType]);

  const punching = useMemo(() => {
    const colSize = 500;
    const u = 4 * (colSize + d); // Assume 500x500 column
    const beta_h = 1.0; // Aspect ratio of column
    const vStar = slabType === 'footing' ? nStarFooting : vStarPunch;
    return calculatePunchingShear(h, d, fc, u, vStar, beta_h);
  }, [h, d, fc, vStarPunch, slabType, nStarFooting]);

  const footingShear = useMemo(() => {
    if (slabType !== 'footing' || !bearing) return null;
    return calculateFootingOneWayShear(h, d, fc, footingWidth, footingLength, bearing.q_max);
  }, [slabType, h, d, fc, footingWidth, footingLength, bearing]);

  const statusX = flexureX.phiMu >= mxStar ? 'pass' : 'fail';
  const statusY = flexureY ? (flexureY.phiMu >= myStar ? 'pass' : 'fail') : 'pass';
  const statusBearing = bearing ? (bearing.q_max <= allowableBearing ? 'pass' : 'fail') : 'pass';
  const statusFootingShear = footingShear ? (footingShear.isSafe ? 'pass' : 'fail') : 'pass';
  const statusDeflection = deflection.isSafe ? 'pass' : 'fail';
  const statusPunching = punching.isSafe ? 'pass' : 'fail';
  const flexureStatus = (statusX === 'pass' && statusY === 'pass') ? 'pass' : 'fail';
  const overallStatus = (flexureStatus === 'pass' && statusPunching === 'pass' && statusDeflection === 'pass' && statusBearing === 'pass' && statusFootingShear === 'pass') ? 'pass' : 'fail';

  // NCC Compliance Calculations
  const requiredCover = getRequiredCover(exposureClass, fireRating);
  const isDurable = cover >= requiredCover;
  const minB = FIRE_RATINGS.find(f => f.id === fireRating)?.minCover || 0; // For slabs, cover is often the fire limit
  const isFireSafe = h >= (minB * 2); // Simplified check for slab thickness vs fire cover
  const isStructuralSafe = overallStatus === 'pass';
  const isNCCCompliant = checkNCCCompliance({ isStructuralSafe, isFireSafe, isDurable });

  // Refined Checks
  const minAst = getMinimumReinforcement(1000, h, fc, fsy);
  const isMinAstPass = AstX >= minAst;

  const crackControl = useMemo(() => {
    const z = 0.9 * d;
    const sigma_s = (Math.abs(mxStar) * 1e6) / (AstX * z);
    return checkCrackControl(barDiam, barSpacingX, sigma_s, exposureClass);
  }, [mxStar, AstX, d, barDiam, barSpacingX, exposureClass]);

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
    { label: 'Slab Type', value: slabType.toUpperCase() },
    { label: 'Thickness (h)', value: h, unit: 'mm' },
    { label: 'Span (Lx)', value: Lx, unit: 'mm' },
    ...(slabType === 'two-way' ? [{ label: 'Span (Ly)', value: Ly, unit: 'mm' }] : []),
    { label: 'Concrete Grade (fc)', value: fc, unit: 'MPa' },
    { label: 'Design Load (q*)', value: qStar.toFixed(1), unit: 'kPa' },
  ];

  const exportResults = [
    { 
      label: 'Flexural Capacity (phiMu_x)', 
      value: flexureX.phiMu.toFixed(1), 
      unit: 'kNm/m', 
      status: statusX,
      clause: '9.1',
      equation: '\\phi M_u = \\phi A_{st} f_{sy} (d - \\gamma k_u d / 2)'
    },
    {
      label: 'Min Reinforcement',
      value: minAst.toFixed(0),
      unit: 'mm2/m',
      status: isMinAstPass ? 'pass' : 'fail',
      clause: '9.1.1',
      equation: 'A_{st,min} = 0.2 (h/d)^2 (f\'_{ct.f}/f_{sy}) b d'
    },
    {
      label: 'Crack Control',
      value: crackControl.isSafe ? 'PASS' : 'FAIL',
      status: crackControl.isSafe ? 'pass' : 'fail',
      clause: '9.4.1',
      description: `Max spacing: ${crackControl.maxSpacing}mm, Max bar: ${crackControl.maxBarDiam}mm`
    },
    ...(flexureY ? [{ 
      label: 'Flexural Capacity (phiMu_y)', 
      value: flexureY.phiMu.toFixed(1), 
      unit: 'kNm/m', 
      status: statusY,
      clause: '9.1'
    }] : []),
    ...(bearing ? [{
      label: 'Max Bearing Pressure',
      value: bearing.q_max.toFixed(1),
      unit: 'kPa',
      status: statusBearing,
      clause: 'Foundations'
    }] : []),
    { 
      label: 'Span/Depth Ratio', 
      value: deflection.ratio.toFixed(1), 
      status: statusDeflection,
      clause: '9.4.4.1',
      equation: 'L/d \\le k_1 \\cdot k_2 \\cdot 30'
    },
    { 
      label: 'Punching Capacity', 
      value: punching.phiVuo.toFixed(0), 
      unit: 'kN', 
      status: statusPunching,
      clause: '9.2',
      equation: '\\phi V_{uo} = \\phi f_{cv} u d'
    },
  ];

  const reinforcementType = REINFORCEMENT_TYPES.find(t => t.fsy === fsy)?.label || `${fsy} MPa Steel`;

  const procedure = `
# AS 3600 Slab Design Procedure (${slabType.toUpperCase()})
Reinforcement: ${reinforcementType}
q_star = g*G + q*Q + w*W + e*E
${slabType === 'two-way' ? 'm_star_x = Cx * q_star * Lx^2\nm_star_y = Cy * q_star * Lx^2' : 'm_star = k_moment * q_star * Lx^2'}
d = h - cover - bar_diam / 2
ast = (1000 / spacing) * (3.14159 * bar_diam**2 / 4)
alpha2 = max(0.67, 0.85 - 0.0015 * fc)
gamma = max(0.67, 0.97 - 0.0025 * fc)
ku = (ast * fsy) / (alpha2 * fc * 1000 * gamma * d)
mu = ast * fsy * (d - (gamma * ku * d) / 2) * 1e-6
phi_mu = 0.85 * mu
  `;

  return (
    <div className="space-y-12">
      <header className="flex items-end justify-between border-b border-line pb-8">
        <div>
          <h2 className="text-4xl font-serif font-bold italic tracking-tight text-ink">Slab Design</h2>
          <p className="text-[10px] font-mono opacity-40 uppercase tracking-[0.3em] mt-2">
            {slabType.replace('-', ' ')} Reinforced Concrete Slab
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ExportActions 
            title={`${slabType.replace('-', ' ').toUpperCase()} Slab Design Report`} 
            inputs={exportInputs} 
            results={exportResults} 
            procedure={procedure}
            filename={`slab_${slabType}_${h}mm`}
          />
          <div className={cn(
            "px-4 py-2 border border-ink shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]",
            overallStatus === 'pass' ? 'bg-green-50' : 'bg-red-50'
          )}>
            <div className="text-[8px] font-mono uppercase opacity-40 leading-none mb-1">Overall</div>
            <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wider">
              {overallStatus === 'pass' ? <CheckCircle2 size={12} className="text-green-600" /> : <XCircle size={12} className="text-red-600" />}
              {overallStatus}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
        {['one-way', 'two-way', 'flat-plate', 'waffle', 'footing'].map((type) => (
          <button
            key={type}
            onClick={() => setSlabType(type as any)}
            className={cn(
              "px-6 py-2 text-[10px] font-mono uppercase tracking-widest transition-all rounded-md",
              slabType === type 
                ? "bg-white text-ink shadow-sm font-bold border border-line" 
                : "text-ink/40 hover:text-ink/60"
            )}
          >
            {type.replace('-', ' ')}
          </button>
        ))}
      </div>

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
              <SectionLibraryManager type="slabs" onSelect={handleSectionSelect} />
            </div>
            <InputGroup title="Materials">
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
                <InputField label="Concrete Cover" value={cover} onChange={setCover} unit="mm" />
              </div>
            </InputGroup>

            <InputGroup title="Geometry">
              {slabType === 'footing' ? (
                <>
                  <InputField label="Width (B)" value={footingWidth} onChange={setFootingWidth} unit="mm" />
                  <InputField label="Length (L)" value={footingLength} onChange={setFootingLength} unit="mm" />
                  <InputField label="Thickness (h)" value={h} onChange={setH} unit="mm" />
                </>
              ) : (
                <>
                  <InputField label="Thickness (h)" value={h} onChange={setH} unit="mm" />
                  <InputField label="Short Span (Lx)" value={Lx} onChange={setLx} unit="mm" />
                  {slabType === 'two-way' && <InputField label="Long Span (Ly)" value={Ly} onChange={setLy} unit="mm" />}
                </>
              )}
              
              {slabType === 'waffle' && (
                <div className="p-4 bg-accent/5 border-y border-accent/10 space-y-4">
                  <p className="text-[8px] font-mono uppercase tracking-widest text-accent font-bold">Waffle Rib Details</p>
                  <InputField label="Rib Spacing" value={ribSpacing} onChange={setRibSpacing} unit="mm" />
                  <InputField label="Rib Width" value={ribWidth} onChange={setRibWidth} unit="mm" />
                  <InputField label="Topping" value={toppingThickness} onChange={setToppingThickness} unit="mm" />
                </div>
              )}

              {slabType !== 'footing' && (
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
              )}
              <InputField label="Concrete Cover" value={cover} onChange={setCover} unit="mm" />
            </InputGroup>

            <InputGroup title="Reinforcement">
              <InputField label="Bar Diameter" value={barDiam} onChange={setBarDiam} unit="mm" />
              <InputField label="Spacing X" value={barSpacingX} onChange={setBarSpacingX} unit="mm" />
              {(slabType === 'two-way' || slabType === 'footing') && (
                <InputField label="Spacing Y" value={barSpacingY} onChange={setBarSpacingY} unit="mm" />
              )}
            </InputGroup>
          </div>

          <InputGroup title="Design Actions">
            {slabType === 'footing' ? (
              <>
                <InputField label="Axial Load (N*)" value={nStarFooting} onChange={setNStarFooting} unit="kN" />
                <InputField label="Moment (Mx*)" value={mxStarFooting} onChange={setMxStarFooting} unit="kNm" />
                <InputField label="Moment (My*)" value={myStarFooting} onChange={setMyStarFooting} unit="kNm" />
                <InputField label="Allowable Bearing" value={allowableBearing} onChange={setAllowableBearing} unit="kPa" />
              </>
            ) : (
              <>
                <InputField label="Dead (G)" value={gLoad} onChange={setGLoad} unit="kPa" />
                <InputField label="Live (Q)" value={qLoad} onChange={setQLoad} unit="kPa" />
                <InputField label="Wind (Wu)" value={wLoad} onChange={setWLoad} unit="kPa" />
                <InputField label="Seismic (Eu)" value={eLoad} onChange={setELoad} unit="kPa" />
                <InputField label="Factored Load (q*)" value={qStar.toFixed(1)} onChange={() => {}} unit="kPa" />
                <InputField label="Punching Shear (V*)" value={vStarPunch} onChange={setVStarPunch} unit="kN" />
              </>
            )}
          </InputGroup>

          {/* Visualization */}
          <div className="brutal-card p-12 flex flex-col items-center gap-8 bg-white bg-grid min-h-[300px] justify-center">
            <div className="w-64 h-64 text-ink">
              <SlabDiagram type={slabType} data={{ h, Lx, Ly, ribSpacing, ribWidth, toppingThickness }} />
            </div>
          </div>
        </div>

        {/* Results */}
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
                  tooltip={`Min thickness for ${fireRating}min FRP is ${minB * 2}mm`}
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

          <div className="p-6 bg-white border-2 border-ink shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[12px] font-mono font-bold uppercase tracking-widest">Design Summary</h3>
              <div className={cn(
                "px-2 py-0.5 text-[8px] font-mono uppercase border border-ink",
                overallStatus === 'pass' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              )}>
                {overallStatus}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[8px] font-mono uppercase opacity-40">Flexure Ratio</p>
                <p className="text-lg font-serif font-bold italic">{(mxStar / flexureX.phiMu).toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-mono uppercase opacity-40">Punching Ratio</p>
                <p className="text-lg font-serif font-bold italic">{( (slabType === 'footing' ? nStarFooting : vStarPunch) / punching.phiVuo).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <InputGroup title="Flexural Capacity">
            {slabType === 'flat-plate' && stripMoments ? (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-sm">
                  <p className="text-[8px] font-mono uppercase text-blue-600 font-bold mb-2">Column Strip (Design)</p>
                  <ResultRow label="Negative M*" value={stripMoments.columnStrip.neg.toFixed(1)} unit="kNm" />
                  <ResultRow label="Positive M*" value={stripMoments.columnStrip.pos.toFixed(1)} unit="kNm" />
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-sm">
                  <p className="text-[8px] font-mono uppercase text-gray-600 font-bold mb-2">Middle Strip</p>
                  <ResultRow label="Negative M*" value={stripMoments.middleStrip.neg.toFixed(1)} unit="kNm" />
                  <ResultRow label="Positive M*" value={stripMoments.middleStrip.pos.toFixed(1)} unit="kNm" />
                </div>
                <div className="h-px bg-line my-2" />
              </div>
            ) : null}
            <ResultRow label={slabType === 'flat-plate' ? "Col. Strip Capacity" : "Design Moment (Mx*)"} value={slabType === 'flat-plate' ? flexureX.phiMu.toFixed(1) : mxStar.toFixed(1)} unit="kNm/m" />
            {slabType !== 'flat-plate' && <ResultRow label="Capacity (φMu_x)" value={flexureX.phiMu.toFixed(1)} unit="kNm/m" status={statusX} />}
            {flexureY && (
              <>
                <div className="h-px bg-line my-2" />
                <ResultRow label="Design Moment (My*)" value={myStar.toFixed(1)} unit="kNm/m" />
                <ResultRow label="Capacity (φMu_y)" value={flexureY.phiMu.toFixed(1)} unit="kNm/m" status={statusY} />
              </>
            )}
          </InputGroup>

          {bearing && (
            <InputGroup title="Bearing Pressure">
              <ResultRow label="Max Pressure (q_max)" value={bearing.q_max.toFixed(1)} unit="kPa" status={statusBearing} />
              <ResultRow label="Min Pressure (q_min)" value={bearing.q_min.toFixed(1)} unit="kPa" />
              <ResultRow label="Allowable" value={allowableBearing} unit="kPa" />
            </InputGroup>
          )}

          <InputGroup title="Serviceability & Punching">
            {slabType !== 'footing' && (
              <>
                <ResultRow label="Span/Depth Ratio" value={deflection.ratio.toFixed(1)} status={statusDeflection} />
                <ResultRow label="Ratio Limit" value={deflection.limit.toFixed(1)} />
                <ResultRow 
                  label="Crack Control" 
                  value={crackControl.isSafe ? 'PASS' : 'FAIL'} 
                  status={crackControl.isSafe ? 'pass' : 'fail'} 
                  tooltip={`Clause 9.4.1: Max spacing ${crackControl.maxSpacing}mm, Max bar ${crackControl.maxBarDiam}mm`}
                />
              </>
            )}
            <ResultRow label="Punching Capacity" value={punching.phiVuo.toFixed(0)} unit="kN" status={statusPunching} />
            {footingShear && (
              <>
                <div className="h-px bg-line my-2" />
                <ResultRow label="Footing Shear (φVu)" value={footingShear.phiVu.toFixed(0)} unit="kN" status={statusFootingShear} />
                <ResultRow label="Design Shear (V*)" value={footingShear.VStar.toFixed(0)} unit="kN" />
              </>
            )}
          </InputGroup>

          <InputGroup title="Reinforcement Limits">
            <ResultRow 
              label="Min Reinforcement" 
              value={`${AstX.toFixed(0)} / ${minAst.toFixed(0)}`} 
              unit="mm2/m" 
              status={isMinAstPass ? 'pass' : 'fail'} 
              tooltip="Clause 9.1.1: Minimum reinforcement to control cracking and ensure ductility."
            />
            <ResultRow label="Max Spacing (3h)" value={barSpacingX <= Math.min(3 * h, 500) ? 'Pass' : 'Fail'} status={barSpacingX <= Math.min(3 * h, 500) ? 'pass' : 'fail'} />
          </InputGroup>

          {/* Professional Results Section */}
          <div className="space-y-6 mt-12 pt-12 border-t-2 border-slate-200">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-blue-600 rounded-full" />
              <h3 className="text-2xl font-bold text-slate-900">Professional Design Results</h3>
            </div>

            {/* Flexural Design Results */}
            <ProfessionalInputGroup 
              title={`Flexural Design (ULS) - AS 3600 Clause ${slabType === 'one-way' ? '8.1' : '8.3'}`}
              description={slabType === 'one-way' ? 'One-way linear design with rectangular stress block' : slabType === 'two-way' ? 'Two-way design with simplified moment coefficients' : slabType === 'waffle' ? 'Waffle slab as series of T-beams' : 'Footing bearing and bending design'}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DesignResultCard
                  title="Applied Moment X (Mx*)"
                  value={mxStar.toFixed(2)}
                  unit="kNm/m"
                  status={statusX === 'pass' ? 'pass' : 'fail'}
                  reference="AS 1170 Load Combination"
                  details={`Design moment in X direction`}
                />
                <DesignResultCard
                  title="Capacity X (φMu_x)"
                  value={flexureX.phiMu.toFixed(2)}
                  unit="kNm/m"
                  status={statusX === 'pass' ? 'pass' : 'fail'}
                  reference="AS 3600 Clause 8.1"
                  details={`φ = 0.85 | Capacity ratio: ${(mxStar / flexureX.phiMu).toFixed(2)}`}
                />
                {flexureY && (
                  <>
                    <DesignResultCard
                      title="Applied Moment Y (My*)"
                      value={myStar.toFixed(2)}
                      unit="kNm/m"
                      status={statusY === 'pass' ? 'pass' : 'fail'}
                      reference="AS 1170 Load Combination"
                      details={`Design moment in Y direction`}
                    />
                    <DesignResultCard
                      title="Capacity Y (φMu_y)"
                      value={flexureY.phiMu.toFixed(2)}
                      unit="kNm/m"
                      status={statusY === 'pass' ? 'pass' : 'fail'}
                      reference="AS 3600 Clause 8.1 / 8.3"
                      details={`φ = 0.85 | Capacity ratio: ${(myStar / flexureY.phiMu).toFixed(2)}`}
                    />
                  </>
                )}
                <DesignResultCard
                  title="Reinforcement Area (As_x)"
                  value={AstX.toFixed(0)}
                  unit="mm²/m"
                  status={isMinAstPass ? 'pass' : 'fail'}
                  reference="AS 3600 Clause 9.1.1"
                  details={`Min: ${minAst.toFixed(0)} mm²/m | Max: ${((h * 1000) * 0.04).toFixed(0)} mm²/m`}
                />
                <DesignResultCard
                  title="Bar Spacing"
                  value={barSpacingX.toFixed(0)}
                  unit="mm"
                  status={barSpacingX <= Math.min(3 * h, 500) ? 'pass' : 'fail'}
                  reference="AS 3600 Clause 9.4.1"
                  details={`Max: ${Math.min(3 * h, 500).toFixed(0)}mm | For crack control`}
                />
              </div>
            </ProfessionalInputGroup>

            {/* Punching/Bearing Results */}
            <ProfessionalInputGroup 
              title={slabType === 'footing' ? 'Bearing & Shear Design (ULS) - AS 3600 Clause 10.5' : 'Punching Shear Design (ULS) - AS 3600 Clause 8.4'}
              description={slabType === 'footing' ? 'Footing bearing pressure and one-way shear' : 'Punching shear at column/load interface'}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {slabType === 'footing' ? (
                  <>
                    <DesignResultCard
                      title="Max Bearing Pressure"
                      value={bearing?.q_max.toFixed(1) || 'N/A'}
                      unit="kPa"
                      status={statusBearing === 'pass' ? 'pass' : 'fail'}
                      reference="AS 3600 Clause 12.2"
                      details={`Allowable: ${allowableBearing} kPa`}
                    />
                    <DesignResultCard
                      title="Min Bearing Pressure"
                      value={bearing?.q_min.toFixed(1) || 'N/A'}
                      unit="kPa"
                      status="info"
                      reference="Footing design"
                      details={`Should be ≥ 0 (no tension)`}
                    />
                    <DesignResultCard
                      title="One-Way Shear (V*)"
                      value={footingShear?.VStar?.toFixed(0) || 'N/A'}
                      unit="kN"
                      status={statusFootingShear === 'pass' ? 'pass' : 'fail'}
                      reference="AS 3600 Clause 8.2"
                      details={`At depth d from face`}
                    />
                    <DesignResultCard
                      title="Shear Capacity (φVu)"
                      value={footingShear?.phiVu?.toFixed(0) || 'N/A'}
                      unit="kN"
                      status={statusFootingShear === 'pass' ? 'pass' : 'fail'}
                      reference="General method"
                      details={`φ = 0.85 | Capacity ratio: ${(footingShear ? (footingShear.VStar / footingShear.phiVu).toFixed(2) : 'N/A')}`}
                    />
                  </>
                ) : (
                  <>
                    <DesignResultCard
                      title="Applied Punching (V*)"
                      value={vStarPunch.toFixed(0)}
                      unit="kN"
                      status={statusPunching === 'pass' ? 'pass' : 'fail'}
                      reference="AS 1170 Load Combination"
                      details={`Design shear at column/load`}
                    />
                    <DesignResultCard
                      title="Punching Capacity (φVuo)"
                      value={punching.phiVuo.toFixed(0)}
                      unit="kN"
                      status={statusPunching === 'pass' ? 'pass' : 'fail'}
                      reference="AS 3600 Clause 8.4.2"
                      details={`φ = 0.85 | Capacity ratio: ${(vStarPunch / punching.phiVuo).toFixed(2)}`}
                    />
                    <DesignResultCard
                      title="Perimeter (u)"
                      value={punching.perimeter.toFixed(0)}
                      unit="mm"
                      status="info"
                      reference="Critical section at d/2 from column"
                      details={`Effective depth: ${punching.deff.toFixed(0)}mm`}
                    />
                    <DesignResultCard
                      title="Database Check"
                      value={punching.phiVuo.toFixed(0)}
                      unit="kN"
                      status="info"
                      reference="AS 3600 Clause 8.4"
                      details={`Concrete contribution calculated`}
                    />
                  </>
                )}
              </div>
            </ProfessionalInputGroup>

            {/* Serviceability Checks */}
            <ProfessionalInputGroup 
              title="Serviceability Checks (SLS) - AS 3600 Clauses 9.2 & 9.4" 
              description="Deflection and crack width compliance"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DesignResultCard
                  title="Deflection Ratio"
                  value={`L/${deflection.ratio.toFixed(1)}`}
                  status={statusDeflection === 'pass' ? 'pass' : 'fail'}
                  reference="AS 3600 Clause 9.4.4"
                  details={`Limit: L/${deflection.limit.toFixed(1)} | ${statusDeflection}`}
                />
                <DesignResultCard
                  title="Crack Control"
                  value={crackControl.isSafe ? 'COMPLIANT' : 'EXCEED'}
                  status={crackControl.isSafe ? 'pass' : 'fail'}
                  reference="AS 3600 Clause 9.4.1"
                  details={`Max spacing: ${crackControl.maxSpacing}mm | Max bar: ${crackControl.maxBarDiam}mm`}
                />
              </div>
            </ProfessionalInputGroup>

            {/* Durability & Fire Results */}
            <ProfessionalInputGroup 
              title="Durability & Fire Safety - NCC 2022" 
              description="Exposure classification and fire resistance requirements"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DesignResultCard
                  title="Required Cover"
                  value={requiredCover}
                  unit="mm"
                  status={isDurable ? 'pass' : 'fail'}
                  reference={`Exposure: ${exposureClass}`}
                  details={`Required: ${requiredCover}mm | Provided: ${cover}mm`}
                />
                <DesignResultCard
                  title="Fire Rating"
                  value={fireRating}
                  unit="min"
                  status={isFireSafe ? 'pass' : 'fail'}
                  reference="AS 3600 Clause 20.3"
                  details={`Min thickness for ${fireRating}min FRP: ${minB * 2}mm | Provided: ${(h * 1000).toFixed(0)}mm`}
                />
                <DesignResultCard
                  title="Compliance Status"
                  value={isNCCCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                  status={isNCCCompliant ? 'pass' : 'fail'}
                  reference="NCC Performance Requirements B1.1 & B1.2"
                  details={`Strength: ${isStructuralSafe ? 'Pass' : 'Fail'} | Fire: ${isFireSafe ? 'Pass' : 'Fail'} | Durability: ${isDurable ? 'Pass' : 'Fail'}`}
                />
              </div>
            </ProfessionalInputGroup>
          </div>

          <div className="p-6 bg-ink text-white rounded-sm space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">
              <Info size={12} />
              <span>Design Notes</span>
            </div>
            <p className="text-[10px] font-mono leading-relaxed opacity-80">
              {slabType === 'one-way' && "One-way slab behavior assumed. Deflection check uses simplified span-to-depth ratio (Clause 9.4.4.1)."}
              {slabType === 'two-way' && "Two-way slab moments calculated using simplified coefficients based on aspect ratio Ly/Lx."}
              {slabType === 'waffle' && "Waffle slab analyzed as a series of T-beams. Rib spacing and topping thickness define the effective section."}
              {slabType === 'footing' && "Footing design includes bearing pressure checks and punching shear at d/2 from column face."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlabCalculator;
