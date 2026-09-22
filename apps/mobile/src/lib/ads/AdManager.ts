import { AdMob, BannerAdPosition, BannerAdSize, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Network } from '@capacitor/network';
import { db } from '@student-os/storage';

const BANNER_TEST_ID = 'ca-app-pub-3940256099942544/6300978111';
const INTERSTITIAL_TEST_ID = 'ca-app-pub-3940256099942544/1033173712';
const REWARDED_TEST_ID = 'ca-app-pub-3940256099942544/5224354917';

class AdManagerService {
  private isInitialized = false;

  async isEligible(): Promise<boolean> {
    try {
      const status = await Network.getStatus();
      if (!status.connected) return false;

      const profile = await db.profile.get('me');
      if (profile?.focusPassExpiresAt && profile.focusPassExpiresAt > Date.now()) {
        return false;
      }
      
      if (profile?.adFreeUnlocked) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      await AdMob.initialize({ initializeForTesting: true });
      this.isInitialized = true;
    } catch (e) {
      console.warn('AdMob init failed', e);
    }
  }

  async showBanner(): Promise<void> {
    try {
      const eligible = await this.isEligible();
      if (!eligible) return;

      await this.initialize();
      await AdMob.showBanner({
        adId: BANNER_TEST_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 90,
        isTesting: true,
      });
    } catch (e) {
      console.warn('AdMob showBanner failed', e);
    }
  }

  async hideBanner(): Promise<void> {
    try {
      await AdMob.hideBanner();
      await AdMob.removeBanner();
    } catch (e) {
      console.warn('AdMob hideBanner failed', e);
    }
  }

  async showInterstitial(): Promise<void> {
    try {
      const eligible = await this.isEligible();
      if (!eligible) return;

      await this.initialize();
      await AdMob.prepareInterstitial({
        adId: INTERSTITIAL_TEST_ID,
        isTesting: true,
      });
      await AdMob.showInterstitial();
    } catch (e) {
      console.warn('AdMob showInterstitial failed', e);
    }
  }

  async showRewarded(): Promise<boolean> {
    try {
      const eligible = await this.isEligible();
      if (!eligible) return false;

      await this.initialize();

      return new Promise<boolean>(async (resolve) => {
        let rewarded = false;

        const onRewarded = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
          rewarded = true;
        });

        const onDismissed = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
          onRewarded.remove().catch(() => {});
          onDismissed.remove().catch(() => {});
          resolve(rewarded);
        });

        try {
          await AdMob.prepareRewardVideoAd({
            adId: REWARDED_TEST_ID,
            isTesting: true,
          });
          await AdMob.showRewardVideoAd();
        } catch (e) {
          onRewarded.remove().catch(() => {});
          onDismissed.remove().catch(() => {});
          resolve(false);
        }
      });
    } catch (e) {
      console.warn('AdMob showRewarded failed', e);
      return false;
    }
  }
}

export const AdManager = new AdManagerService();
