import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.student.os',
  appName: 'Student OS',
  webDir: 'dist',
  bundledWebRuntime: false,
  // server: {
  //   url: 'http://192.168.X.X:3000', // এখানে আপনার পিসির Local IP Address দিন
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#f8fafc",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;
