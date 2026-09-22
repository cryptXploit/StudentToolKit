import { useEffect } from 'react';
import { AdManager } from '../lib/ads/AdManager';

export function useBannerAd() {
  useEffect(() => {
    AdManager.showBanner();
    return () => {
      AdManager.hideBanner();
    };
  }, []);
}
