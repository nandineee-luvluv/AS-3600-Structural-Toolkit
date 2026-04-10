import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { Info, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ComplianceCheck } from '../../lib/ncc-compliance';

interface ComplianceInfoProps {
  equation?: string;
  clause?: string;
  description?: string;
  className?: string;
  block?: boolean;
}

interface ComplianceChecksDisplayProps {
  checks: ComplianceCheck[];
  className?: string;
}

export const ComplianceInfo: React.FC<ComplianceInfoProps> = ({ 
  equation, 
  clause, 
  description, 
  className,
  block = false
}) => {
  if (!equation && !clause) return null;

  return (
    <div className={cn("group/compliance relative inline-flex items-center gap-1", className)}>
      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-accent/5 border border-accent/20 rounded-sm cursor-help transition-colors hover:bg-accent/10">
        <Info size={10} className="text-accent" />
        {clause && (
          <span className="text-[8px] font-mono font-bold text-accent uppercase tracking-tighter">
            AS 3600 {clause}
          </span>
        )}
      </div>

      {/* Tooltip content */}
      <div className="invisible group-hover/compliance:visible absolute z-50 bottom-full left-0 mb-2 w-80 p-4 bg-white border border-ink shadow-xl animate-in fade-in slide-in-from-bottom-1 duration-200">
        <div className="space-y-3">
          <div className="flex justify-between items-start border-b border-line pb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink/40">Compliance Reference</span>
            {clause && <span className="text-[10px] font-mono font-bold text-accent">Clause {clause}</span>}
          </div>
          
          {description && (
            <p className="text-[10px] font-sans leading-relaxed text-ink/70 italic">
              {description}
            </p>
          )}

          {equation && (
            <div className="py-2 bg-gray-50 border border-line flex justify-center overflow-x-auto">
              {block ? <BlockMath math={equation} /> : <InlineMath math={equation} />}
            </div>
          )}
        </div>
        
        {/* Arrow */}
        <div className="absolute top-full left-4 -translate-y-px border-8 border-transparent border-t-white" />
        <div className="absolute top-full left-4 border-8 border-transparent border-t-ink -z-10" />
      </div>
    </div>
  );
};

/**
 * Display compliance checks from the structured compliance system
 */
export const ComplianceChecksDisplay: React.FC<ComplianceChecksDisplayProps> = ({ checks, className }) => {
  const hasFailed = checks.some(c => c.status === 'fail');
  const hasWarnings = checks.some(c => c.status === 'warning');
  const overallStatus = hasFailed ? 'fail' : hasWarnings ? 'warning' : 'pass';

  const statusIcon = {
    pass: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    fail: <AlertCircle className="w-4 h-4 text-red-600" />,
  };

  const statusColor = {
    pass: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    fail: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className={cn(
        "p-3 border rounded-lg flex items-center gap-2",
        statusColor[overallStatus]
      )}>
        {statusIcon[overallStatus]}
        <div>
          <p className="text-xs font-bold uppercase">
            {overallStatus === 'pass' ? 'All Compliant' : overallStatus === 'warning' ? 'Warnings Found' : 'Non-Compliant'}
          </p>
          <p className="text-xs opacity-80">{checks.length} checks performed</p>
        </div>
      </div>

      {checks.map((check, idx) => (
        <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
          <div className="flex items-start gap-2">
            {check.status === 'pass' && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />}
            {check.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />}
            {check.status === 'fail' && <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono font-bold text-ink/70">{check.standard} {check.clause}</p>
              <p className="text-xs font-semibold text-ink mt-0.5">{check.requirement}</p>
              <p className="text-xs text-ink/60 mt-1">{check.message}</p>
              {check.reference && (
                <p className="text-xs text-ink/40 mt-1 font-mono">Ref: {check.reference}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
