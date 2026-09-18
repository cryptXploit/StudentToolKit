const fs = require('fs');
const path = 'apps/mobile/android/app/src/main/AndroidManifest.xml';
let content = fs.readFileSync(path, 'utf8');
if (!content.includes('com.google.android.gms.ads.APPLICATION_ID')) {
    content = content.replace('</application>', '    <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="ca-app-pub-3940256099942544~3347511713"/>\n    </application>');
    fs.writeFileSync(path, content);
    console.log('AdMob ID injected into AndroidManifest.xml');
} else {
    console.log('AdMob ID already present.');
}
