/**
 * Professional Design Results Summary Component
 * Displays beam/column design results with clear visual hierarchy and compliance status
 */

import React, { useState } from 'react';
import { 
  DesignResultCard, 
  ComplianceStatus, 
  DesignReference,
  TabGroup,
  Alert,
  SectionProfile
} from './ProfessionalComponents';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

export interface DesignSummary {
  memberId?: string;
  designMethod: 'ULS' | 'SLS';
  
  // Input Properties
  inputs: {
    span: number;
    width: number;
    depth: number;
    cover: number;
    concrete: number;
    steel: number;
  };
  
  // ULS Design Results
  uls?: {
    appliedMoment: number;
    momentCapacity: number;
    momentRatio: number;
    momentSafe: boolean;
    
    appliedShear: number;
    shearCapacity: number;
    shearRatio: number;
    shearSafe: boolean;
    
    reinforcementArea: number;
    reinforcementMin: number;
    reinforcementMax: number;
    reinforcementOk: boolean;
    
    bars: Array<{ diameter: number; count: number; area: number }>;
  };
  
  // SLS Checks
  sls?: {
    deflectionLimit: number;
    deflectionActual: number;
    deflectionOk: boolean;
    
    crackWidthLimit: number;
    crackWidthActual: number;
    crackWidthOk: boolean;
    
    stressLimitConcrete: number;
    stressActualConcrete: number;
    stressOkConcrete: boolean;
    
    stressLimitSteel: number;
    stressActualSteel: number;
    stressOkSteel: boolean;
  };
  
  // Compliance
  compliance: {
    as3600: boolean;
    ncc: boolean;
    constructability: boolean;
    detailing: boolean;
  };
  
  // References
  references?: Array<{
    clause: string;
    reference: string;
  }>;
}

