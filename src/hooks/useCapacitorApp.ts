import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Dialog } from '@capacitor/dialog';
import { Capacitor } from '@capacitor/core';
import { Toast } from '@capacitor/toast';

export const useCapacitorApp = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setupNativeApp();
    }
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const handleBackButton = async () => {
        const rootPaths = ['/', '/auth/splash', '/auth/welcome', '/dashboard'];
        
        if (rootPaths.includes(location.pathname)) {
          const { value } = await Dialog.confirm({
            title: 'Exit App',
            message: 'Are you sure you want to exit?',
            okButtonTitle: 'Exit',
            cancelButtonTitle: 'Cancel',
          });

          if (value) {
            App.exitApp();
          }
        } else {
          // Go back if history exists
          if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
          } else {
            navigate('/dashboard');
          }
        }
      };

      const listener = App.addListener('backButton', handleBackButton);

      return () => {
        listener.then(l => l.remove());
      };
    }
  }, [location.pathname, navigate]);

  const setupNativeApp = async () => {
    try {
      // Configure Status Bar
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setOverlaysWebView({ overlay: false });

      // Hide splash screen after initialization
      await SplashScreen.hide();
    } catch (error) {
      console.warn('Capacitor native setup error:', error);
    }
  };

  const showToast = async (text: string) => {
    if (Capacitor.isNativePlatform()) {
      await Toast.show({ text, duration: 'short' });
    }
  };

  return { showToast };
};
