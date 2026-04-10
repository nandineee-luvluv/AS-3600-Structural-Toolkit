/**
 * Material Configuration Database & UI Component
 * Pre-configured material properties per AS 3600:2018
 * Provides visual selection of standard concrete and steel grades
 */

import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2, AlertCircle } from 'lucide-react';

// ============================================================================
// MATERIAL DEFINITIONS
// ============================================================================

export enum ConcreteGrade {
  C20 = 20,
  C25 = 25,
  C32 = 32,
  C40 = 40,
  C50 = 50,
  C60 = 60,
  C80 = 80,
}

export enum SteelGrade {
  N500 = 500,
  N600 = 600,
}

export interface ConcreteProperties {
  grade: ConcreteGrade;
  density: number; // kg/m³
  elasticModulus: number; // MPa
  designStrength: number; // fcd = α2 × fc / 1.5
  permeability: 'low' | 'moderate' | 'high';
  coverRequirement: {
    structural: number; // mm
    fire: {
      '1h': number;
      '2h': number;
      '4h': number;
    };
  };
  weightClass: 'normal' | 'light' | 'heavyweight';
}

export interface SteelProperties {
  grade: SteelGrade;
  density: number; // kg/m³
  elasticModulus: number; // Fy (MPa) - for strain compatibility
  designStrength: number; // 0.87 × fsy
  yieldStrain: number; // ε_y = fsy / Es
  maxDiameter: number; // mm
  minBendDiameter: number; // × bar diameter (Table 13.2)
}

// ============================================================================
// MATERIAL DATABASE
// ============================================================================

export const CONCRETE_DB: Record<ConcreteGrade, ConcreteProperties> = {
  [ConcreteGrade.C20]: {
    grade: ConcreteGrade.C20,
    density: 2400,
    elasticModulus: 24000, // Ec = 3300 * sqrt(fc) + 6800
    designStrength: 13.3,
    permeability: 'high',
    coverRequirement: {
      structural: 40,
      fire: { '1h': 40, '2h': 50, '4h': 75 }
    },
    weightClass: 'normal'
  },
  [ConcreteGrade.C25]: {
    grade: ConcreteGrade.C25,
    density: 2400,
    elasticModulus: 26700,
    designStrength: 16.7,
    permeability: 'moderate',
    coverRequirement: {
      structural: 40,
      fire: { '1h': 40, '2h': 50, '4h': 75 }
    },
    weightClass: 'normal'
  },
  [ConcreteGrade.C32]: {
    grade: ConcreteGrade.C32,
    density: 2400,
    elasticModulus: 30100,
    designStrength: 21.3,
    permeability: 'moderate',
    coverRequirement: {
      structural: 45,
      fire: { '1h': 40, '2h': 60, '4h': 80 }
    },
    weightClass: 'normal'
  },
  [ConcreteGrade.C40]: {
    grade: ConcreteGrade.C40,
    density: 2400,
    elasticModulus: 32800,
    designStrength: 26.7,
    permeability: 'moderate',
    coverRequirement: {
      structural: 45,
      fire: { '1h': 50, '2h': 60, '4h': 90 }
    },
    weightClass: 'normal'
  },
  [ConcreteGrade.C50]: {
    grade: ConcreteGrade.C50,
    density: 2400,
    elasticModulus: 37000,
    designStrength: 33.3,
    permeability: 'low',
    coverRequirement: {
      structural: 50,
      fire: { '1h': 50, '2h': 70, '4h': 100 }
    },
    weightClass: 'normal'
  },
  [ConcreteGrade.C60]: {
    grade: ConcreteGrade.C60,
    density: 2400,
    elasticModulus: 40800,
    designStrength: 40.0,
    permeability: 'low',
    coverRequirement: {
      structural: 50,
      fire: { '1h': 60, '2h': 80, '4h': 110 }
    },
    weightClass: 'normal'
  },
  [ConcreteGrade.C80]: {
    grade: ConcreteGrade.C80,
    density: 2400,
    elasticModulus: 48200,
    designStrength: 53.3,
    permeability: 'low',
    coverRequirement: {
      structural: 55,
      fire: { '1h': 70, '2h': 90, '4h': 130 }
    },
    weightClass: 'normal'
  }
};

export const STEEL_DB: Record<SteelGrade, SteelProperties> = {
  [SteelGrade.N500]: {
    grade: SteelGrade.N500,
    density: 7850,
    elasticModulus: 200000,
    designStrength: 435, // 0.87 × 500
    yieldStrain: 0.0025,
    maxDiameter: 50,
    minBendDiameter: 8 // × d
  },
  [SteelGrade.N600]: {
    grade: SteelGrade.N600,
    density: 7850,
    elasticModulus: 200000,
    designStrength: 522, // 0.87 × 600
    yieldStrain: 0.003,
    maxDiameter: 50,
    minBendDiameter: 10 // × d
  }
};

// ============================================================================
// MATERIAL SELECTOR COMPONENTS
// ============================================================================

