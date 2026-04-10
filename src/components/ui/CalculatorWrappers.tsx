/**
 * Professional UI Overlay Wrapper
 * Enhances existing calculators with professional components while maintaining backward compatibility
 */

import React from 'react';
import {
  DesignInputCard,
  DesignResultCard,
  ComplianceStatus,
  InputField
} from './ProfessionalComponents';
import { ConcreteGrade, SteelGrade, CONCRETE_DB, STEEL_DB } from './MaterialDatabase';
import { CircleAlert, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Enhanced Input Group with Professional Styling
 * Replaces the old InputGroup component
 */
export const ProfessionalInputGroup: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
  error?: string;
}> = ({ title, description, children, error }) => (
  <DesignInputCard title={title} description={description}>
    {error && (
      <div className="p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2 mb-4">
        <CircleAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <span className="text-sm text-red-700">{error}</span>
      </div>
    )}
    <div className="space-y-4">
      {children}
    </div>
  </DesignInputCard>
);

/**
 * Quick Material Selector with Material Database
 */
export const QuickMaterialSelector: React.FC<{
  fc: number;
  setFc: (v: number) => void;
  fsy: number;
  setFsy: (v: number) => void;
}> = ({ fc, setFc, fsy, setFsy }) => {
  const concreteGrades = [20, 25, 32, 40, 50, 60, 80] as const;
  const steelGrades = [500, 600] as const;

  return (
    <ProfessionalInputGroup title="Material Selection" description="Quick select from AS 3600:2018 standard grades">
      <div className="space-y-6">
        {/* Concrete */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">Concrete Strength Grade</label>
          <div className="grid grid-cols-7 gap-2">
            {concreteGrades.map(grade => (
              <button
                key={grade}
                onClick={() => setFc(grade)}
                className={cn(
                  "p-3 rounded-lg border-2 font-bold text-center transition-all text-sm",
                  fc === grade
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : "border-gray-300 bg-white text-gray-900 hover:border-gray-400"
                )}
              >
                <div>C{grade}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {(CONCRETE_DB[grade as ConcreteGrade]?.designStrength ?? 0).toFixed(1)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Steel */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">Steel Reinforcement Grade</label>
          <div className="grid grid-cols-2 gap-2">
            {steelGrades.map(grade => (
              <button
                key={grade}
                onClick={() => setFsy(grade)}
                className={cn(
                  "p-4 rounded-lg border-2 font-bold text-center transition-all",
                  fsy === grade
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : "border-gray-300 bg-white text-gray-900 hover:border-gray-400"
                )}
              >
                <div className="text-lg font-bold">N{grade}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {(STEEL_DB[grade as SteelGrade]?.designStrength ?? 0)} MPa
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ProfessionalInputGroup>
  );
};

/**
 * Enhanced Result Card with Status
 */
export const ComplianceResultCard: React.FC<{
  items: Array<{
    label: string;
    value: number | string;
    unit?: string;
    pass: boolean;
    reference?: string;
  }>;
}> = ({ items }) => {
  const allPass = items.every(i => i.pass);

  return (
    <div className="space-y-2">
      <div className={cn(
        "p-3 rounded-lg border-2 mb-4",
        allPass
          ? "bg-green-50 border-green-300"
          : "bg-red-50 border-red-300"
      )}>
        <div className="flex items-center gap-2">
          {allPass ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <CircleAlert className="w-5 h-5 text-red-600" />
          )}
          <span className={cn(
            "font-bold text-sm",
            allPass ? "text-green-900" : "text-red-900"
          )}>
            {allPass ? 'All Checks Pass' : 'Some Checks Failed'}
          </span>
        </div>
      </div>

      {items.map((item, idx) => (
        <div key={idx} className={cn(
          "p-3 rounded-lg border-l-4 flex items-center justify-between",
          item.pass ? "bg-green-50 border-l-green-600" : "bg-red-50 border-l-red-600"
        )}>
          <div>
            <p className={cn(
              "text-sm font-semibold",
              item.pass ? "text-green-900" : "text-red-900"
            )}>
              {item.label}
            </p>
            {item.reference && (
              <p className="text-xs text-gray-600 font-mono mt-1">{item.reference}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-bold text-base">
              {item.value}
            </p>
            {item.unit && (
              <p className="text-xs text-gray-600">{item.unit}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Professional Geometry Input Helper
 */
export const GeometryInputs: React.FC<{
  width: number;
  setWidth: (v: number) => void;
  depth: number;
  setDepth: (v: number) => void;
  span?: number;
  setSpan?: (v: number) => void;
  cover: number;
  setCover: (v: number) => void;
}> = ({ width, setWidth, depth, setDepth, span, setSpan, cover, setCover }) => (
  <ProfessionalInputGroup
    title="Member Geometry"
    description="Define section dimensions and support conditions"
  >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <InputField
        label="Width (b)"
        value={width}
        onChange={setWidth}
        unit="mm"
        min={200}
        max={2000}
        helper="Beam or wall width"
      />
      <InputField
        label="Total Depth (h)"
        value={depth}
        onChange={setDepth}
        unit="mm"
        min={300}
        max={3000}
        helper="Full section height"
      />
      {span && setSpan && (
        <InputField
          label="Span (L)"
          value={span}
          onChange={setSpan}
          unit="mm"
          min={1000}
          max={20000}
          helper="Clear span"
        />
      )}
      <InputField
        label="Cover to Reinforcement"
        value={cover}
        onChange={setCover}
        unit="mm"
        min={25}
        max={100}
        helper="Clear cover to main bars"
      />
    </div>
  </ProfessionalInputGroup>
);

/**
 * Professional Load Input Helper
 */
export const LoadInputs: React.FC<{
  deadLoad: number;
  setDeadLoad: (v: number) => void;
  liveLoad: number;
  setLiveLoad: (v: number) => void;
  windLoad?: number;
  setWindLoad?: (v: number) => void;
  seismicLoad?: number;
  setSeismicLoad?: (v: number) => void;
}> = ({
  deadLoad,
  setDeadLoad,
  liveLoad,
  setLiveLoad,
  windLoad,
  setWindLoad,
  seismicLoad,
  setSeismicLoad
}) => {
  const ulsLoad = deadLoad * 1.2 + liveLoad * 1.5 + (windLoad ?? 0) * 1.2 + (seismicLoad ?? 0) * 1.0;

  return (
    <ProfessionalInputGroup
      title="Applied Loads"
      description="Enter unfactored loads for design load combinations"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <InputField
          label="Dead Load (G)"
          value={deadLoad}
          onChange={setDeadLoad}
          unit="kN/m"
          helper="Permanent load (self-weight + finishes)"
        />
        <InputField
          label="Live Load (Q)"
          value={liveLoad}
          onChange={setLiveLoad}
          unit="kN/m"
          helper="Variable load (occupancy dependent)"
        />
        {windLoad !== undefined && setWindLoad && (
          <InputField
            label="Wind Load (Wu)"
            value={windLoad}
            onChange={setWindLoad}
            unit="kN/m"
            helper="Per AS 1170.2"
          />
        )}
        {seismicLoad !== undefined && setSeismicLoad && (
          <InputField
            label="Seismic Load (Eu)"
            value={seismicLoad}
            onChange={setSeismicLoad}
            unit="kN/m"
            helper="Per AS 1170.4"
          />
        )}
      </div>

      <DesignResultCard
        title="ULS Load Combination"
        items={[
          {
            label: 'Design Load (w*)',
            value: ulsLoad.toFixed(2),
            unit: 'kN/m',
            reference: 'AS 1170: 1.2G + 1.5Q + 1.2W + 1.0E'
          }
        ]}
      />
    </ProfessionalInputGroup>
  );
};

/**
 * Professional Compliance Status Summary
 */
export const DesignComplianceSummary: React.FC<{
  isFlexureSafe: boolean;
  isShearSafe: boolean;
  isDeflectionOk: boolean;
  isCrackOk: boolean;
  isDurableOk: boolean;
  isFireOk: boolean;
}> = ({
  isFlexureSafe,
  isShearSafe,
  isDeflectionOk,
  isCrackOk,
  isDurableOk,
  isFireOk
}) => {
  const allPass = isFlexureSafe && isShearSafe && isDeflectionOk && isCrackOk && isDurableOk && isFireOk;

  return (
    <ComplianceStatus
      isCompliant={allPass}
      label={allPass ? "Design Compliant with AS 3600:2018 & NCC 2022" : "Design Review Required"}
      details={[
        `Flexural Capacity: ${isFlexureSafe ? '✓' : '✗'}`,
        `Shear Capacity: ${isShearSafe ? '✓' : '✗'}`,
        `Deflection: ${isDeflectionOk ? '✓' : '✗'}`,
        `Crack Width: ${isCrackOk ? '✓' : '✗'}`,
        `Durability: ${isDurableOk ? '✓' : '✗'}`,
        `Fire Resistance: ${isFireOk ? '✓' : '✗'}`
      ]}
    />
  );
};

export default {
  ProfessionalInputGroup,
  QuickMaterialSelector,
  ComplianceResultCard,
  GeometryInputs,
  LoadInputs,
  DesignComplianceSummary
};
