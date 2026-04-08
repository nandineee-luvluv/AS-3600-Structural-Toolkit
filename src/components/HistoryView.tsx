import React from 'react';
import { useHistory } from '../contexts/HistoryContext';
import { Clock, Trash2, ChevronRight, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

export const HistoryView: React.FC = () => {
  const { history, clearHistory } = useHistory();

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-ink/20">
        <Clock size={64} strokeWidth={1} className="mb-6 opacity-20" />
        <p className="font-mono text-[10px] uppercase tracking-[0.3em]">No calculation history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="flex items-end justify-between border-b border-line pb-8">
        <div>
          <h2 className="text-4xl font-serif font-bold italic tracking-tight text-ink">Design History</h2>
          <p className="text-[10px] font-mono opacity-40 uppercase tracking-[0.3em] mt-2">Recent design sessions and snapshots</p>
        </div>
        <button 
          onClick={clearHistory}
          className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 text-[10px] font-mono uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
        >
          <Trash2 size={12} /> Clear History
        </button>
      </header>

      <div className="grid gap-6">
        {history.map((item) => (
          <div 
            key={item.id}
            className="group brutal-card bg-white p-6 hover:translate-x-1 hover:-translate-y-1 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-ink text-white rounded-sm shadow-lg">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-ink">{item.title}</h3>
                  <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest mt-1">
                    {new Date(item.timestamp).toLocaleString()} • {item.type}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-8 pt-6 border-t border-line">
              {Object.entries(item.results).slice(0, 4).map(([key, val]: [string, any]) => (
                <div key={key}>
                  <div className="text-[8px] font-mono uppercase opacity-30 tracking-widest mb-1">{key}</div>
                  <div className="text-xs font-bold text-ink/80">{typeof val === 'number' ? val.toFixed(2) : val}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
