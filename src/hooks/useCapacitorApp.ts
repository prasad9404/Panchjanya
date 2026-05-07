import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { Toast } from '@capacitor/toast';
import { Network } from '@capacitor/network';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

export const useCapacitorApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use refs to access the latest state inside the Capacitor listeners
  // without re-triggering the useEffect and recreating listeners.
  const locationRef = useRef(location.pathname);
  const lastBackPressRef = useRef(0);

  // Keep ref synced with current router location
  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    // Only run native setup on mobile devices
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const setupNativeUI = async () => {
      try {
        // 1. Status Bar Styling
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#1e3a8a' }); // Theme color
        await StatusBar.setOverlaysWebView({ overlay: false });
        
        // 2. Hide Splash Screen (App is ready)
        await SplashScreen.hide();

        // 3. Optional: Keyboard configuration
        if (Capacitor.getPlatform() === 'android') {
          await Keyboard.setResizeMode({ mode: KeyboardResize.None });
        }
      } catch (error) {
        console.warn('Native plugins not available in this environment:', error);
      }
    };

    setupNativeUI();

    // 4. Hardware Back Button Handling
    const backButtonListener = App.addListener('backButton', async ({ canGoBack }) => {
      // Define routes that act as "root" where pressing back should prompt to exit
      const rootPaths = ['/', '/auth/splash', '/auth/welcome', '/dashboard'];
      const currentPath = locationRef.current;
      
      const isRoot = rootPaths.includes(currentPath);

      if (isRoot) {
        const now = Date.now();
        const timeLimit = 2000; // 2 seconds

        if (now - lastBackPressRef.current < timeLimit) {
          // User pressed back twice within 2 seconds
          App.exitApp();
        } else {
          // First press on root route
          lastBackPressRef.current = now;
          await Toast.show({
            text: 'Press back again to exit',
            duration: 'short',
            position: 'bottom',
          });
        }
      } else {
        // Go back if history exists
        if (window.history.state && window.history.state.idx > 0) {
          navigate(-1);
        } else {
          navigate('/dashboard');
        }
      }
    });

    // 5. Network / Offline Detection
    const networkListener = Network.addListener('networkStatusChange', async (status) => {
      if (!status.connected) {
        await Toast.show({
          text: 'You are offline. Please check your connection.',
          duration: 'long',
          position: 'top',
        });
      } else {
        await Toast.show({
          text: 'Connection restored',
          duration: 'short',
          position: 'top',
        });
      }
    });

    // Cleanup listeners on unmount
    return () => {
      backButtonListener.then(listener => listener.remove());
      networkListener.then(listener => listener.remove());
    };
  }, [navigate]); // Empty dependency array (aside from navigate) is crucial!

  const showToast = async (text: string) => {
    if (Capacitor.isNativePlatform()) {
      await Toast.show({ text, duration: 'short' });
    }
  };

  return { showToast };
};
