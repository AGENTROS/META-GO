import React, { useEffect } from 'react';
import { useIdentityStore } from '../useIdentityStore';
import { useTrustStore } from '../trustStore';
import { useGuardianStore } from '../guardianStore';
import { usePassportStore } from '../passportStore';
import { useEventsStore } from '../eventsStore';
import { apiCall } from '@/lib/api';

export const BackendProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Basic polling or initial fetch logic
    const fetchBackendData = async () => {
      const did = useIdentityStore.getState().did;
      if (!did) return;
      
      const safeApiCall = async (url: string, callback: (data: any) => void) => {
        try {
          const res = await apiCall(url);
          if (res.success) callback(res);
        } catch (err: any) {
          if (!err.message.includes('404')) {
            console.warn(`Silenced fetch error for ${url}:`, err.message);
          }
        }
      };

      await safeApiCall(`/api/v1/identity/passport/${did}`, (res) => {
        usePassportStore.getState().setPassportData({
          verificationStatus: res.data.verification_status,
          humanityStatus: res.data.humanity_status,
        });
      });

      await safeApiCall(`/api/v1/trust/${did}`, (res) => {
        useTrustStore.getState().setTrustMetrics({
          compositeScore: res.data.composite_trust,
          humanityScore: res.data.humanity_score,
          riskScore: res.data.risk_score,
        });
      });

      await safeApiCall(`/api/v1/guardian/recommendations/${did}`, (res) => {
        useGuardianStore.getState().setRecommendations(res.data.recommendations || []);
      });

      await safeApiCall(`/api/v1/events/timeline/${did}`, (res) => {
        useEventsStore.getState().setEvents(res.data || []);
      });
    };

    fetchBackendData();
    const interval = setInterval(fetchBackendData, 5000); // Poll every 5s
    
    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
};
