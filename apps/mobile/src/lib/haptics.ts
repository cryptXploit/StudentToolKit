import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export async function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (Capacitor.isNativePlatform()) {
    let nativeStyle = ImpactStyle.Light;
    if (style === 'medium') nativeStyle = ImpactStyle.Medium;
    if (style === 'heavy') nativeStyle = ImpactStyle.Heavy;

    try {
      await Haptics.impact({ style: nativeStyle });
    } catch (e) {
      // Ignore
    }
  }
}
