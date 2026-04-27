import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.panchjanyaa.app',
    appName: 'Panchjanya',
    webDir: 'dist',
    server: {
        url: "https://panchjanyaa.vercel.app",
        cleartext: true,
        allowNavigation: ["panchjanyaa.vercel.app"]
    }
};

export default config;
