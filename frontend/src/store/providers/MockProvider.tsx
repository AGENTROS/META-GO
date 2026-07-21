import React from 'react';
import { useIdentityStore } from '../useIdentityStore';

export const MockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Hydrates the store with mock data on mount
  React.useEffect(() => {
    const hydrate = useIdentityStore.getState().hydrateMockData;
    hydrate();
  }, []);

  return <>{children}</>;
};
