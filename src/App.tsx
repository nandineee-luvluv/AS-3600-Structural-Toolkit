/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Calculator, 
  Layout as LayoutIcon, 
  Columns, 
  Square, 
  RectangleVertical, 
  Settings,
  ChevronRight,
  Clock,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import BeamCalculator from './components/calculators/BeamCalculator';
import ColumnCalculator from './components/calculators/ColumnCalculator';
import SlabCalculator from './components/calculators/SlabCalculator';
import WallCalculator from './components/calculators/WallCalculator';
import RetainingWallCalculator from './components/calculators/RetainingWallCalculator';
import { MaterialSettings } from './components/MaterialSettings';
import { SectionLibraryManager } from './components/SectionLibraryManager';
import { HistoryProvider } from './contexts/HistoryContext';
import { LoadCombinationProvider } from './contexts/LoadCombinationContext';
import { SectionProvider } from './contexts/SectionContext';
import { MaterialProvider } from './contexts/MaterialContext';
import { HistoryView } from './components/HistoryView';
import { cn } from './lib/utils';

type MemberType = 'beam' | 'column' | 'slab' | 'wall' | 'retaining-wall' | 'materials' | 'sections' | 'history';

function AppContent() {
  const [activeMember, setActiveMember] = useState<MemberType>('beam');

  const menuItems = [
    { id: 'beam', label: 'Beam Design', icon: Calculator },
    { id: 'column', label: 'Column Design', icon: Columns },
    { id: 'slab', label: 'Slab Design', icon: Square },
    { id: 'wall', label: 'Shear Wall', icon: RectangleVertical },
    { id: 'retaining-wall', label: 'Retaining Wall', icon: LayoutIcon },
    { id: 'materials', label: 'Material Database', icon: Database },
    { id: 'history', label: 'Design History', icon: Clock },
  ];

  return (
    <div className="flex h-screen bg-bg text-ink font-sans overflow-hidden bg-grid">
      {/* Sidebar */}
      <aside className="w-64 border-r border-line flex flex-col bg-white/50 backdrop-blur-xl z-20">
        <div className="p-8">
          <h1 className="text-2xl font-bold tracking-tight uppercase italic font-serif leading-none">
            AS 3600
            <span className="block text-[10px] font-mono not-italic opacity-40 uppercase tracking-[0.3em] mt-2">
              Structural Toolkit
            </span>
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink/30 px-4 mb-2">Calculators</div>
          {menuItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMember(item.id as MemberType)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-all duration-200 rounded-sm",
                activeMember === item.id 
                  ? "bg-ink text-white shadow-lg" 
                  : "hover:bg-ink/5 text-ink/60 hover:text-ink"
              )}
            >
              <item.icon size={14} />
              {item.label}
              {activeMember === item.id && <ChevronRight size={12} className="ml-auto opacity-50" />}
            </button>
          ))}

          <div className="text-[10px] font-mono uppercase tracking-widest text-ink/30 px-4 mb-2 mt-8">System</div>
          {menuItems.slice(5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMember(item.id as MemberType)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-all duration-200 rounded-sm",
                activeMember === item.id 
                  ? "bg-ink text-white shadow-lg" 
                  : "hover:bg-ink/5 text-ink/60 hover:text-ink"
              )}
            >
              <item.icon size={14} />
              {item.label}
              {activeMember === item.id && <ChevronRight size={12} className="ml-auto opacity-50" />}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-line">
          <div className="flex items-center gap-2 text-[10px] font-mono opacity-40 uppercase tracking-widest">
            <Settings size={12} />
            <span>v1.0.0 | 2018</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        <div className="max-w-[1400px] mx-auto p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMember}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {activeMember === 'beam' && <BeamCalculator />}
              {activeMember === 'column' && <ColumnCalculator />}
              {activeMember === 'slab' && <SlabCalculator />}
              {activeMember === 'wall' && <WallCalculator />}
              {activeMember === 'retaining-wall' && <RetainingWallCalculator />}
              {activeMember === 'materials' && <MaterialSettings onSave={(m) => console.log('Saved:', m)} />}
              {activeMember === 'history' && <HistoryView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HistoryProvider>
      <LoadCombinationProvider>
        <SectionProvider>
          <MaterialProvider>
            <AppContent />
          </MaterialProvider>
        </SectionProvider>
      </LoadCombinationProvider>
    </HistoryProvider>
  );
}
