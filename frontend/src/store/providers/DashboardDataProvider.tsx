import React from 'react';
import { MockProvider } from './MockProvider';
import { BackendProvider } from './BackendProvider';

export const DashboardDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Toggle this via env var
  const useMock = process.env.NEXT_PUBLIC_TEST_MODE === '1';

  return useMock ? (
    <MockProvider>{children}</MockProvider>
  ) : (
    <BackendProvider>{children}</BackendProvider>
  );
};
