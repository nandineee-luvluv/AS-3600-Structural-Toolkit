import React, { createContext, useContext, useState, useEffect } from 'react';

export interface HistoryItem {
  id: string;
  type: string;
  timestamp: number;
  title: string;
  inputs: any;
  results: any;
}

interface HistoryContextType {
  history: HistoryItem[];
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('as3600_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('as3600_history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    setHistory(prev => [newItem, ...prev].slice(0, 50)); // Keep last 50
  };

  const clearHistory = () => setHistory([]);

  return (
    <HistoryContext.Provider value={{ history, addToHistory, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) throw new Error('useHistory must be used within HistoryProvider');
  return context;
};
