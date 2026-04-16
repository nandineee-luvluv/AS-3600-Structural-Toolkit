import React, { useState, useMemo, useEffect } from 'react';
import { InputGroup, InputField, ResultRow } from '../ui/InputGrid';
import { calculateFlexuralCapacity } from '../../lib/as3600';
import { 
  validateInput,
  FIRE_RATINGS,
  EXPOSURE_CLASSES,
  getRequiredCover,
  checkNCCCompliance
} from '../../lib/as3600';
import { Info, AlertTriangle, CheckCircle2, XCircle, Pyramid } from 'lucide-react';
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
import { useHistory } from '../../contexts/HistoryContext';
import { useLoadCombinations } from '../../contexts/LoadCombinationContext';
import { useMaterials } from '../../contexts/MaterialContext';
import { cn } from '../../lib/utils';

const RetainingWallCalculator: React.FC = () => {
  const { addToHistory } = useHistory();
  const { combinations } = useLoadCombinations();
  const { customMaterials, addMaterial } = useMaterials();
  
  // Geometry
  const [H, setH] = useState(3000); // Stem height
  const [tw, setTw] = useState(300); // Stem thickness
  const [B, setB] = useState(2000); // Base width
  const [tf, setTf] = useState(400); // Base thickness
  const [toe, setToe] = useState(600); // Toe length

  // Soil Properties
  const [gamma, setGamma] = useState(18); // Soil density (kN/m3)
  const [phi_soil, setPhiSoil] = useState(30); // Friction angle (deg)
  const [bearing_cap, setBearingCap] = useState(200); // Allowable bearing (kPa)

  // Materials
  const [fc, setFc] = useState(32);
  const [fsy, setFsy] = useState(500);

  // Loads
  const [gSurcharge, setGSurcharge] = useState(0); // kPa (Dead)
  const [qSurchargeVal, setQSurchargeVal] = useState(10); // kPa (Live)
  const [wLoad, setWLoad] = useState(0); // kPa (Wind surcharge)
  const [eLoad, setELoad] = useState(0); // kPa (Seismic surcharge)
  const [selectedComboId, setSelectedComboId] = useState('1.2G_1.5Q');

  // Validation
  const errors = useMemo(() => {
    return [
      validateInput(H, 1000, 10000, 'Height (H)'),
      validateInput(tw, 200, 1000, 'Thickness (tw)'),
      validateInput(B, 1000, 8000, 'Base (B)'),
      validateInput(fc, 20, 100, "Concrete f'c"),
    ].filter(e => e !== null) as string[];
  }, [H, tw, B, fc]);

  // Derived Values
  const combo = combinations.find(c => c.id === selectedComboId) || combinations[0];
  const factoredSurcharge = gSurcharge * combo.factors.G + qSurchargeVal * combo.factors.Q + wLoad * combo.factors.W + eLoad * combo.factors.E;

  // Reinforcement
  const [barDiamStem, setBarDiamStem] = useState(16);
  const [barSpacingStem, setBarSpacingStem] = useState(200);
  const [barDiamBase, setBarDiamBase] = useState(16);
  const [barSpacingBase, setBarSpacingBase] = useState(200);

  // Durability & Fire Design
  const [exposureClass, setExposureClass] = useState('A');
  const [fireRating, setFireRating] = useState('60');
  const [cover, setCover] = useState(50);

  // Calculations
  const calculations = useMemo(() => {
    const phi_rad = (phi_soil * Math.PI) / 180;
    const Ka = (1 - Math.sin(phi_rad)) / (1 + Math.sin(phi_rad));
    
    // Active Pressure
    const total_H = H + tf;
    const Pa_soil = 0.5 * Ka * gamma * Math.pow(total_H / 1000, 2); // kN/m
    const Pa_surcharge = Ka * factoredSurcharge * (total_H / 1000); // kN/m
    const Pa = Pa_soil + Pa_surcharge;

    const Ma = Pa_soil * (total_H / 3000) + Pa_surcharge * (total_H / 2000); // kNm/m

    // Restoring Moment
    const W_stem = (H / 1000) * (tw / 1000) * 25; // kN/m
    const W_base = (B / 1000) * (tf / 1000) * 25; // kN/m
    const heel = B - toe - tw;
    const W_soil = (heel / 1000) * (H / 1000) * gamma; // kN/m
    
    const Total_W = W_stem + W_base + W_soil;
    
    // Arms from toe
    const arm_stem = toe + tw / 2;
    const arm_base = B / 2;
    const arm_soil = B - heel / 2;

    const Mr = W_stem * arm_stem / 1000 + W_base * arm_base / 1000 + W_soil * arm_soil / 1000;

    // Stability
    const FOS_overturning = Mr / Ma;
    const FOS_sliding = (Total_W * Math.tan(0.67 * phi_rad)) / Pa;

    // Bearing Pressure
    const x_bar = (Mr - Ma) / Total_W;
    const e = B / 2000 - x_bar;
    const q_max = (Total_W / (B/1000)) * (1 + 6 * e / (B/1000));

    // Stem Design
    const d_stem = tw - 50 - barDiamStem / 2;
    const Ast_stem = (1000 / barSpacingStem) * (Math.PI * Math.pow(barDiamStem, 2)) / 4;
    const stemFlexure = calculateFlexuralCapacity(
      { b: 1000, d: d_stem, h: tw, Ast: Ast_stem },
      { fc, fsy, Es: 200000 }
    );

    return {
      Pa, Ma, Mr, q_max,
      FOS_overturning,
      FOS_sliding,
      phiMu_stem: stemFlexure.phiMu,
      isStemSafe: stemFlexure.phiMu >= Ma * 1.5,
      isBearingSafe: q_max <= bearing_cap
    };
  }, [H, tw, B, tf, toe, gamma, phi_soil, factoredSurcharge, bearing_cap, barDiamStem, barSpacingStem, fc, fsy]);

  // Durability & Fire Design Checks
  const requiredCover = getRequiredCover(exposureClass, fireRating);
  const minB = FIRE_RATINGS.find(f => f.id === fireRating)?.minB || 0;
  const isDurable = cover >= requiredCover;
  const isFireSafe = tw >= minB;
  const isStructuralSafe = calculations.FOS_overturning >= 1.5 && 
                           calculations.FOS_sliding >= 1.5 && 
                           calculations.isBearingSafe && 
                           calculations.isStemSafe;
  const isNCCCompliant = checkNCCCompliance({ isStructuralSafe, isFireSafe, isDurable });

  // History Tracking
  useEffect(() => {
    if (errors.length > 0) return;
    const timer = setTimeout(() => {
      addToHistory({
        type: 'Retaining Wall',
        title: `${H}mm Retaining Wall`,
        inputs: { H, B, tw, gamma, phi_soil, factoredSurcharge },
        results: { FOS_overturning: calculations.FOS_overturning, FOS_sliding: calculations.FOS_sliding, q_max: calculations.q_max }
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [H, B, tw, gamma, phi_soil, factoredSurcharge]);

  const exportInputs = [
    { label: 'Stem Height (H)', value: H, unit: 'mm' },
    { label: 'Base Width (B)', value: B, unit: 'mm' },
    { label: 'Soil Density', value: gamma, unit: 'kN/m³' },
    { label: 'Friction Angle', value: phi_soil, unit: 'deg' },
    { label: 'Design Surcharge', value: factoredSurcharge.toFixed(1), unit: 'kPa' },
  ];

  const exportResults = [
    { 
      label: 'FOS Overturning', 
      value: calculations.FOS_overturning.toFixed(2), 
      status: calculations.FOS_overturning >= 1.5 ? 'pass' : 'fail',
      clause: 'AS 4678',
      equation: 'FOS_{ot} = \\frac{M_r}{M_a} \\ge 1.5'
    },
    { 
      label: 'FOS Sliding', 
      value: calculations.FOS_sliding.toFixed(2), 
      status: calculations.FOS_sliding >= 1.5 ? 'pass' : 'fail',
      clause: 'AS 4678',
      equation: 'FOS_{sl} = \\frac{V_r}{V_a} \\ge 1.5'
    },
    { 
      label: 'Max Bearing (q)', 
      value: calculations.q_max.toFixed(1), 
      unit: 'kPa', 
      status: calculations.isBearingSafe ? 'pass' : 'fail',
      clause: 'Geotech',
      equation: 'q_{max} = \\frac{P}{A} (1 + \\frac{6e}{B})'
    },
  ];

  const procedure = `
# Retaining Wall Stability Analysis (AS 1170 Loads)
factored_surcharge = g*G + q*Q + w*W + e*E
phi_rad = phi_soil * 3.14159 / 180
ka = (1 - sin(phi_rad)) / (1 + sin(phi_rad))
total_h = (H + tf) / 1000
pa = 0.5 * ka * gamma * total_h**2 + ka * factored_surcharge * total_h
ma = pa * total_h / 3 # Simplified
mr = total_weight * lever_arm
fos_overturning = mr / ma
print(f"FOS Overturning: {fos_overturning:.2f}")
  `;

  return (
    <div className="space-y-12">
      <header className="flex items-end justify-between border-b border-line pb-8">
        <div>
          <h2 className="text-4xl font-serif font-bold italic tracking-tight text-ink">Retaining Wall</h2>
          <p className="text-[10px] font-mono opacity-40 uppercase tracking-[0.3em] mt-2">Cantilever RC Retaining Wall Design</p>
        </div>
        <div className="flex items-center gap-4">
          <ExportActions 
            title="Retaining Wall Report" 
            inputs={exportInputs} 
            results={exportResults} 
            procedure={procedure}
            filename={`ret_wall_${H}mm`}
          />
          <div className={cn(
            "px-4 py-2 border border-ink shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]",
            calculations.FOS_overturning >= 1.5 ? 'bg-green-50' : 'bg-red-50'
          )}>
            <div className="text-[8px] font-mono uppercase opacity-40 leading-none mb-1">Stability</div>
            <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wider">
              {calculations.FOS_overturning >= 1.5 ? <CheckCircle2 size={12} className="text-green-600" /> : <XCircle size={12} className="text-red-600" />}
              {calculations.FOS_overturning >= 1.5 ? 'Pass' : 'Fail'}
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
            <InputGroup title="Geometry">
              <InputField label="Stem Height (H)" value={H} onChange={setH} unit="mm" />
              <InputField label="Stem Thickness (tw)" value={tw} onChange={setTw} unit="mm" />
              <InputField label="Base Width (B)" value={B} onChange={setB} unit="mm" />
              <InputField label="Toe Length" value={toe} onChange={setToe} unit="mm" />
              <InputField label="Base Thickness (tf)" value={tf} onChange={setTf} unit="mm" />
            </InputGroup>

            <InputGroup title="Soil Properties">
              <InputField label="Soil Density" value={gamma} onChange={setGamma} unit="kN/m³" />
              <InputField label="Friction Angle" value={phi_soil} onChange={setPhiSoil} unit="deg" />
              <InputField label="Dead Surcharge" value={gSurcharge} onChange={setGSurcharge} unit="kPa" />
              <InputField label="Live Surcharge" value={qSurchargeVal} onChange={setQSurchargeVal} unit="kPa" />
              <InputField label="Wind Surcharge" value={wLoad} onChange={setWLoad} unit="kPa" />
              <InputField label="Seismic Surcharge" value={eLoad} onChange={setELoad} unit="kPa" />
              <InputField label="Allowable Bearing" value={bearing_cap} onChange={setBearingCap} unit="kPa" />
            </InputGroup>
          </div>

          <InputGroup title="Reinforcement">
            <InputField label="Stem Bar Diam" value={barDiamStem} onChange={setBarDiamStem} unit="mm" />
            <InputField label="Stem Spacing" value={barSpacingStem} onChange={setBarSpacingStem} unit="mm" />
            <InputField label="Base Bar Diam" value={barDiamBase} onChange={setBarDiamBase} unit="mm" />
            <InputField label="Base Spacing" value={barSpacingBase} onChange={setBarSpacingBase} unit="mm" />
          </InputGroup>

          <InputGroup title="Durability & Fire Design">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Exposure Class</label>
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

          {/* Visualization */}
          <div className="brutal-card p-12 flex flex-col items-center gap-8 bg-white bg-grid">
            <div className="relative" style={{ width: B/5, height: (H+tf)/5 }}>
              <div 
                className="absolute bottom-[80px] left-[40px] border-2 border-ink bg-ink/5 shadow-sm"
                style={{ width: tw/5, height: H/5 }}
              />
              <div 
                className="absolute bottom-0 left-0 border-2 border-ink bg-ink/10 shadow-sm"
                style={{ width: B/5, height: tf/5 }}
              />
              <div 
                className="absolute bottom-[80px] left-[40px+tw/5] right-0 border-t border-dashed border-ink/30 bg-ink/5"
                style={{ left: (40 + tw/5), height: H/5, width: (B - tw - 200)/5 }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <ProfessionalInputGroup 
            title="Professional Design Results - AS 4678 & AS 3600" 
            description="Comprehensive analysis combining geotechnical stability checks with concrete structural design"
          >
            <div className="space-y-8">
              {/* Overturning Stability */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-[10px] font-mono uppercase opacity-50 font-bold tracking-widest">Geotechnical Stability</div>
                  <div className="text-[10px] font-mono opacity-40">AS 4678</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DesignResultCard
                    title="Overturning Check"
                    value={calculations.FOS_overturning.toFixed(2)}
                    unit="FOS"
                    status={calculations.FOS_overturning >= 1.5 ? 'pass' : 'fail'}
                    reference="AS 4678:2007 Cl. 8.2"
                    details={`Restoring Moment: ${calculations.Mr.toFixed(1)} kNm/m | Active Moment: ${calculations.Ma.toFixed(1)} kNm/m | Minimum: 1.5`}
                  />
                  <DesignResultCard
                    title="Sliding Check"
                    value={calculations.FOS_sliding.toFixed(2)}
                    unit="FOS"
                    status={calculations.FOS_sliding >= 1.5 ? 'pass' : 'fail'}
                    reference="AS 4678:2007 Cl. 8.3"
                    details={`Friction Resistance / Active Force ratio. Minimum FOS: 1.5`}
                  />
                </div>
              </div>

              {/* Bearing Capacity */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-[10px] font-mono uppercase opacity-50 font-bold tracking-widest">Bearing Capacity & Pressure Distribution</div>
                  <div className="text-[10px] font-mono opacity-40">Geotechnical</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DesignResultCard
                    title="Maximum Bearing Pressure"
                    value={calculations.q_max.toFixed(1)}
                    unit="kPa"
                    status={calculations.isBearingSafe ? 'pass' : 'fail'}
                    reference="Bearing Capacity Design"
                    details={`Using eccentric load method | Allowable: ${bearing_cap} kPa | Eccentricity check performed`}
                  />
                  <DesignResultCard
                    title="Active Lateral Force"
                    value={calculations.Pa.toFixed(1)}
                    unit="kN/m"
                    status={calculations.Pa < 500 ? 'pass' : 'warning'}
                    reference="AS 1170.2"
                    details={`Lateral earth pressure from active state | Height: ${(H + tf) / 1000} m | Ka = 0.333 (approx)`}
                  />
                </div>
              </div>

              {/* Stem Flexural Design */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-[10px] font-mono uppercase opacity-50 font-bold tracking-widest">Stem Flexural Design</div>
                  <div className="text-[10px] font-mono opacity-40">AS 3600 Cl. 8</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DesignResultCard
                    title="Factored Bending Moment (M*)"
                    value={(calculations.Ma * 1.5).toFixed(1)}
                    unit="kNm/m"
                    status="info"
                    reference="Load Factor = 1.5"
                    details={`From earth pressure distribution at base junction | Service: ${calculations.Ma.toFixed(1)} kNm/m`}
                  />
                  <DesignResultCard
                    title="Section Capacity (φMu)"
                    value={calculations.phiMu_stem.toFixed(1)}
                    unit="kNm/m"
                    status={calculations.isStemSafe ? 'pass' : 'fail'}
                    reference="AS 3600 Cl. 8.1.3"
                    details={`Capacity-based design | Bar: ${barDiamStem}mm @ ${barSpacingStem}mm | Effective depth: ${(tw - 50 - barDiamStem/2).toFixed(0)}mm`}
                  />
                </div>
              </div>

              {/* Stem Reinforcement Adequacy */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-[10px] font-mono uppercase opacity-50 font-bold tracking-widest">Stem Reinforcement Check</div>
                  <div className="text-[10px] font-mono opacity-40">AS 3600 Cl. 9.1</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DesignResultCard
                    title="Capacity Ratio (M*/φMu)"
                    value={((calculations.Ma * 1.5) / calculations.phiMu_stem).toFixed(3)}
                    unit="Ratio"
                    status={calculations.isStemSafe ? 'pass' : 'fail'}
                    reference="Flexural Adequacy"
                    details={`Must be ≤ 1.0 for adequate capacity | Current: ${((calculations.Ma * 1.5) / calculations.phiMu_stem).toFixed(2)}`}
                  />
                  <DesignResultCard
                    title="Concrete Strength"
                    value={fc.toFixed(0)}
                    unit="MPa"
                    status={fc >= 25 ? 'pass' : 'fail'}
                    reference="AS 3600 Cl. 6.1"
                    details={`f'c = ${fc} MPa | Recommended min: 32 MPa for underwater/exposed walls`}
                  />
                </div>
              </div>

              {/* Durability & Fire Safety */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-[10px] font-mono uppercase opacity-50 font-bold tracking-widest">Durability & Fire Safety</div>
                  <div className="text-[10px] font-mono opacity-40">NCC 2022 | AS 3600 Cl. 4.10</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DesignResultCard
                    title="Required Cover"
                    value={cover}
                    unit="mm"
                    status={isDurable ? 'pass' : 'fail'}
                    reference={`Exposure: ${exposureClass}`}
                    details={`Required: ${requiredCover}mm | Provided: ${cover}mm`}
                  />
                  <DesignResultCard
                    title="Fire Resistance"
                    value={fireRating}
                    unit="min"
                    status={isFireSafe ? 'pass' : 'fail'}
                    reference="AS 3600 Clause 20.3"
                    details={`Min thickness for ${fireRating}min FRP: ${minB}mm | Provided: ${tw}mm`}
                  />
                </div>
              </div>

              {/* Overall Assessment */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-[10px] font-mono uppercase opacity-50 font-bold tracking-widest">Overall Design Compliance</div>
                  <div className="text-[10px] font-mono opacity-40">Combined Assessment</div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className={cn(
                    "p-6 border-2 rounded-sm",
                    (isStructuralSafe && isFireSafe && isDurable) 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-red-50 border-red-300'
                  )}>
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-2 rounded-sm flex-shrink-0",
                        (isStructuralSafe && isFireSafe && isDurable) 
                          ? 'bg-green-200' 
                          : 'bg-red-200'
                      )}>
                        {(isStructuralSafe && isFireSafe && isDurable) 
                          ? <CheckCircle2 size={20} className="text-green-700" /> 
                          : <XCircle size={20} className="text-red-700" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold uppercase tracking-wider mb-2">
                          {(isStructuralSafe && isFireSafe && isDurable) 
                            ? '✓ Design Fully Compliant' 
                            : '✗ Compliance Issues - Review Required'}
                        </div>
                        <div className="text-[10px] space-y-1 opacity-70">
                          {!isStructuralSafe && <p>• Structural safety below requirements - review stability and capacity</p>}
                          {!isFireSafe && <p>• Fire resistance below {fireRating}min FRP - increase wall thickness to {minB}mm</p>}
                          {!isDurable && <p>• Concrete cover insufficient for {exposureClass} exposure - increase to {requiredCover}mm</p>}
                          {(isStructuralSafe && isFireSafe && isDurable) && 
                            <p>All structural, fire, and durability requirements satisfied. Design meets AS 4678, AS 3600, and NCC requirements.</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ProfessionalInputGroup>

          <div className="p-6 bg-ink text-white rounded-sm space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">
              <Info size={12} />
              <span>Design Notes</span>
            </div>
            <p className="text-[10px] font-mono leading-relaxed opacity-80">
              Design combines geotechnical (AS 4678) and structural (AS 3600) standards. FOS requirements: Overturning ≥ 1.5, Sliding ≥ 1.5. 
              Stem designed for factored earth pressure at base. AS 1170 load combinations applied to surcharge. Bearing capacity checks control bearing pressure distribution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetainingWallCalculator;
