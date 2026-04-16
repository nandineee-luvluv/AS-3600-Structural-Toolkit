import React, { useEffect, useRef } from 'react';

interface MathDisplayProps {
  equation: string;
  display?: 'inline' | 'block';
  className?: string;
}

export const MathDisplay: React.FC<MathDisplayProps> = ({ 
  equation, 
  display = 'inline',
  className = ''
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && (window as any).MathJax) {
      (window as any).MathJax.typesetPromise([ref.current]).catch((err: any) => {
        console.error('MathJax typeset error:', err);
      });
    }
  }, [equation]);

  const displayMode = display === 'block' ? '$$' : '$';
  const formattedEquation = display === 'block' 
    ? `$$${equation}$$`
    : `$${equation}$`;

  return (
    <div 
      ref={ref} 
      className={`${display === 'block' ? 'my-4' : 'inline'} ${className}`}
      style={{ overflow: 'auto' }}
    >
      {formattedEquation}
    </div>
  );
};

export default MathDisplay;
