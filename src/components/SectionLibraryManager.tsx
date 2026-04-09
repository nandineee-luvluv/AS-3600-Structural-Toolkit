import React, { useState } from 'react';
import { useSections } from '../contexts/SectionContext';
import { InputField } from './ui/InputGrid';
import { Edit2, Trash2, Plus, X, Save, RotateCcw, Layout, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const SectionDiagram: React.FC<{ type: 'beams' | 'columns' | 'walls' | 'slabs'; data: any }> = ({ type, data }) => {
  const shape = data.shape || 'rectangular';

  if (type === 'slabs') {
    if (shape === 'waffle') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 0 20 L 100 20 L 100 35 L 85 35 L 85 80 L 65 80 L 65 35 L 35 35 L 35 80 L 15 80 L 15 35 L 0 35 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <text x="50" y="15" fontSize="6" textAnchor="middle" className="fill-current opacity-40">Waffle</text>
        </svg>
      );
    }
    if (shape === 'footing') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="10" y="20" width="80" height="40" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M 10 60 L 10 80 M 30 60 L 30 80 M 50 60 L 50 80 M 70 60 L 70 80 M 90 60 L 90 80" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="opacity-40" />
          <text x="50" y="15" fontSize="6" textAnchor="middle" className="fill-current opacity-40">Footing</text>
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="5" y="40" width="90" height="20" fill="none" stroke="currentColor" strokeWidth="2" />
        <text x="50" y="35" fontSize="6" textAnchor="middle" className="fill-current opacity-40">h = {data.h}mm</text>
      </svg>
    );
  }

  if (type === 'beams') {
    if (shape === 't-beam' || shape === 'l-beam') {
      const bf = data.bf || 600;
      const tf = data.tf || 150;
      const tw = data.tw || 200;
      const h = data.h || 600;
      const isL = shape === 'l-beam';
      
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path 
            d={isL 
              ? `M 20 20 L 80 20 L 80 40 L 40 40 L 40 80 L 20 80 Z`
              : `M 10 20 L 90 20 L 90 40 L 60 40 L 60 80 L 40 80 L 40 40 L 10 40 Z`
            } 
            fill="none" stroke="currentColor" strokeWidth="2" 
          />
          <text x="50" y="15" fontSize="6" textAnchor="middle" className="fill-current opacity-40">bf={bf}</text>
          <text x="95" y="30" fontSize="6" textAnchor="middle" transform="rotate(90 95 30)" className="fill-current opacity-40">tf={tf}</text>
          <text x="50" y="85" fontSize="6" textAnchor="middle" className="fill-current opacity-40">tw={tw}</text>
        </svg>
      );
    }
    if (shape === 'trapezoidal') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 20 20 L 80 20 L 70 80 L 30 80 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <text x="50" y="15" fontSize="6" textAnchor="middle" className="fill-current opacity-40">b_top={data.b_top}</text>
          <text x="50" y="88" fontSize="6" textAnchor="middle" className="fill-current opacity-40">b_bot={data.b_bottom}</text>
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="25" y="20" width="50" height="60" fill="none" stroke="currentColor" strokeWidth="2" />
        <text x="50" y="15" fontSize="6" textAnchor="middle" className="fill-current opacity-40">b = {data.b}mm</text>
        <text x="85" y="50" fontSize="6" textAnchor="middle" transform="rotate(90 85 50)" className="fill-current opacity-40">h = {data.h}mm</text>
      </svg>
    );
  }

  if (type === 'columns' || type === 'walls') {
    if (shape === 't-shaped') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 10 20 L 90 20 L 90 40 L 60 40 L 60 90 L 40 90 L 40 40 L 10 40 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <text x="50" y="15" fontSize="6" textAnchor="middle" className="fill-current opacity-40">Flange</text>
        </svg>
      );
    }
    if (shape === 'l-shaped') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 20 10 L 40 10 L 40 70 L 90 70 L 90 90 L 20 90 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <text x="30" y="5" fontSize="6" textAnchor="middle" className="fill-current opacity-40">L-Shape</text>
        </svg>
      );
    }
    if (shape === 'i-shaped') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 20 10 L 80 10 L 80 25 L 55 25 L 55 75 L 80 75 L 80 90 L 20 90 L 20 75 L 45 75 L 45 25 L 20 25 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <text x="50" y="5" fontSize="6" textAnchor="middle" className="fill-current opacity-40">I-Shape</text>
        </svg>
      );
    }
    if (shape === 'c-shaped') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 80 10 L 80 90 L 20 90 L 20 75 L 65 75 L 65 25 L 20 25 L 20 10 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <text x="50" y="5" fontSize="6" textAnchor="middle" className="fill-current opacity-40">C-Shape</text>
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="2" />
        <text x="50" y="20" fontSize="6" textAnchor="middle" className="fill-current opacity-40">b = {data.b || data.tw}mm</text>
      </svg>
    );
  }
  return null;
};

