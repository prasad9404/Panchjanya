import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.panchjanyaa.app',
    appName: 'Panchjanya',
    webDir: 'dist',
    server: {
        url: "https://panchjanyaa.vercel.app",
        cleartext: true,
        allowNavigation: ["panchjanyaa.vercel.app"]
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 3000,
            launchAutoHide: false, // We hide it manually in our hook
            backgroundColor: "#ffffff",
            androidSplashResourceName: "splash",
            androidScaleType: "CENTER_CROP",
            showSpinner: true,
            androidSpinnerStyle: "large",
            iosSpinnerStyle: "small",
            spinnerColor: "#1e3a8a",
        },
        Keyboard: {
            resize: "none",
            style: "dark",
            resizeOnFullScreen: true,
        },
    },
};

export default config;
