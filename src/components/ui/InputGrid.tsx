import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputFieldProps {
  label: string;
  value: number | string;
  onChange: (value: number) => void;
  unit?: string;
  description?: string;
  tooltip?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  unit,
  description,
  tooltip,
  min,
  max,
  step = 1,
}) => {
  return (
    <div className="group border-b border-line last:border-0 hover:bg-gray-50 transition-colors relative">
      <div className="flex items-center px-4 py-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <label className="block text-[10px] font-mono uppercase tracking-widest text-ink/50 group-hover:text-ink transition-colors">
              {label}
            </label>
            {tooltip && (
              <div className="relative group/tooltip">
                <div className="w-3.5 h-3.5 rounded-full border border-ink/20 flex items-center justify-center text-[8px] font-bold cursor-help opacity-40 group-hover/tooltip:opacity-100 transition-opacity">?</div>
                <div className="tooltip-content translate-x-0 left-0 ml-0 bottom-full mb-2">
                  {tooltip}
                </div>
              </div>
            )}
          </div>
          {description && (
            <span className="text-[10px] text-ink/40 italic mt-0.5 block">{description}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            min={min}
            max={max}
            step={step}
            className="w-24 bg-transparent border-b border-line focus:border-accent outline-none text-right font-mono text-sm px-1 py-0.5 transition-colors"
          />
          {unit && (
            <span className="w-10 text-[10px] font-mono text-ink/30 uppercase">
              {unit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

interface InputGroupProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({ title, children, className }) => {
  return (
    <div className={cn("brutal-card overflow-hidden", className)}>
      <div className="bg-ink text-white px-4 py-2 text-[10px] font-mono uppercase tracking-[0.2em] flex justify-between items-center">
        <span>{title}</span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        </div>
      </div>
      <div className="divide-y divide-line">
        {children}
      </div>
    </div>
  );
};

interface ResultRowProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'pass' | 'fail' | 'info';
  tooltip?: string;
}

export const ResultRow: React.FC<ResultRowProps> = ({ label, value, unit, status, tooltip }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-line last:border-0 hover:bg-gray-50 transition-colors group relative">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-ink/70">{label}</span>
        {tooltip && (
          <div className="relative group/tooltip">
            <div className="w-3.5 h-3.5 rounded-full border border-ink/20 flex items-center justify-center text-[8px] font-bold cursor-help opacity-40 group-hover/tooltip:opacity-100 transition-opacity">?</div>
            <div className="tooltip-content translate-x-0 left-0 ml-0 bottom-full mb-2">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={cn(
          "font-mono text-sm font-bold",
          status === 'pass' && "text-green-600",
          status === 'fail' && "text-red-600",
          status === 'info' && "text-accent",
        )}>
          {value}
        </span>
        {unit && <span className="text-[10px] font-mono text-ink/30 uppercase">{unit}</span>}
      </div>
    </div>
  );
};
