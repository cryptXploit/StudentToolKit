import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

export async function initializeAds() {
  if (Capacitor.isNativePlatform()) {
    try {
      await AdMob.initialize({});
      console.log('AdMob initialized');
    } catch (e) {
      console.error('AdMob initialization failed', e);
    }
  }
}

export async function showToolsBanner() {
  if (Capacitor.isNativePlatform()) {
    try {
      await AdMob.showBanner({
        adId: 'ca-app-pub-3940256099942544/6300978111', // Google Test Banner ID
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 64, // Elevate above the bottom navigation bar
        isTesting: true
      });
    } catch (e) {
      console.error('Banner failed to load', e);
    }
  }
}

export async function hideToolsBanner() {
  if (Capacitor.isNativePlatform()) {
    try {
      await AdMob.hideBanner();
      await AdMob.removeBanner();
    } catch (e) {
      console.error('Failed to hide banner', e);
    }
  }
}
