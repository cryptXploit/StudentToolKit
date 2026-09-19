import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export async function shareContent(title: string, text: string) {
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title, text, dialogTitle: 'Share your result' });
    } else {
      if (navigator.share) {
        await navigator.share({ title, text });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
      }
    }
  } catch (error) {
    // Silently ignore user cancellations
  }
}
