import { useEffect } from 'react';
import { PluginListenerHandle, registerPlugin } from '@capacitor/core';
import { securityService } from '../services/securityService';

export interface SecurityPluginInterface {
  addListener(
    eventName: 'securityViolation',
    listenerFunc: (info: { type: string; timestamp: number }) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
}

const SecurityPlugin = registerPlugin<SecurityPluginInterface>('SecurityPlugin');

export function useSecurity(user: any) {
  useEffect(() => {
    if (user) {
      securityService.setUser(user);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return; // Only activate if user is logged in

    let pluginListener: PluginListenerHandle | undefined;

    const setupNativeListener = async () => {
      try {
        pluginListener = await SecurityPlugin.addListener('securityViolation', (info) => {
          securityService.reportViolation(info.type as any, 'high');
        });
      } catch (e) {
        // Plugin might not be available on web
      }
    };

    setupNativeListener();

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      securityService.reportViolation('copy_paste_attempt', 'low');
    };

    const handleCopyCut = (e: ClipboardEvent) => {
      e.preventDefault();
      securityService.reportViolation('copy_paste_attempt', 'low');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        securityService.reportViolation('screenshot_attempt', 'high');
      }

      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        securityService.reportViolation('devtools_open', 'high');
      }

      // Ctrl/Cmd + shortcuts
      if (e.ctrlKey || e.metaKey) {
        const forbiddenKeys = ['c', 'v', 's', 'a', 'p', 'u'];
        if (forbiddenKeys.includes(e.key.toLowerCase())) {
          e.preventDefault();
          securityService.reportViolation('keyboard_shortcut', 'low');
        }
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopyCut);
    window.addEventListener('cut', handleCopyCut);
    window.addEventListener('keydown', handleKeyDown);

    // DevTools detection interval
    const devtoolsInterval = setInterval(() => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      
      // If the difference is greater than 160, devtools might be open
      if (widthDiff > 160 || heightDiff > 160) {
        // On mobile web, heightDiff can be high due to keyboard. Add basic check.
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!isMobile) {
          securityService.reportViolation('devtools_open', 'medium');
        }
      }
    }, 2000);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopyCut);
      window.removeEventListener('cut', handleCopyCut);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(devtoolsInterval);
      if (pluginListener) {
        pluginListener.remove();
      }
    };
  }, [user]);
}
