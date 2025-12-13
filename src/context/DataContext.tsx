// This context is deprecated and no longer in use.
// Data fetching has been moved to individual pages for better performance
// and on-demand loading. Global settings are now handled by SettingsContext.
import React, { createContext, useContext, ReactNode } from 'react';

interface DeprecatedDataContextType {}

const DataContext = createContext<DeprecatedDataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <DataContext.Provider value={{}}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DeprecatedDataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData is deprecated and should not be used.');
  }
  return context;
};
