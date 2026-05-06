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
            launchShowDuration: 2000,
            launchAutoHide: false, // We hide it manually in our hook
            backgroundColor: "#ffffffff",
            androidSplashResourceName: "splash",
            androidScaleType: "CENTER_CROP",
            showSpinner: false,
        },
        Keyboard: {
            resize: "body",
            style: "dark",
            resizeOnFullScreen: true,
        },
    },
};

export default config;