export const ConcreteGradeSelector: React.FC<{
  selected: ConcreteGrade;
  onChange: (grade: ConcreteGrade) => void;
  disabled?: boolean;
}> = ({ selected, onChange, disabled }) => {
  const grades = Object.values(ConcreteGrade).filter(g => typeof g === 'number') as ConcreteGrade[];
  
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-3">Concrete Grade (MPa)</label>
      <div className="grid grid-cols-4 gap-2">
        {grades.map(grade => {
          const props = CONCRETE_DB[grade];
          return (
            <button
              key={grade}
              onClick={() => onChange(grade)}
              disabled={disabled}
              className={cn(
                "p-3 rounded-lg border-2 font-bold text-center transition-all",
                "hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
                selected === grade
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-gray-300 bg-white text-gray-900 hover:border-gray-400"
              )}
            >
              <div className="text-lg">C{grade}</div>
              <div className="text-xs text-gray-600 mt-1">
                {props.designStrength.toFixed(1)} MPa (design)
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const SteelGradeSelector: React.FC<{
  selected: SteelGrade;
  onChange: (grade: SteelGrade) => void;
  disabled?: boolean;
}> = ({ selected, onChange, disabled }) => {
  const grades = Object.values(SteelGrade).filter(g => typeof g === 'number') as SteelGrade[];
  
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-3">Steel Grade (MPa)</label>
      <div className="grid grid-cols-2 gap-2">
        {grades.map(grade => {
          const props = STEEL_DB[grade];
          return (
            <button
              key={grade}
              onClick={() => onChange(grade)}
              disabled={disabled}
              className={cn(
                "p-4 rounded-lg border-2 font-bold text-center transition-all",
                "hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
                selected === grade
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-gray-300 bg-white text-gray-900 hover:border-gray-400"
              )}
            >
              <div className="text-lg">N{grade}</div>
              <div className="text-xs text-gray-600 mt-1">
                {props.designStrength} MPa (design)
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Material Properties Display with Code References
 */
export const MaterialPropertiesDisplay: React.FC<{
  concreteGrade: ConcreteGrade;
  steelGrade: SteelGrade;
  exposureClass?: 'A' | 'B' | 'C' | 'D';
  fireRating?: '1h' | '2h' | '4h';
}> = ({ concreteGrade, steelGrade, exposureClass = 'A', fireRating = '2h' }) => {
  const concrete = CONCRETE_DB[concreteGrade];
  const steel = STEEL_DB[steelGrade];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Concrete Properties */}
      <div className="bg-gradient-to-br from-slate-50 to-white border border-gray-300 rounded-lg p-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Concrete Properties</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="font-semibold text-gray-700">Grade</span>
            <span className="font-mono font-bold">C{concreteGrade}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="font-semibold text-gray-700">Characteristic Strength (fc)</span>
            <span className="font-mono font-bold">{concreteGrade} MPa</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="font-semibold text-gray-700">Design Strength (0.85 × fc / 1.5)</span>
            <span className="font-mono font-bold">{concrete.designStrength.toFixed(1)} MPa</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="font-semibold text-gray-700">Elastic Modulus (Ec)</span>
            <span className="font-mono font-bold">{concrete.elasticModulus} MPa</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="font-semibold text-gray-700">Density</span>
            <span className="font-mono font-bold">{concrete.density} kg/m³</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="font-semibold text-gray-700">Water Permeability</span>
            <span className="font-mono font-bold capitalize">{concrete.permeability}</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-4 pt-4 border-t border-gray-200">
          Per AS 3600:2018 Clause 2.1.2 and Table 3.1
        </p>
      </div>

      {/* Steel Properties */}
      <div className="bg-gradient-to-br from-orange-50 to-white border border-gray-300 rounded-lg p-6">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Steel Properties</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="font-semibold text-gray-700">Grade</span>
            <span className="font-mono font-bold">N{steelGrade}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="font-semibold text-gray-700">Characteristic Yield (fsy/fsy')</span>
            <span className="font-mono font-bold">{steelGrade} MPa</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="font-semibold text-gray-700">Design Strength (0.87 × fsy)</span>
            <span className="font-mono font-bold">{steel.designStrength} MPa</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="font-semibold text-gray-700">Elastic Modulus (Es)</span>
            <span className="font-mono font-bold">{steel.elasticModulus} MPa</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="font-semibold text-gray-700">Density</span>
            <span className="font-mono font-bold">{steel.density} kg/m³</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="font-semibold text-gray-700">Max Bar Diameter</span>
            <span className="font-mono font-bold">ø{steel.maxDiameter}mm</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-4 pt-4 border-t border-gray-200">
          Per AS 3600:2018 Clause 2.2 and Table 3.2
        </p>
      </div>

      {/* Cover Requirements */}
      <div className="bg-gradient-to-br from-green-50 to-white border border-gray-300 rounded-lg p-6 md:col-span-2">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Cover Requirements (AS 3600 Clause 4.4 & Table 4.3)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div classN ame="bg-white border border-green-200 rounded p-3">
            <p className="text-xs text-gray-600 mb-1">Structural</p>
            <p className="text-lg font-bold text-green-700">{concrete.coverRequirement.structural}mm</p>
          </div>
          <div className="bg-white border border-green-200 rounded p-3">
            <p className="text-xs text-gray-600 mb-1">Fire: 1h</p>
            <p className="text-lg font-bold text-green-700">{concrete.coverRequirement.fire['1h']}mm</p>
          </div>
          <div className="bg-white border border-green-200 rounded p-3">
            <p className="text-xs text-gray-600 mb-1">Fire: 2h</p>
            <p className="text-lg font-bold text-green-700">{concrete.coverRequirement.fire['2h']}mm</p>
          </div>
          <div className="bg-white border border-green-200 rounded p-3">
            <p className="text-xs text-gray-600 mb-1">Fire: 4h</p>
            <p className="text-lg font-bold text-green-700">{concrete.coverRequirement.fire['4h']}mm</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default {
  ConcreteGradeSelector,
  SteelGradeSelector,
  MaterialPropertiesDisplay,
  CONCRETE_DB,
  STEEL_DB,
  ConcreteGrade,
  SteelGrade
};
