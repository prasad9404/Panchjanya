import { useEffect } from 'react';
import { IsRoot } from '@capgo/capacitor-is-root';
import { securityService } from '../services/securityService';
import { Capacitor } from '@capacitor/core';

export function useRootDetection() {
  useEffect(() => {
    const checkRoot = async () => {
      if (Capacitor.getPlatform() === 'web') return;

      try {
        const { result } = await IsRoot.isRooted();
        if (result) {
          await securityService.reportViolation(
            Capacitor.getPlatform() === 'ios' ? 'jailbroken_device' : 'rooted_device', 
            'critical'
          );
        }
      } catch (error) {
        console.error('Root detection check failed', error);
      }
    };

    checkRoot();
  }, []);
}
