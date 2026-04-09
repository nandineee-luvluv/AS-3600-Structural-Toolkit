import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  LoadCombination, 
  AS1170_ULS_COMBINATIONS, 
  AS1170_SLS_COMBINATIONS 
} from '../lib/as1170';

interface LoadCombinationContextType {
  combinations: LoadCombination[];
  addCombination: (combo: Omit<LoadCombination, 'id' | 'type'>) => void;
  removeCombination: (id: string) => void;
}

const LoadCombinationContext = createContext<LoadCombinationContextType | undefined>(undefined);

export const LoadCombinationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userCombinations, setUserCombinations] = useState<LoadCombination[]>([]);

  // Load from local storage if needed
  useEffect(() => {
    const saved = localStorage.getItem('user_load_combinations');
    if (saved) {
      try {
        setUserCombinations(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse user load combinations', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('user_load_combinations', JSON.stringify(userCombinations));
  }, [userCombinations]);

  const combinations = [
    ...AS1170_ULS_COMBINATIONS,
    ...AS1170_SLS_COMBINATIONS,
    ...userCombinations
  ];

  const addCombination = (combo: Omit<LoadCombination, 'id' | 'type'>) => {
    const newCombo: LoadCombination = {
      ...combo,
      id: `user_${Date.now()}`,
      type: 'USER'
    };
    setUserCombinations([...userCombinations, newCombo]);
  };

  const removeCombination = (id: string) => {
    setUserCombinations(userCombinations.filter(c => c.id !== id));
  };

  return (
    <LoadCombinationContext.Provider value={{ combinations, addCombination, removeCombination }}>
      {children}
    </LoadCombinationContext.Provider>
  );
};

export const useLoadCombinations = () => {
  const context = useContext(LoadCombinationContext);
  if (!context) {
    throw new Error('useLoadCombinations must be used within a LoadCombinationProvider');
  }
  return context;
};