interface SectionLibraryManagerProps {
  type: 'beams' | 'columns' | 'walls' | 'slabs';
  onSelect?: (section: any) => void;
}

export const SectionLibraryManager: React.FC<SectionLibraryManagerProps> = ({ type, onSelect }) => {
  const { library, addSection, updateSection, deleteSection, resetLibrary } = useSections();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleEdit = (section: any) => {
    setEditingId(section.id);
    setEditForm({ ...section });
    setIsAdding(false);
  };

  const handleSave = () => {
    if (isAdding) {
      addSection(type, editForm);
      setIsAdding(false);
    } else if (editingId) {
      updateSection(type, editingId, editForm);
      setEditingId(null);
    }
    setEditForm(null);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    const defaults: any = { label: 'New Section', shape: 'rectangular' };
    if (type === 'beams') {
      defaults.b = 300;
      defaults.h = 600;
      defaults.L = 6000;
      defaults.cover = 40;
    } else if (type === 'columns') {
      defaults.b = 400;
      defaults.h = 400;
      defaults.L = 4000;
      defaults.cover = 40;
    } else if (type === 'slabs') {
      defaults.h = 200;
      defaults.Lx = 4000;
      defaults.Ly = 6000;
      defaults.cover = 25;
      defaults.shape = 'one-way';
    } else {
      defaults.tw = 200;
      defaults.Lw = 3000;
      defaults.Hw = 3000;
    }
    setEditForm(defaults);
  };

  const renderEditFields = () => {
    if (!editForm) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 bg-gray-50 border border-line mt-4 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <InputField 
                label="Section Label" 
                value={editForm.label} 
                onChange={(val) => setEditForm({ ...editForm, label: val })} 
                unit=""
              />
            </div>
            <div className="col-span-2 p-4 bg-white border border-line space-y-2">
              <label className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Section Shape</label>
              <select 
                value={editForm.shape}
                onChange={(e) => setEditForm({ ...editForm, shape: e.target.value })}
                className="w-full bg-white border border-line p-2 text-[10px] font-mono uppercase tracking-wider focus:border-accent outline-none"
              >
                {type === 'beams' && (
                  <>
                    <option value="rectangular">Rectangular</option>
                    <option value="t-beam">T-Beam</option>
                    <option value="l-beam">L-Beam</option>
                    <option value="trapezoidal">Trapezoidal</option>
                  </>
                )}
                {type === 'slabs' && (
                  <>
                    <option value="one-way">One-Way</option>
                    <option value="two-way">Two-Way</option>
                    <option value="waffle">Waffle</option>
                    <option value="footing">Footing</option>
                  </>
                )}
                {type === 'columns' && (
                  <>
                    <option value="rectangular">Rectangular</option>
                    <option value="t-shaped">T-Shaped</option>
                    <option value="l-shaped">L-Shaped</option>
                    <option value="i-shaped">I-Shaped</option>
                  </>
                )}
                {type === 'walls' && (
                  <>
                    <option value="linear">Linear</option>
                    <option value="t-shaped">T-Shaped</option>
                    <option value="l-shaped">L-Shaped</option>
                    <option value="i-shaped">I-Shaped</option>
                    <option value="c-shaped">C-Shaped</option>
                  </>
                )}
              </select>
            </div>

            {/* Shape Specific Fields */}
            {editForm.shape === 'rectangular' && (
              <>
                <InputField label="Width (b)" value={editForm.b} onChange={(val) => setEditForm({ ...editForm, b: val })} unit="mm" />
                <InputField label="Height (h)" value={editForm.h} onChange={(val) => setEditForm({ ...editForm, h: val })} unit="mm" />
              </>
            )}
            {(editForm.shape === 't-beam' || editForm.shape === 'l-beam') && (
              <>
                <InputField label="Flange Width (bf)" value={editForm.bf} onChange={(val) => setEditForm({ ...editForm, bf: val })} unit="mm" />
                <InputField label="Slab Thickness (tf)" value={editForm.tf} onChange={(val) => setEditForm({ ...editForm, tf: val })} unit="mm" />
                <InputField label="Web Width (tw)" value={editForm.tw} onChange={(val) => setEditForm({ ...editForm, tw: val })} unit="mm" />
                <InputField label="Total Height (h)" value={editForm.h} onChange={(val) => setEditForm({ ...editForm, h: val })} unit="mm" />
              </>
            )}
            {editForm.shape === 'trapezoidal' && (
              <>
                <InputField label="Top Width (b_top)" value={editForm.b_top} onChange={(val) => setEditForm({ ...editForm, b_top: val })} unit="mm" />
                <InputField label="Bottom Width (b_bottom)" value={editForm.b_bottom} onChange={(val) => setEditForm({ ...editForm, b_bottom: val })} unit="mm" />
                <InputField label="Height (h)" value={editForm.h} onChange={(val) => setEditForm({ ...editForm, h: val })} unit="mm" />
              </>
            )}
            {editForm.shape === 't-shaped' && (
              <>
                <InputField label="Flange Length (bf)" value={editForm.bf} onChange={(val) => setEditForm({ ...editForm, bf: val })} unit="mm" />
                <InputField label="Flange Thickness (tf)" value={editForm.tf} onChange={(val) => setEditForm({ ...editForm, tf: val })} unit="mm" />
                <InputField label="Web Thickness (tw)" value={editForm.tw} onChange={(val) => setEditForm({ ...editForm, tw: val })} unit="mm" />
                <InputField label="Web Height (hw)" value={editForm.hw} onChange={(val) => setEditForm({ ...editForm, hw: val })} unit="mm" />
              </>
            )}
            {editForm.shape === 'l-shaped' && (
              <>
                <InputField label="Leg 1 Length (l1)" value={editForm.l1} onChange={(val) => setEditForm({ ...editForm, l1: val })} unit="mm" />
                <InputField label="Leg 1 Thickness (t1)" value={editForm.t1} onChange={(val) => setEditForm({ ...editForm, t1: val })} unit="mm" />
                <InputField label="Leg 2 Length (l2)" value={editForm.l2} onChange={(val) => setEditForm({ ...editForm, l2: val })} unit="mm" />
                <InputField label="Leg 2 Thickness (t2)" value={editForm.t2} onChange={(val) => setEditForm({ ...editForm, t2: val })} unit="mm" />
              </>
            )}
            {editForm.shape === 'i-shaped' && (
              <>
                <InputField label="Top Flange (bf_top)" value={editForm.bf_top} onChange={(val) => setEditForm({ ...editForm, bf_top: val })} unit="mm" />
                <InputField label="Top Thick (tf_top)" value={editForm.tf_top} onChange={(val) => setEditForm({ ...editForm, tf_top: val })} unit="mm" />
                <InputField label="Web Thick (tw)" value={editForm.tw} onChange={(val) => setEditForm({ ...editForm, tw: val })} unit="mm" />
                <InputField label="Web Height (hw)" value={editForm.hw} onChange={(val) => setEditForm({ ...editForm, hw: val })} unit="mm" />
                <InputField label="Bot Flange (bf_bot)" value={editForm.bf_bot} onChange={(val) => setEditForm({ ...editForm, bf_bot: val })} unit="mm" />
                <InputField label="Bot Thick (tf_bot)" value={editForm.tf_bot} onChange={(val) => setEditForm({ ...editForm, tf_bot: val })} unit="mm" />
              </>
            )}
            {editForm.shape === 'c-shaped' && (
              <>
                <InputField label="Web Length (tw)" value={editForm.tw} onChange={(val) => setEditForm({ ...editForm, tw: val })} unit="mm" />
                <InputField label="Flange Length (bf)" value={editForm.bf} onChange={(val) => setEditForm({ ...editForm, bf: val })} unit="mm" />
                <InputField label="Flange Thick (tf)" value={editForm.tf} onChange={(val) => setEditForm({ ...editForm, tf: val })} unit="mm" />
                <InputField label="Web Height (hw)" value={editForm.hw} onChange={(val) => setEditForm({ ...editForm, hw: val })} unit="mm" />
              </>
            )}
            {editForm.shape === 'linear' && (
              <>
                <InputField label="Thickness (tw)" value={editForm.tw} onChange={(val) => setEditForm({ ...editForm, tw: val })} unit="mm" />
                <InputField label="Length (Lw)" value={editForm.Lw} onChange={(val) => setEditForm({ ...editForm, Lw: val })} unit="mm" />
              </>
            )}
            {(type === 'slabs') && (
              <>
                <InputField label="Thickness (h)" value={editForm.h} onChange={(val) => setEditForm({ ...editForm, h: val })} unit="mm" />
                <InputField label="Span Lx" value={editForm.Lx} onChange={(val) => setEditForm({ ...editForm, Lx: val })} unit="mm" />
                <InputField label="Span Ly" value={editForm.Ly} onChange={(val) => setEditForm({ ...editForm, Ly: val })} unit="mm" />
              </>
            )}
            
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <InputField label={type === 'walls' ? 'Height (Hw)' : 'Length (L)'} value={type === 'walls' ? editForm.Hw : editForm.L} onChange={(val) => setEditForm({ ...editForm, [type === 'walls' ? 'Hw' : 'L']: val })} unit="mm" />
              {type !== 'walls' && <InputField label="Cover" value={editForm.cover} onChange={(val) => setEditForm({ ...editForm, cover: val })} unit="mm" />}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="aspect-square bg-white border border-line p-8 flex items-center justify-center text-ink">
            <SectionDiagram type={type} data={editForm} />
          </div>
          <div className="flex flex-col gap-2">
            <button 
              onClick={handleSave}
              className="w-full py-3 text-[10px] font-mono bg-ink text-white border border-ink hover:bg-ink/90 uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
            >
              <Save size={14} /> Save Section
            </button>
            <button 
              onClick={() => { setEditingId(null); setIsAdding(false); setEditForm(null); }}
              className="w-full py-3 text-[10px] font-mono border border-line hover:bg-gray-100 uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Layout size={16} className="text-accent" />
          <h3 className="text-[12px] font-mono font-bold uppercase tracking-widest text-ink">Section Library</h3>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleAdd}
            className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono bg-ink text-white uppercase tracking-widest hover:bg-ink/90 transition-all"
          >
            <Plus size={12} /> Add New
          </button>
          <button 
            onClick={resetLibrary}
            className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono border border-line hover:bg-gray-50 uppercase tracking-widest text-red-600/60"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </div>

      {(isAdding || editingId) && renderEditFields()}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {library[type] && library[type].map((section: any) => (
          <div 
            key={section.id}
            onClick={() => onSelect?.(section)}
            className={cn(
              "group p-4 border border-line bg-white transition-all relative cursor-pointer hover:border-accent hover:shadow-md",
              editingId === section.id ? "border-accent ring-1 ring-accent" : ""
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink">{section.label}</div>
                <div className="text-[8px] font-mono opacity-40 uppercase mt-0.5 tracking-widest">{section.shape}</div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); handleEdit(section); }} className="p-1.5 hover:bg-accent/10 hover:text-accent transition-colors"><Edit2 size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); deleteSection(type, section.id); }} className="p-1.5 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={12} /></button>
              </div>
            </div>
            
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                <SectionDiagram type={type} data={section} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] font-mono opacity-60">
                {section.b && <div>b: {section.b}</div>}
                {section.h && <div>h: {section.h}</div>}
                {section.tw && <div>tw: {section.tw}</div>}
                {section.bf && <div>bf: {section.bf}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
