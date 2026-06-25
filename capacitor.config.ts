import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shathi.app',
  appName: 'Shathi',
  webDir: 'public',
  server: {
    url: 'https://shathi.vercel.app',
    cleartext: true
  }
};

export default config;
