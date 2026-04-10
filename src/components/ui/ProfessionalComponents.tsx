/**
 * Professional UI Components for Structural Design
 * Provides clean, professional layouts for design calculators
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

// ============================================================================
// PROFESSIONAL CARD LAYOUTS
// ============================================================================

/**
 * Design Input Card - Clean input section with title and description
 */
export const DesignInputCard: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, description, children, className }) => (
  <div className={cn(
    "bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow",
    className
  )}>
    <div className="border-b border-gray-200 px-6 py-4">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{title}</h3>
      {description && (
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      )}
    </div>
    <div className="p-6 space-y-4">
      {children}
    </div>
  </div>
);

/**
 * Design Result Card - Display calculation results with status
 */
export const DesignResultCard: React.FC<{
  title: string;
  items: Array<{
    label: string;
    value: string | number;
    unit?: string;
    status?: 'pass' | 'fail' | 'warning' | 'info';
    reference?: string;
  }>;
  className?: string;
}> = ({ title, items, className }) => (
  <div className={cn(
    "bg-gradient-to-br from-gray-50 to-white border border-gray-300 rounded-lg",
    className
  )}>
    <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{title}</h3>
    </div>
    <div className="p-6 space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-700">{item.label}</p>
            {item.reference && (
              <p className="text-xs text-gray-500 font-mono">{item.reference}</p>
            )}
          </div>
          <div className="flex items-center gap-3 ml-4">
            {item.status === 'pass' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
            {item.status === 'fail' && <AlertCircle className="w-5 h-5 text-red-600" />}
            {item.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
            {item.status === 'info' && <Info className="w-5 h-5 text-blue-600" />}
            <div className="text-right">
              <p className="text-base font-bold text-gray-900">
                {item.value}
              </p>
              {item.unit && (
                <p className="text-xs text-gray-600">{item.unit}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Compliance Status Badge
 */
export const ComplianceStatus: React.FC<{
  isCompliant: boolean;
  label: string;
  details?: string[];
}> = ({ isCompliant, label, details }) => (
  <div className={cn(
    "p-4 rounded-lg border-2",
    isCompliant
      ? "bg-green-50 border-green-300"
      : "bg-red-50 border-red-300"
  )}>
    <div className="flex items-center gap-3">
      {isCompliant ? (
        <CheckCircle2 className="w-6 h-6 text-green-600" />
      ) : (
        <AlertCircle className="w-6 h-6 text-red-600" />
      )}
      <div className="flex-1">
        <p className={cn(
          "font-bold text-sm",
          isCompliant ? "text-green-900" : "text-red-900"
        )}>
          {label}
        </p>
        {details && (
          <ul className="text-xs mt-2 space-y-1">
            {details.map((d, i) => (
              <li key={i} className={cn(
                isCompliant ? "text-green-800" : "text-red-800"
              )}>
                • {d}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </div>
);

// ============================================================================
// INPUT CONTROLS
// ============================================================================

/**
 * Professional Input Field with label, unit, and validation
 */
export const InputField: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  helper?: string;
  disabled?: boolean;
}> = ({ label, value, onChange, unit, min, max, step, error, helper, disabled }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {unit && <span className="text-xs font-mono text-gray-600">{unit}</span>}
    </div>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step || 1}
      disabled={disabled}
      className={cn(
        "w-full px-3 py-2 border rounded-lg font-mono text-sm",
        "focus:outline-none focus:ring-2 focus:ring-blue-500",
        error
          ? "border-red-300 bg-red-50"
          : "border-gray-300 bg-white hover:border-gray-400"
      )}
    />
    {error && (
      <p className="text-xs text-red-600 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    )}
    {helper && !error && (
      <p className="text-xs text-gray-600">{helper}</p>
    )}
  </div>
);

/**
 * Tab Navigation for complex sections
 */
export const TabGroup: React.FC<{
  tabs: Array<{ id: string; label: string }>;
  activeTab: string;
  onChange: (id: string) => void;
  children: React.ReactNode;
}> = ({ tabs, activeTab, onChange, children }) => (
  <div className="border border-gray-300 rounded-lg overflow-hidden">
    <div className="flex border-b border-gray-300 bg-gray-50">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-semibold transition-colors",
            "border-b-2 -mb-[2px]",
            activeTab === tab.id
              ? "border-blue-500 text-blue-700 bg-blue-50"
              : "border-transparent text-gray-700 hover:bg-gray-100"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

// ============================================================================
// VISUALIZATION COMPONENTS
// ============================================================================

/**
 * Section Profile Diagram - Shows cross-section with reinforcement
 */
export const SectionProfile: React.FC<{
  width: number;
  height: number;
  reinforcementBars?: Array<{ x: number; y: number; diameter: number }>;
  coverTop?: number;
  coverBottom?: number;
  coverSide?: number;
}> = ({ width, height, reinforcementBars, coverTop = 40, coverBottom = 40, coverSide = 40 }) => {
  const scale = Math.min(200 / width, 200 / height);
  const drawWidth = width * scale;
  const drawHeight = height * scale;
  
  return (
    <div className="flex justify-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
      <svg width={drawWidth + 20} height={drawHeight + 20} className="border border-gray-300 bg-white">
        {/* Concrete outline */}
        <rect x={10} y={10} width={drawWidth} height={drawHeight} fill="white" stroke="#666" strokeWidth="2" />
        
        {/* Cover zones */}
        <rect x={10 + coverSide * scale} y={10 + coverTop * scale} 
              width={drawWidth - (coverSide * 2 * scale)} 
              height={drawHeight - (coverTop + coverBottom) * scale}
              fill="none" stroke="#ddd" strokeWidth="1" strokeDasharray="4,4" />
        
        {/* Reinforcement bars */}
        {reinforcementBars?.map((bar, i) => (
          <circle
            key={i}
            cx={10 + bar.x * scale}
            cy={10 + bar.y * scale}
            r={Math.max(2, (bar.diameter / 2) * scale)}
            fill="#333"
            stroke="#000"
            strokeWidth="1"
          />
        ))}
        
        {/* Dimension lines */}
        <text x={drawWidth / 2 + 10} y={drawHeight + 35} textAnchor="middle" className="text-xs font-mono" fontSize="10">
          {width}mm
        </text>
        <text x={5} y={drawHeight / 2 + 15} textAnchor="end" className="text-xs font-mono" fontSize="10" transform={`rotate(-90 5 ${drawHeight / 2 + 15})`}>
          {height}mm
        </text>
      </svg>
    </div>
  );
};

/**
 * Load Diagram - Shows loads on a beam
 */
export const LoadDiagram: React.FC<{
  span: number;
  loads: Array<{ position: number; value: number; type: 'point' | 'distributed' }>;
}> = ({ span, loads }) => {
  const scale = 300 / span;
  
  return (
    <div className="flex justify-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
      <svg width={300} height={150} className="border border-gray-300 bg-white">
        {/* Beam */}
        <line x1={10} y1={100} x2={290} y2={100} stroke="#333" strokeWidth="3" />
        
        {/* Supports */}
        <polygon points={`10,100 5,115 15,115`} fill="#333" />
        <polygon points={`290,100 285,115 295,115`} fill="#333" />
        
        {/* Loads */}
        {loads.map((load, i) => {
          const x = 10 + load.position * scale;
          return (
            <g key={i}>
              {load.type === 'point' ? (
                <>
                  <line x1={x} y1={50} x2={x} y2={100} stroke="#e11d48" strokeWidth="2" />
                  <polygon points={`${x},50 ${x - 3},58 ${x + 3},58`} fill="#e11d48" />
                  <text x={x} y={40} textAnchor="middle" className="text-xs font-bold" fontSize="10" fill="#e11d48">
                    {load.value}kN
                  </text>
                </>
              ) : (
                <>
                  <rect x={x - 10} y={70} width={20} height={30} fill="none" stroke="#e11d48" strokeWidth="1" strokeDasharray="2,2" />
                  <text x={x} y={60} textAnchor="middle" className="text-xs font-bold" fontSize="10" fill="#e11d48">
                    {load.value}kN/m
                  </text>
                </>
              )}
            </g>
          );
        })}
        
        {/* Dimension */}
        <line x1={10} y1={125} x2={290} y2={125} stroke="#999" strokeWidth="1" />
        <text x={150} y={145} textAnchor="middle" className="text-xs font-mono" fontSize="10">
          {span}mm
        </text>
      </svg>
    </div>
  );
};

// ============================================================================
// INFORMATION PANELS
// ============================================================================

/**
 * Design Reference Panel - Shows clause references and calculations
 */
export const DesignReference: React.FC<{
  clause: string;
  title: string;
  calculation?: string;
  notes?: string[];
}> = ({ clause, title, calculation, notes }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
    <div className="flex items-start gap-2">
      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs font-bold text-blue-900">AS 3600 {clause}</p>
        <p className="text-sm font-semibold text-blue-900 mt-1">{title}</p>
      </div>
    </div>
    {calculation && (
      <div className="bg-white border border-blue-100 rounded px-3 py-2">
        <p className="text-xs font-mono text-gray-700">{calculation}</p>
      </div>
    )}
    {notes && notes.length > 0 && (
      <ul className="text-xs text-blue-900 space-y-1">
        {notes.map((note, i) => (
          <li key={i}>• {note}</li>
        ))}
      </ul>
    )}
  </div>
);

/**
 * Warning/Error Alert
 */
export const Alert: React.FC<{
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  onDismiss?: () => void;
}> = ({ type, title, message, onDismiss }) => {
  const colors = {
    error: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-green-50 border-green-200 text-green-900'
  };
  
  const icons = {
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    success: <CheckCircle2 className="w-5 h-5" />
  };
  
  return (
    <div className={cn("border rounded-lg p-4 flex gap-3", colors[type])}>
      {icons[type]}
      <div className="flex-1">
        <p className="font-bold text-sm">{title}</p>
        <p className="text-sm mt-1">{message}</p>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-lg font-bold opacity-50 hover:opacity-100">
          ×
        </button>
      )}
    </div>
  );
};

export default {
  DesignInputCard,
  DesignResultCard,
  ComplianceStatus,
  InputField,
  TabGroup,
  SectionProfile,
  LoadDiagram,
  DesignReference,
  Alert
};
