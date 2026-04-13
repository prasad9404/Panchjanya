import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.panchajanya.app',
    appName: 'Panchajanya',
    webDir: 'dist',
    server: {
        url: 'https://panchajanya.vercel.app',
        cleartext: false,
        androidScheme: 'https'
    }
};

export default config;
