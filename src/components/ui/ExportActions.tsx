import React from 'react';
import { Download, FileCode } from 'lucide-react';
import { exportToPDF, exportToPython, DesignInput, DesignResult } from '../../lib/exportUtils';

interface ExportActionsProps {
  title: string;
  inputs: DesignInput[];
  results: DesignResult[];
  procedure: string;
  filename?: string;
}

export const ExportActions: React.FC<ExportActionsProps> = ({
  title,
  inputs,
  results,
  procedure,
  filename
}) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => exportToPDF(title, inputs, results, `${filename || 'report'}.pdf`)}
        className="flex items-center gap-2 px-3 py-1.5 border border-[#141414] text-[#141414] text-[10px] font-mono uppercase hover:bg-[#141414] hover:text-white transition-colors"
        title="Export to PDF Report"
      >
        <Download size={12} /> PDF Report
      </button>
      <button
        onClick={() => exportToPython(title, inputs, procedure, `${filename || 'procedure'}.py`)}
        className="flex items-center gap-2 px-3 py-1.5 border border-[#141414] text-[#141414] text-[10px] font-mono uppercase hover:bg-[#141414] hover:text-white transition-colors"
        title="Export Design Procedure to Python"
      >
        <FileCode size={12} /> Python Script
      </button>
    </div>
  );
};