export const DesignResultsSummary: React.FC<{ design: DesignSummary }> = ({ design }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Overall compliance check
  const isOverallCompliant = design.compliance.as3600 && 
                             design.compliance.ncc && 
                             design.compliance.constructability &&
                             design.compliance.detailing;
  
  const ulsComplete = design.uls && design.uls.momentSafe && design.uls.shearSafe && design.uls.reinforcementOk;
  const slsComplete = design.sls && design.sls.deflectionOk && design.sls.crackWidthOk && 
                      design.sls.stressOkConcrete && design.sls.stressOkSteel;

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ComplianceStatus
          isCompliant={isOverallCompliant}
          label={isOverallCompliant ? "Design Compliant" : "Design Non-Compliant"}
          details={[
            `AS 3600: ${design.compliance.as3600 ? '✓' : '✗'}`,
            `NCC 2022: ${design.compliance.ncc ? '✓' : '✗'}`,
            `Constructability: ${design.compliance.constructability ? '✓' : '✗'}`,
            `Detailing: ${design.compliance.detailing ? '✓' : '✗'}`
          ]}
        />
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700 mb-3">DESIGN STATUS</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {ulsComplete ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="text-sm font-semibold">
                ULS Design: {ulsComplete ? 'Safe' : 'Review Required'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {slsComplete ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              <span className="text-sm font-semibold">
                SLS Checks: {slsComplete ? 'Satisfy' : 'Review Required'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <TabGroup
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'uls', label: 'ULS Design' },
          { id: 'sls', label: 'SLS Serviceability' },
          { id: 'reinforcement', label: 'Reinforcement' },
          { id: 'compliance', label: 'Compliance' }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      >
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DesignResultCard
                title="Member Dimensions"
                items={[
                  { label: 'Span', value: design.inputs.span, unit: 'mm' },
                  { label: 'Width', value: design.inputs.width, unit: 'mm' },
                  { label: 'Effective Depth', value: design.inputs.depth - design.inputs.cover, unit: 'mm' },
                  { label: 'Cover (nominal)', value: design.inputs.cover, unit: 'mm' }
                ]}
              />
              
              <DesignResultCard
                title="Material Properties"
                items={[
                  { label: 'Concrete Grade', value: design.inputs.concrete, unit: 'MPa' },
                  { label: 'Steel Grade', value: design.inputs.steel, unit: 'MPa' },
                  { label: 'Method: ', value: design.designMethod },
                ]}
              />
            </div>
            
            {design.inputs.depth > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-700 mb-3">CROSS-SECTION PROFILE</p>
                <SectionProfile
                  width={design.inputs.width}
                  height={design.inputs.depth}
                  coverTop={design.inputs.cover}
                  coverBottom={design.inputs.cover}
                  coverSide={design.inputs.cover}
                  reinforcementBars={design.uls?.bars.map((bar, idx) => ({
                    x: 20 + (idx % 2) * (design.inputs.width - 40),
                    y: design.inputs.depth - design.inputs.cover - 20,
                    diameter: bar.diameter
                  }))}
                />
              </div>
            )}
          </div>
        )}

        {/* ULS DESIGN TAB */}
        {activeTab === 'uls' && design.uls && (
          <div className="space-y-6">
            <Alert
              type={design.uls.momentSafe ? 'success' : 'error'}
              title="Moment Capacity Check"
              message={`M* = ${design.uls.appliedMoment.toFixed(2)} kNm, M_u = ${design.uls.momentCapacity.toFixed(2)} kNm (Ratio: ${(design.uls.momentRatio * 100).toFixed(1)}%)`}
            />
            
            <DesignResultCard
              title="Flexural Design (ULS)"
              items={[
                {
                  label: 'Applied Moment',
                  value: design.uls.appliedMoment.toFixed(2),
                  unit: 'kNm'
                },
                {
                  label: 'Moment Capacity (φ Mu)',
                  value: design.uls.momentCapacity.toFixed(2),
                  unit: 'kNm',
                  status: design.uls.momentSafe ? 'pass' : 'fail',
                  reference: 'AS 3600 Clause 8.1'
                },
                {
                  label: 'Capacity Ratio',
                  value: (design.uls.momentRatio * 100).toFixed(1),
                  unit: '%',
                  status: design.uls.momentRatio < 1 ? 'pass' : 'fail'
                }
              ]}
            />
            
            <Alert
              type={design.uls.shearSafe ? 'success' : 'error'}
              title="Shear Capacity Check"
              message={`V* = ${design.uls.appliedShear.toFixed(2)} kN, V_u = ${design.uls.shearCapacity.toFixed(2)} kN (Ratio: ${(design.uls.shearRatio * 100).toFixed(1)}%)`}
            />
            
            <DesignResultCard
              title="Shear Design - General Method (ULS)"
              items={[
                {
                  label: 'Applied Shear',
                  value: design.uls.appliedShear.toFixed(2),
                  unit: 'kN'
                },
                {
                  label: 'Shear Capacity (φ Vu)',
                  value: design.uls.shearCapacity.toFixed(2),
                  unit: 'kN',
                  status: design.uls.shearSafe ? 'pass' : 'fail',
                  reference: 'AS 3600 Clause 8.2.4.2'
                },
                {
                  label: 'Capacity Ratio',
                  value: (design.uls.shearRatio * 100).toFixed(1),
                  unit: '%',
                  status: design.uls.shearRatio < 1 ? 'pass' : 'fail'
                }
              ]}
            />
            
            <DesignReference
              clause="8.1"
              title="Rectangular Stress Block Method"
              calculation="Mu = φ × Ast × fs × (d - 0.5 × γ × ku × d)"
              notes={[
                'Alpha-2 factor accounts for concrete strength',
                'Strain compatibility analysis ensures proper stress distribution',
                'Reinforcement stress limited to 0.87 × fsy'
              ]}
            />
          </div>
        )}

        {/* SLS SERVICEABILITY TAB */}
        {activeTab === 'sls' && design.sls && (
          <div className="space-y-6">
            <Alert
              type={design.sls.deflectionOk ? 'success' : 'warning'}
              title="Deflection Check"
              message={`Actual: ${design.sls.deflectionActual.toFixed(1)} mm, Limit: ${design.sls.deflectionLimit.toFixed(1)} mm`}
            />
            
            <DesignResultCard
              title="Deflection Serviceability (SLS)"
              items={[
                {
                  label: 'Span/Depth Ratio Limit',
                  value: design.sls.deflectionLimit.toFixed(1),
                  unit: 'mm (eq. limit)'
                },
                {
                  label: 'Actual Deflection',
                  value: design.sls.deflectionActual.toFixed(1),
                  unit: 'mm',
                  status: design.sls.deflectionOk ? 'pass' : 'warning',
                  reference: 'AS 3600 Table 9.2'
                }
              ]}
            />
            
            <Alert
              type={design.sls.crackWidthOk ? 'success' : 'warning'}
              title="Crack Width Control"
              message={`Actual: ${design.sls.crackWidthActual.toFixed(2)} mm, Limit: ${design.sls.crackWidthLimit.toFixed(2)} mm`}
            />
            
            <DesignResultCard
              title="Crack Width Serviceability (SLS)"
              items={[
                {
                  label: 'Crack Width Limit',
                  value: design.sls.crackWidthLimit.toFixed(2),
                  unit: 'mm'
                },
                {
                  label: 'Calculated Crack Width',
                  value: design.sls.crackWidthActual.toFixed(2),
                  unit: 'mm',
                  status: design.sls.crackWidthOk ? 'pass' : 'warning',
                  reference: 'AS 3600 Clause 9.4.1'
                }
              ]}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DesignResultCard
                title="Concrete Stress (SLS)"
                items={[
                  {
                    label: 'Allowable',
                    value: design.sls.stressLimitConcrete.toFixed(1),
                    unit: 'MPa'
                  },
                  {
                    label: 'Actual',
                    value: design.sls.stressActualConcrete.toFixed(1),
                    unit: 'MPa',
                    status: design.sls.stressOkConcrete ? 'pass' : 'fail'
                  }
                ]}
              />
              
              <DesignResultCard
                title="Steel Stress (SLS)"
                items={[
                  {
                    label: 'Allowable',
                    value: design.sls.stressLimitSteel.toFixed(1),
                    unit: 'MPa'
                  },
                  {
                    label: 'Actual',
                    value: design.sls.stressActualSteel.toFixed(1),
                    unit: 'MPa',
                    status: design.sls.stressOkSteel ? 'pass' : 'fail'
                  }
                ]}
              />
            </div>
          </div>
        )}

        {/* REINFORCEMENT TAB */}
        {activeTab === 'reinforcement' && design.uls && (
          <div className="space-y-6">
            <Alert
              type={design.uls.reinforcementOk ? 'success' : 'error'}
              title="Reinforcement Requirements"
              message={`Required: ${design.uls.reinforcementArea.toFixed(0)} mm², Min: ${design.uls.reinforcementMin.toFixed(0)} mm², Max: ${design.uls.reinforcementMax.toFixed(0)} mm²`}
            />
            
            <DesignResultCard
              title="Flexural Reinforcement"
              items={[
                {
                  label: 'Required Area (As)',
                  value: design.uls.reinforcementArea.toFixed(0),
                  unit: 'mm²',
                  status: design.uls.reinforcementOk ? 'pass' : 'fail'
                },
                {
                  label: 'Minimum Area (As,min)',
                  value: design.uls.reinforcementMin.toFixed(0),
                  unit: 'mm²',
                  reference: 'AS 3600 Clause 10.6.1'
                },
                {
                  label: 'Maximum Area (As,max)',
                  value: design.uls.reinforcementMax.toFixed(0),
                  unit: 'mm²',
                  reference: 'AS 3600 Clause 10.6.2'
                }
              ]}
            />
            
            {design.uls.bars && design.uls.bars.length > 0 && (
              <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">PROVIDED REINFORCEMENT</h3>
                </div>
                <div className="p-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left font-bold py-2">Bar Size</th>
                        <th className="text-right font-bold py-2">Quantity</th>
                        <th className="text-right font-bold py-2">Area per Bar</th>
                        <th className="text-right font-bold py-2">Total Area</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {design.uls.bars.map((bar, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-2 font-mono">ø{bar.diameter}</td>
                          <td className="text-right py-2 font-semibold">{bar.count}</td>
                          <td className="text-right py-2 font-mono">{(Math.PI * (bar.diameter/2)**2).toFixed(0)} mm²</td>
                          <td className="text-right py-2 font-bold">{bar.area.toFixed(0)} mm²</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <DesignReference
              clause="10.6.1 & 10.6.2"
              title="Reinforcement Limits"
              notes={[
                'Minimum reinforcement prevents brittle failure',
                'Maximum reinforcement ensures ductility and workability',
                'Reinforcement must be spaced to allow concrete placement',
                'See Clause 13.2 for spacing requirements'
              ]}
            />
          </div>
        )}

        {/* COMPLIANCE TAB */}
        {activeTab === 'compliance' && (
          <div className="space-y-4">
            <ComplianceStatus
              isCompliant={design.compliance.as3600}
              label="AS 3600:2018 Concrete Structures"
              details={[
                'Flexural capacity checked',
                'Shear capacity per General Method',
                'Reinforcement within limits',
                'Development lengths provided'
              ]}
            />
            
            <ComplianceStatus
              isCompliant={design.compliance.ncc}
              label="NCC 2022 Performance Requirements"
              details={[
                'B1.1 - Resistance to collapse and disproportionate collapse',
                'B1.2 - Resistance to excessive deformation',
                'B3.1 - Fire resistance rating satisfied'
              ]}
            />
            
            <ComplianceStatus
              isCompliant={design.compliance.constructability}
              label="Constructability & Practicality"
              details={[
                'Bar spacing permits concrete placement',
                'Clear cover requirements satisfied',
                'Reinforcement detailing practical'
              ]}
            />
            
            <ComplianceStatus
              isCompliant={design.compliance.detailing}
              label="Detailing Per AS 3600 Clause 13"
              details={[
                'Bend diameter limits satisfied',
                'Development length provided',
                'Anchorage requirements met'
              ]}
            />
          </div>
        )}
      </TabGroup>

      {/* Standards References Footer */}
      {design.references && design.references.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-bold text-gray-700 mb-3">STANDARDS REFERENCES</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {design.references.map((ref, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded px-2 py-1">
                <p className="text-xs font-mono text-gray-600">{ref.clause}</p>
                <p className="text-xs text-gray-700">{ref.reference}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignResultsSummary;
