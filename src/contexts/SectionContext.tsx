import React, { createContext, useContext, useState, useEffect } from 'react';
import { SECTION_LIBRARY } from '../lib/as3600';

type SectionLibrary = typeof SECTION_LIBRARY;

interface SectionContextType {
  library: SectionLibrary;
  addSection: (type: keyof SectionLibrary, section: any) => void;
  updateSection: (type: keyof SectionLibrary, id: string, section: any) => void;
  deleteSection: (type: keyof SectionLibrary, id: string) => void;
  resetLibrary: () => void;
}

const SectionContext = createContext<SectionContextType | undefined>(undefined);

const STORAGE_KEY = 'as3600_section_library';

export const SectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [library, setLibrary] = useState<SectionLibrary>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return SECTION_LIBRARY;
    try {
      const parsed = JSON.parse(saved);
      // Merge with defaults to ensure new keys (like 'slabs') are present
      return { ...SECTION_LIBRARY, ...parsed };
    } catch (e) {
      return SECTION_LIBRARY;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  }, [library]);

  const addSection = (type: keyof SectionLibrary, section: any) => {
    setLibrary(prev => ({
      ...prev,
      [type]: [...prev[type], { ...section, id: `${type}_${Date.now()}` }]
    }));
  };

  const updateSection = (type: keyof SectionLibrary, id: string, section: any) => {
    setLibrary(prev => ({
      ...prev,
      [type]: prev[type].map(s => s.id === id ? { ...section, id } : s)
    }));
  };

  const deleteSection = (type: keyof SectionLibrary, id: string) => {
    setLibrary(prev => ({
      ...prev,
      [type]: prev[type].filter(s => s.id !== id)
    }));
  };

  const resetLibrary = () => {
    setLibrary(SECTION_LIBRARY);
  };

  return (
    <SectionContext.Provider value={{ library, addSection, updateSection, deleteSection, resetLibrary }}>
      {children}
    </SectionContext.Provider>
  );
};

export const useSections = () => {
  const context = useContext(SectionContext);
  if (!context) {
    throw new Error('useSections must be used within a SectionProvider');
  }
  return context;
};
