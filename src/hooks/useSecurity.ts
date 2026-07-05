import { useEffect } from 'react';
import { PluginListenerHandle, registerPlugin } from '@capacitor/core';
import { securityService } from '../services/securityService';
import { authService } from '../services/authService';

export interface SecurityPluginInterface {
  addListener(
    eventName: 'securityViolation',
    listenerFunc: (info: { type: string; timestamp: number }) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  setAdminMode(options: { enable: boolean }): Promise<void>;
}

const SecurityPlugin = registerPlugin<SecurityPluginInterface>('SecurityPlugin');

export function useSecurity(user: any, isAdmin: boolean = false) {
  useEffect(() => {
    if (user) {
      securityService.setUser(user);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return; // Only activate if user is logged in

    let pluginListener: PluginListenerHandle | undefined;
    let devtoolsInterval: NodeJS.Timeout | undefined;

    const setupSecurity = async () => {
      // If user is marked as admin, double check with the server
      let isVerifiedAdmin = false;
      if (isAdmin) {
        isVerifiedAdmin = await authService.verifyAdminAccess();
        if (!isVerifiedAdmin) {
          authService.forceLogoutAndLock();
          return null; // Return empty cleanup
        }
      }

      if (isVerifiedAdmin) {
        document.body.classList.add('admin-mode');
        try {
          if (SecurityPlugin.setAdminMode) {
            await SecurityPlugin.setAdminMode({ enable: true });
          }
        } catch (e) {
          // Native method might not exist yet, ignore
        }
        return () => {
          document.body.classList.remove('admin-mode');
        };
      } else {
        document.body.classList.remove('admin-mode');
        try {
          if (SecurityPlugin.setAdminMode) {
            await SecurityPlugin.setAdminMode({ enable: false });
          }
        } catch (e) {
        }
      }

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

      // Fires when the OS screenshot tool, Snipping Tool, or a screen-recording
      // overlay steals focus from the browser window. Not proof of capture, but
      // a real auditable signal — logged at 'low' severity like copy-paste.
      const handleVisibilityChange = () => {
        if (document.hidden) {
          securityService.reportViolation('screen_focus_lost', 'low');
        }
      };

      const handleWindowBlur = () => {
        securityService.reportViolation('window_blur', 'low');
      };

      window.addEventListener('contextmenu', handleContextMenu);
      window.addEventListener('copy', handleCopyCut);
      window.addEventListener('cut', handleCopyCut);
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleWindowBlur);

      // DevTools detection interval
      devtoolsInterval = setInterval(() => {
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
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleWindowBlur);
        if (devtoolsInterval) clearInterval(devtoolsInterval);
        if (pluginListener) {
          pluginListener.remove();
        }
        document.body.classList.remove('admin-mode');
      };
    };

    let cleanupFn: (() => void) | null = null;
    setupSecurity().then(cleanup => {
      if (cleanup) cleanupFn = cleanup;
    });

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [user, isAdmin]);
}
