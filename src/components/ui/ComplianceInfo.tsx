import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { Info } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ComplianceInfoProps {
  equation?: string;
  clause?: string;
  description?: string;
  className?: string;
  block?: boolean;
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
