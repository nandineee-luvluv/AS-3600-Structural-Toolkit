import React, { createContext, useContext, useState, useEffect } from 'react';

interface CustomMaterial {
  id: string;
  label: string;
  fc: number;
  fsy: number;
  type: 'concrete' | 'steel';
}

interface MaterialContextType {
  customMaterials: CustomMaterial[];
  addMaterial: (m: Omit<CustomMaterial, 'id'>) => void;
  removeMaterial: (id: string) => void;
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

const STORAGE_KEY = 'as3600_custom_materials';

export const MaterialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customMaterials, setCustomMaterials] = useState<CustomMaterial[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customMaterials));
  }, [customMaterials]);

  const addMaterial = (m: Omit<CustomMaterial, 'id'>) => {
    const newMaterial = { ...m, id: Math.random().toString(36).substr(2, 9) };
    setCustomMaterials(prev => [...prev, newMaterial]);
  };

  const removeMaterial = (id: string) => {
    setCustomMaterials(prev => prev.filter(m => m.id !== id));
  };

  return (
    <MaterialContext.Provider value={{ customMaterials, addMaterial, removeMaterial }}>
      {children}
    </MaterialContext.Provider>
  );
};

export const useMaterials = () => {
  const context = useContext(MaterialContext);
  if (!context) throw new Error('useMaterials must be used within a MaterialProvider');
  return context;
};
